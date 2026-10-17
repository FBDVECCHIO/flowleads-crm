import { prisma } from "../../../../../lib/prisma.ts";
import { requireAuth } from "../../../../../lib/auth.ts";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const cardLabels = await prisma.cardLabel.findMany({
      where: { cardId: resolvedParams.id },
      include: { label: true },
    });
    return Response.json(cardLabels.map((cl) => cl.label));
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const body = await req.json();
    const { labelId } = body;

    if (!labelId) {
      return Response.json({ error: "labelId é obrigatório." }, { status: 400 });
    }

    const card = await prisma.card.findUnique({ where: { id: resolvedParams.id } });
    if (!card) {
      return Response.json({ error: "Card não encontrado." }, { status: 404 });
    }

    const existing = await prisma.cardLabel.findUnique({
      where: { cardId_labelId: { cardId: resolvedParams.id, labelId } },
    });

    if (existing) {
      await prisma.cardLabel.delete({
        where: { id: existing.id },
      });
    } else {
      await prisma.cardLabel.create({
        data: {
          cardId: resolvedParams.id,
          labelId,
        },
      });
    }

    const updatedCard = await prisma.card.findUnique({
      where: { id: resolvedParams.id },
      include: {
        labels: { include: { label: true } },
      },
    });

    return Response.json(updatedCard);
  } catch (error: any) {
    return Response.json({ error: error.message || "Erro ao atualizar etiqueta do card." }, { status: 500 });
  }
}
