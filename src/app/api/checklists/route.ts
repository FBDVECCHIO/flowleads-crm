import { prisma } from "../../../lib/prisma.ts";
import { persistDatabase, ensureDatabaseReady } from "../../../lib/dbSync.ts";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const noStoreHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  "Pragma": "no-cache",
  "Expires": "0",
};

export async function GET(req: Request) {
  try {
    await ensureDatabaseReady();
    const org = await prisma.organization.findFirst();
    if (!org) {
      return Response.json([], { status: 200, headers: noStoreHeaders });
    }

    const items = await prisma.checklistItem.findMany({
      where: { organizationId: org.id },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });

    return Response.json(items, { status: 200, headers: noStoreHeaders });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500, headers: noStoreHeaders });
  }
}

export async function POST(req: Request) {
  try {
    await ensureDatabaseReady();
    const body = await req.json();
    if (!body.title || !body.title.trim()) {
      return Response.json({ error: "Título do item de checklist é obrigatório." }, { status: 400, headers: noStoreHeaders });
    }

    const org = await prisma.organization.findFirst();
    if (!org) {
      return Response.json({ error: "Organização não encontrada." }, { status: 400, headers: noStoreHeaders });
    }

    // Determine order if not passed
    let order = Number(body.order);
    if (isNaN(order)) {
      const maxItem = await prisma.checklistItem.findFirst({
        where: { organizationId: org.id },
        orderBy: { order: "desc" },
      });
      order = maxItem ? maxItem.order + 1 : 1;
    }

    const item = await prisma.checklistItem.create({
      data: {
        organizationId: org.id,
        title: body.title.trim(),
        description: body.description?.trim() || null,
        order,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
      },
    });

    await persistDatabase();
    return Response.json(item, { status: 201, headers: noStoreHeaders });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500, headers: noStoreHeaders });
  }
}
