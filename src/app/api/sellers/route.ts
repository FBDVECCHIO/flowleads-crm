import { prisma } from "../../../lib/prisma.ts";
import { maskPhone } from "../../../lib/utils.ts";
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
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get("storeId");

    const where: any = {};
    if (storeId) where.storeId = storeId;

    const sellers = await prisma.seller.findMany({
      where,
      include: { store: true },
      orderBy: { name: "asc" },
    });
    return Response.json(sellers, { status: 200, headers: noStoreHeaders });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500, headers: noStoreHeaders });
  }
}

export async function POST(req: Request) {
  try {
    await ensureDatabaseReady();
    const body = await req.json();
    if (!body.name || !body.name.trim()) {
      return Response.json({ error: "Nome do vendedor/captador é obrigatório." }, { status: 400, headers: noStoreHeaders });
    }

    const org = await prisma.organization.findFirst();
    if (!org) return Response.json({ error: "Organização não encontrada." }, { status: 400, headers: noStoreHeaders });

    const seller = await prisma.seller.create({
      data: {
        organizationId: org.id,
        storeId: body.storeId || null,
        name: body.name.trim().toUpperCase(),
        role: body.role === "CAPTADOR" ? "CAPTADOR" : "VENDEDOR",
        phone: body.phone?.trim() ? maskPhone(body.phone.trim()) : null,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
      },
      include: { store: true },
    });

    await persistDatabase();
    return Response.json(seller, { status: 201, headers: noStoreHeaders });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500, headers: noStoreHeaders });
  }
}


