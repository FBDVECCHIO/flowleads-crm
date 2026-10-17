import { prisma } from "../../../../../lib/prisma.ts";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const noStoreHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  "Pragma": "no-cache",
  "Expires": "0",
};

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: cardId } = await params;
    const { checklistId, itemId, completed } = await req.json();

    let checklist = checklistId
      ? await prisma.cardChecklist.findUnique({ where: { id: checklistId } })
      : await prisma.cardChecklist.findFirst({ where: { cardId } });

    if (!checklist) {
      // Create initial card checklist if not exists
      checklist = await prisma.cardChecklist.create({
        data: {
          cardId,
          title: "Checklist do Lead",
          items: "[]",
        },
      });
    }

    const items: any[] = JSON.parse(checklist.items || "[]");
    let found = false;
    const updatedItems = items.map((it) => {
      if (it.id === itemId) {
        found = true;
        return { ...it, completed: Boolean(completed) };
      }
      return it;
    });

    if (!found) {
      const templateItem = await prisma.checklistItem.findUnique({ where: { id: itemId } }).catch(() => null);
      updatedItems.push({
        id: itemId,
        text: templateItem?.title || "Item de verificação",
        completed: Boolean(completed),
      });
    }

    const updated = await prisma.cardChecklist.update({
      where: { id: checklist.id },
      data: { items: JSON.stringify(updatedItems) },
    });

    return Response.json(updated, { status: 200, headers: noStoreHeaders });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500, headers: noStoreHeaders });
  }
}