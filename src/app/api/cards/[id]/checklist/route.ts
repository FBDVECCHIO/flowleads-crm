import { prisma } from "../../../../../lib/prisma.ts";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: cardId } = await params;
    const { checklistId, itemId, completed } = await req.json();

    const checklist = await prisma.cardChecklist.findUnique({
      where: { id: checklistId },
    });
    if (!checklist) return Response.json({ error: "Checklist não encontrado." }, { status: 404 });

    const items: any[] = JSON.parse(checklist.items || "[]");
    const updatedItems = items.map((it) => (it.id === itemId ? { ...it, completed } : it));

    const updated = await prisma.cardChecklist.update({
      where: { id: checklistId },
      data: { items: JSON.stringify(updatedItems) },
    });

    return Response.json(updated);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}