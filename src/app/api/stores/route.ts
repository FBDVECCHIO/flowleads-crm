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

export async function GET() {
  try {
    await ensureDatabaseReady();
    const stores = await prisma.store.findMany({
      include: {
        sellers: true,
        _count: { select: { sellers: true } },
      },
      orderBy: { name: "asc" },
    });
    return Response.json(stores, { status: 200, headers: noStoreHeaders });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500, headers: noStoreHeaders });
  }
}

export async function POST(req: Request) {
  try {
    await ensureDatabaseReady();
    const body = await req.json();
    if (!body.name || !body.name.trim()) {
      return Response.json({ error: "Nome da loja é obrigatório." }, { status: 400, headers: noStoreHeaders });
    }

    const org = await prisma.organization.findFirst();
    if (!org) return Response.json({ error: "Organização não encontrada." }, { status: 400, headers: noStoreHeaders });

    const store = await prisma.store.create({
      data: {
        organizationId: org.id,
        name: body.name.trim().toUpperCase(),
        description: body.description?.trim() ? body.description.trim().toUpperCase() : null,
        phone: body.phone?.trim() ? maskPhone(body.phone.trim()) : null,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
      },
      include: { sellers: true },
    });

    await persistDatabase();
    return Response.json(store, { status: 201, headers: noStoreHeaders });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500, headers: noStoreHeaders });
  }
}


