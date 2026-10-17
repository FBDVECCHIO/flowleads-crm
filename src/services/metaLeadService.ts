import crypto from "node:crypto";
import { prisma } from "../lib/prisma.ts";
import { maskPhone } from "../lib/utils.ts";

export interface MetaWebhookPayload {
  entry: Array<{
    id: string;
    changes: Array<{
      field: string;
      value: {
        leadgen_id: string;
        form_id: string;
        ad_id?: string;
        adset_id?: string;
        campaign_id?: string;
        destination_whatsapp?: string;
        created_time: number;
        lead_data?: {
          name?: string;
          phone?: string;
          email?: string;
          dealValue?: number;
          [key: string]: any;
        };
      };
    }>;
  }>;
}

/**
 * Verify Meta Webhook POST payload HMAC-SHA256 signature (x-hub-signature-256)
 * Uses timingSafeEqual to protect against side-channel timing attacks.
 */
export function verifyMetaSignature(
  rawBody: string,
  signatureHeader: string,
  appSecret: string = process.env.META_APP_SECRET || "meta_app_secret_xyz123"
): boolean {
  if (!rawBody || !signatureHeader || !appSecret) return false;

  const sigHex = signatureHeader.startsWith("sha256=")
    ? signatureHeader.slice(7)
    : signatureHeader;

  const computedHex = crypto
    .createHmac("sha256", appSecret)
    .update(rawBody, "utf8")
    .digest("hex");

  if (sigHex.length !== computedHex.length) return false;

  try {
    return crypto.timingSafeEqual(
      Buffer.from(sigHex, "utf8"),
      Buffer.from(computedHex, "utf8")
    );
  } catch {
    return false;
  }
}

/**
 * Process inbound Meta Leadgen event:
 * - Extracts lead parameters (simulating Graph API or parsing payload)
 * - Identifies initial phase ("Novos Leads" or first phase)
 * - Intelligently routes lead to sales rep matching destination WhatsApp (F17 / F9)
 * - Creates Card in initial phase and links assigned sales rep
 */
export async function processMetaLead(
  leadgenId: string,
  pipeId?: string,
  overrideData?: {
    name?: string;
    phone?: string;
    email?: string;
    dealValue?: number;
    destination_whatsapp?: string;
    campaign_id?: string;
  }
): Promise<{ cardId: string; assignedToUserId: string | null }> {
  // 1. Resolve Pipe
  let targetPipeId = pipeId;
  if (!targetPipeId) {
    const defaultPipe = await prisma.pipe.findFirst({
      include: { phases: { orderBy: { order: "asc" } } },
    });
    if (!defaultPipe) throw new Error("Nenhum Pipe encontrado para ingestão de leads.");
    targetPipeId = defaultPipe.id;
  }

  // 2. Resolve initial phase ("Novos Leads", "Novo Lead", or first phase)
  const initialPhase = await prisma.phase.findFirst({
    where: {
      pipeId: targetPipeId,
      OR: [
        { name: { contains: "Novo" } },
        { name: { contains: "Lead" } },
        { name: { contains: "Entrada" } },
      ],
    },
    orderBy: { order: "asc" },
  }) || (await prisma.phase.findFirst({
    where: { pipeId: targetPipeId },
    orderBy: { order: "asc" },
  }));

  if (!initialPhase) {
    throw new Error("Nenhuma fase inicial encontrada no Pipe.");
  }

  // 3. Intelligent WhatsApp routing (F17 / F9)
  let assignedToUserId: string | null = null;
  const targetWhatsapp = overrideData?.destination_whatsapp;

  if (targetWhatsapp) {
    const cleanTarget = targetWhatsapp.replace(/\D/g, "");
    const allUsers = await prisma.user.findMany({
      where: { whatsappNumber: { not: null } },
    });
    const matchedRep = allUsers.find((u) => {
      if (!u.whatsappNumber) return false;
      const cleanU = u.whatsappNumber.replace(/\D/g, "");
      return cleanU === cleanTarget || cleanU.endsWith(cleanTarget) || cleanTarget.endsWith(cleanU);
    });
    if (matchedRep) {
      assignedToUserId = matchedRep.id;
    }
  }

  // If no direct WhatsApp match, check default supervisor or unassigned
  if (!assignedToUserId) {
    const fallbackRep = await prisma.user.findFirst({
      where: { role: "MEMBER" },
    });
    if (fallbackRep) {
      assignedToUserId = fallbackRep.id;
    }
  }

  // 4. Create Card in initial phase
  const leadTitle = (
    overrideData?.name
      ? `LEAD META: ${overrideData.name}`
      : `NOVO LEAD META #${leadgenId.slice(-6)}`
  ).toUpperCase();

  const card = await prisma.card.create({
    data: {
      pipeId: targetPipeId,
      currentPhaseId: initialPhase.id,
      title: leadTitle,
      dealValue: overrideData?.dealValue ?? 0,
      priority: "HIGH",
      phaseEnteredAt: new Date(),
      createdById: assignedToUserId,
    },
  });

  // Salvar valores dos campos se existirem no pipe (telefone, email, campanha)
  const pipeFields = await prisma.field.findMany({
    where: { pipeId: targetPipeId },
  });

  for (const field of pipeFields) {
    let valToSet: string | undefined;
    const ident = field.identifier.toLowerCase();
    if (ident.includes("phone") || ident.includes("telefone") || ident.includes("whatsapp")) {
      const rawPhone = overrideData?.phone || overrideData?.destination_whatsapp;
      valToSet = rawPhone ? maskPhone(rawPhone) : undefined;
    } else if (ident.includes("mail")) {
      valToSet = overrideData?.email;
    } else if (ident.includes("campanha") || ident.includes("campaign")) {
      valToSet = overrideData?.campaign_id ? overrideData.campaign_id.toUpperCase() : undefined;
    }

    if (valToSet) {
      await prisma.cardFieldValue.upsert({
        where: { cardId_fieldId: { cardId: card.id, fieldId: field.id } },
        create: { cardId: card.id, fieldId: field.id, value: String(valToSet) },
        update: { value: String(valToSet) },
      });
    }
  }

  // Assign user to card
  if (assignedToUserId) {
    await prisma.cardAssignee.create({
      data: {
        cardId: card.id,
        userId: assignedToUserId,
      },
    });
  }

  // Log activity
  await prisma.cardActivity.create({
    data: {
      cardId: card.id,
      userId: assignedToUserId || undefined,
      actionType: "CREATED",
      details: `Lead ingerido automaticamente via Meta Ads (leadgen_id: ${leadgenId}). Roteado para WhatsApp ${targetWhatsapp || "Padrão"}.`,
    },
  });

  return {
    cardId: card.id,
    assignedToUserId,
  };
}
