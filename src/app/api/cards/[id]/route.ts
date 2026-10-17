import { CardService, deleteCard, updateCardColor, moveCard, updateCardFields, updateCardTitle, getCardById } from "../../../../services/cardService.ts";
import { prisma } from "../../../../lib/prisma.ts";
import { requireAuth } from "../../../../lib/auth.ts";

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
    const resolvedParams = await Promise.resolve(params);
    const card = await getCardById(resolvedParams.id);
    if (!card) return Response.json({ error: "Card não encontrado." }, { status: 404, headers: noStoreHeaders });
    return Response.json(card, { status: 200, headers: noStoreHeaders });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500, headers: noStoreHeaders });
  }
}


export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const session = await requireAuth(req).catch(() => null);
    const userId = session?.userId || req.headers.get("x-user-id") || undefined;

    const body = await req.json();
    const { fieldValues } = body;
    const updated = await updateCardFields(resolvedParams.id, fieldValues || {}, userId);
    return Response.json(updated);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: error.status || 400 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const session = await requireAuth(req).catch(() => null);
    const userId = session?.userId || req.headers.get("x-user-id") || undefined;

    const body = await req.json();

    if (body.title) {
      const updated = await updateCardTitle(resolvedParams.id, body.title, userId);
      return Response.json(updated);
    }

    if (body.dealValue !== undefined) {
      const val = parseFloat(body.dealValue) || 0;
      await prisma.card.update({
        where: { id: resolvedParams.id },
        data: { dealValue: val },
      });
      const updated = await getCardById(resolvedParams.id);
      return Response.json(updated);
    }

    if (body.color) {
      const updated = await updateCardColor(resolvedParams.id, body.color);
      return Response.json(updated);
    }

    if (body.targetPhaseId) {
      const updated = await moveCard(resolvedParams.id, body.targetPhaseId, body.fieldValues, userId);
      return Response.json(updated);
    }

    if (body.fieldValues) {
      const updated = await updateCardFields(resolvedParams.id, body.fieldValues, userId);
      return Response.json(updated);
    }

    return Response.json({ error: "Nenhum campo para atualização fornecido." }, { status: 400 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: error.status || 400 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const session = await requireAuth(req).catch(() => null);
    const userRole = req.headers.get("x-user-role") || session?.role || "MEMBER";
    const userId = req.headers.get("x-user-id") || session?.userId;

    await deleteCard(resolvedParams.id, userId, userRole);
    return Response.json({ success: true, message: "Card excluído com sucesso." }, { status: 200 });
  } catch (error: any) {
    const status = error.statusCode || error.status || 500;
    return Response.json({ error: error.message || "Erro ao excluir card." }, { status });
  }
}