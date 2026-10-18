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
        form_name?: string;
        ad_id?: string;
        ad_name?: string;
        adset_id?: string;
        adset_name?: string;
        campaign_id?: string;
        campaign_name?: string;
        platform?: string;
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
    campaign_name?: string;
    adset_id?: string;
    adset_name?: string;
    ad_id?: string;
    ad_name?: string;
    form_id?: string;
    form_name?: string;
    platform?: string;
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

  // 3. Intelligent WhatsApp routing by commercial number
  let assignedToUserId: string | null = null;
  let targetWhatsapp = overrideData?.destination_whatsapp;

  // Se não foi enviado destination_whatsapp explícito, checar se o nome do anúncio ou do grupo contém telefone ou final
  if (!targetWhatsapp && (overrideData?.adset_name || overrideData?.ad_name)) {
    const combinedAdText = `${overrideData?.adset_name || ""} ${overrideData?.ad_name || ""}`;
    const phoneRegex = /(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?(?:9?\d{4}[-\s]?\d{4})/g;
    const foundPhones = combinedAdText.match(phoneRegex);
    if (foundPhones && foundPhones.length > 0) {
      targetWhatsapp = foundPhones[0];
    }
  }

  if (targetWhatsapp) {
    const cleanTarget = targetWhatsapp.replace(/\D/g, "");
    const allUsers = await prisma.user.findMany({
      where: { whatsappNumber: { not: null } },
    });

    const matchedRep = allUsers.find((u) => {
      if (!u.whatsappNumber) return false;
      const cleanU = u.whatsappNumber.replace(/\D/g, "");
      if (!cleanU || !cleanTarget) return false;

      // 1. Igualdade exata de todos os dígitos
      if (cleanU === cleanTarget) return true;

      // 2. Um é sufixo exato do outro (ex: com ou sem DDI 55, com ou sem DDD)
      if (cleanU.endsWith(cleanTarget) || cleanTarget.endsWith(cleanU)) return true;

      // 3. Comparação dos últimos 8 ou 9 dígitos (núcleo do celular no Brasil)
      if (cleanU.length >= 8 && cleanTarget.length >= 8) {
        if (cleanU.slice(-8) === cleanTarget.slice(-8)) return true;
        if (cleanU.slice(-9) === cleanTarget.slice(-9)) return true;
      }

      // 4. Suffix matching (ex: "final 45", "final 9945")
      if (cleanTarget.length >= 2 && cleanU.endsWith(cleanTarget)) return true;

      return false;
    });

    if (matchedRep) {
      assignedToUserId = matchedRep.id;
    }
  }

  // Se não houver correspondência exata de vendedor, atribui ao Supervisor para triagem e notificação
  if (!assignedToUserId) {
    const supervisor = await prisma.user.findFirst({
      where: { role: { in: ["SUPERVISOR", "ADMIN"] } },
    });
    if (supervisor) {
      assignedToUserId = supervisor.id;
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
      valToSet = (overrideData?.campaign_name || overrideData?.campaign_id)?.toUpperCase();
    } else if (ident.includes("grupo") || ident.includes("adset")) {
      valToSet = (overrideData?.adset_name || overrideData?.adset_id)?.toUpperCase();
    } else if (ident.includes("anuncio") || ident.includes("ad_name")) {
      valToSet = (overrideData?.ad_name || overrideData?.ad_id)?.toUpperCase();
    } else if (ident.includes("canal") || ident.includes("plataforma") || ident.includes("platform")) {
      valToSet = overrideData?.platform ? overrideData.platform.toUpperCase() : "INSTAGRAM / META";
    }

    if (valToSet) {
      await prisma.cardFieldValue.upsert({
        where: { cardId_fieldId: { cardId: card.id, fieldId: field.id } },
        create: { cardId: card.id, fieldId: field.id, value: String(valToSet) },
        update: { value: String(valToSet) },
      });
    }
  }

  // Auto-vincular checklist padrão cadastrado pelo Supervisor e auto-espelhar campanha
  const org = await prisma.organization.findFirst();
  if (org) {
    // 1. Auto-espelhar campanha da Meta Ads na Central de Cadastros
    const rawCampName = (overrideData?.campaign_name || overrideData?.campaign_id)?.trim().toUpperCase();
    if (rawCampName) {
      try {
        const existingCamp = await prisma.campaign.findFirst({
          where: {
            organizationId: org.id,
            name: rawCampName,
          },
        });
        if (!existingCamp) {
          await prisma.campaign.create({
            data: {
              organizationId: org.id,
              name: rawCampName,
              description: `[META ADS ID: ${overrideData?.campaign_id || leadgenId.slice(-6)}] Status: ACTIVE • Ingerida via anúncio Meta Ads`,
              isActive: true,
              products: '["lente","armação","óculos completo"]',
            },
          });
        }
      } catch {
        // Ignora para não impedir criação do lead
      }
    }

    // 2. Auto-vincular checklist padrão
    const standardItems = await prisma.checklistItem.findMany({
      where: { organizationId: org.id, isActive: true },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });
    if (standardItems.length > 0) {
      await prisma.cardChecklist.create({
        data: {
          cardId: card.id,
          title: "Checklist do Lead",
          items: JSON.stringify(
            standardItems.map((si) => ({
              id: si.id,
              text: si.title,
              completed: false,
            }))
          ),
        },
      }).catch(() => {});
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

  // Inserir comentário estruturado com rastreabilidade da Meta Ads
  const campaignInfo = overrideData?.campaign_name || overrideData?.campaign_id || "NÃO ESPECIFICADA";
  const adsetInfo = overrideData?.adset_name || overrideData?.adset_id || "GERAL / ABERTO";
  const adInfo = overrideData?.ad_name || overrideData?.ad_id || "ANÚNCIO PADRÃO";
  const platformInfo = (overrideData?.platform || "INSTAGRAM / META ADS").toUpperCase();
  const formInfo = overrideData?.form_name || overrideData?.form_id || "FORMULÁRIO INSTANTÂNEO";

  await prisma.cardComment.create({
    data: {
      cardId: card.id,
      userId: assignedToUserId || undefined,
      authorName: "Meta Ads System",
      content: `🎯 DADOS DE ORIGEM DO ANÚNCIO (META ADS):\n• Ciclo / Campanha: ${campaignInfo}\n• Grupo de Anúncios: ${adsetInfo}\n• Anúncio / Criativo: ${adInfo}\n• Plataforma de Exibição: ${platformInfo}\n• Formulário: ${formInfo}\n• Lead ID Meta: ${leadgenId}`,
    },
  }).catch(() => {});

  // Log activity
  await prisma.cardActivity.create({
    data: {
      cardId: card.id,
      userId: assignedToUserId || undefined,
      actionType: "CREATED",
      details: `Lead ingerido automaticamente via Meta Ads (leadgen_id: ${leadgenId}, campanha: ${campaignInfo}). Roteado para WhatsApp ${targetWhatsapp || "Padrão"}.`,
    },
  });

  return {
    cardId: card.id,
    assignedToUserId,
  };
}
