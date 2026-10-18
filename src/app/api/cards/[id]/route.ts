import { CardService, deleteCard, updateCardColor, moveCard, updateCardFields, updateCardTitle, getCardById } from "../../../../services/cardService.ts";
import { prisma } from "../../../../lib/prisma.ts";
import { requireAuth } from "../../../../lib/auth.ts";
import { persistDatabase } from "../../../../lib/dbSync.ts";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const noStoreHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  "Pragma": "no-cache",
  "Expires": "0",
};

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await requireAuth(req);
    const resolvedParams = await Promise.resolve(params);
    const card = await getCardById(resolvedParams.id);
    if (!card) return Response.json({ error: "Card não encontrado." }, { status: 404, headers: noStoreHeaders });

    if (session.organizationId && card.pipe?.organizationId && card.pipe.organizationId !== session.organizationId) {
      return Response.json({ error: "Acesso não autorizado a este registro." }, { status: 403, headers: noStoreHeaders });
    }

    return Response.json(card, { status: 200, headers: noStoreHeaders });
  } catch (error: any) {
    const status = error.status || error.statusCode || 500;
    return Response.json({ error: error.message }, { status, headers: noStoreHeaders });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await requireAuth(req);
    const resolvedParams = await Promise.resolve(params);
    const card = await getCardById(resolvedParams.id);
    if (!card) return Response.json({ error: "Card não encontrado." }, { status: 404, headers: noStoreHeaders });

    if (session.organizationId && card.pipe?.organizationId && card.pipe.organizationId !== session.organizationId) {
      return Response.json({ error: "Acesso não autorizado a este registro." }, { status: 403, headers: noStoreHeaders });
    }

    const body = await req.json();
    const { fieldValues } = body;
    const updated = await updateCardFields(resolvedParams.id, fieldValues || {}, session.userId);
    return Response.json(updated, { status: 200, headers: noStoreHeaders });
  } catch (error: any) {
    const status = error.status || error.statusCode || 400;
    return Response.json({ error: error.message }, { status, headers: noStoreHeaders });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await requireAuth(req);
    const resolvedParams = await Promise.resolve(params);
    const card = await getCardById(resolvedParams.id);
    if (!card) return Response.json({ error: "Card não encontrado." }, { status: 404, headers: noStoreHeaders });

    if (session.organizationId && card.pipe?.organizationId && card.pipe.organizationId !== session.organizationId) {
      return Response.json({ error: "Acesso não autorizado a este registro." }, { status: 403, headers: noStoreHeaders });
    }

    const userId = session.userId;
    const body = await req.json();

    if (body.title) {
      const updated = await updateCardTitle(resolvedParams.id, body.title, userId);
      return Response.json(updated, { status: 200, headers: noStoreHeaders });
    }

    if (body.dealValue !== undefined) {
      const val = parseFloat(body.dealValue) || 0;
      await prisma.card.update({
        where: { id: resolvedParams.id },
        data: { dealValue: val },
      });
      await persistDatabase();
      const updated = await getCardById(resolvedParams.id);
      return Response.json(updated, { status: 200, headers: noStoreHeaders });
    }

    if (body.color) {
      const updated = await updateCardColor(resolvedParams.id, body.color);
      return Response.json(updated, { status: 200, headers: noStoreHeaders });
    }

    if (body.targetPhaseId) {
      const updated = await moveCard(resolvedParams.id, body.targetPhaseId, body.fieldValues, userId);
      return Response.json(updated, { status: 200, headers: noStoreHeaders });
    }

    if (body.fieldValues) {
      const updated = await updateCardFields(resolvedParams.id, body.fieldValues, userId);
      return Response.json(updated, { status: 200, headers: noStoreHeaders });
    }

    return Response.json({ error: "Nenhum campo para atualização fornecido." }, { status: 400, headers: noStoreHeaders });
  } catch (error: any) {
    const status = error.status || error.statusCode || 400;
    return Response.json({ error: error.message }, { status, headers: noStoreHeaders });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const session = await requireAuth(req);
    const card = await getCardById(resolvedParams.id);
    if (!card) return Response.json({ error: "Card não encontrado." }, { status: 404, headers: noStoreHeaders });

    if (session.organizationId && card.pipe?.organizationId && card.pipe.organizationId !== session.organizationId) {
      return Response.json({ error: "Acesso não autorizado a este registro." }, { status: 403, headers: noStoreHeaders });
    }

    await deleteCard(resolvedParams.id, session.userId, session.role);
    return Response.json({ success: true, message: "Card excluído com sucesso." }, { status: 200, headers: noStoreHeaders });
  } catch (error: any) {
    const status = error.statusCode || error.status || 500;
    return Response.json({ error: error.message || "Erro ao excluir card." }, { status, headers: noStoreHeaders });
  }
}