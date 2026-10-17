import { prisma } from "../../../lib/prisma.ts";

export async function GET() {
  try {
    const stores = await prisma.store.findMany({
      include: {
        sellers: true,
        _count: { select: { sellers: true } },
      },
      orderBy: { name: "asc" },
    });
    return Response.json(stores);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.name || !body.name.trim()) {
      return Response.json({ error: "Nome da loja é obrigatório." }, { status: 400 });
    }

    const org = await prisma.organization.findFirst();
    if (!org) return Response.json({ error: "Organização não encontrada." }, { status: 400 });

    const store = await prisma.store.create({
      data: {
        organizationId: org.id,
        name: body.name.trim(),
        description: body.description?.trim() || null,
        phone: body.phone?.trim() || null,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
      },
      include: { sellers: true },
    });

    return Response.json(store, { status: 201 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

