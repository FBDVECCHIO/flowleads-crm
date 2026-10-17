import { prisma } from "../../../lib/prisma.ts";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get("storeId");

    const where: any = {};
    if (storeId) where.storeId = storeId;

    const sellers = await prisma.seller.findMany({
      where,
      include: { store: true },
      orderBy: { name: "asc" },
    });
    return Response.json(sellers);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.name || !body.name.trim()) {
      return Response.json({ error: "Nome do vendedor/captador é obrigatório." }, { status: 400 });
    }

    const org = await prisma.organization.findFirst();
    if (!org) return Response.json({ error: "Organização não encontrada." }, { status: 400 });

    const seller = await prisma.seller.create({
      data: {
        organizationId: org.id,
        storeId: body.storeId || null,
        name: body.name.trim(),
        role: body.role === "CAPTADOR" ? "CAPTADOR" : "VENDEDOR",
        phone: body.phone?.trim() || null,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
      },
      include: { store: true },
    });

    return Response.json(seller, { status: 201 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

