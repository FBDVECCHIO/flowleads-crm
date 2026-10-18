import { prisma } from "../../../../lib/prisma.ts";
import { persistDatabase, ensureDatabaseReady } from "../../../../lib/dbSync.ts";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const noStoreHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  "Pragma": "no-cache",
  "Expires": "0",
};

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    await ensureDatabaseReady();
    const resolvedParams = await Promise.resolve(params);
    const body = await req.json();

    const dataToUpdate: any = {};
    if (body.name !== undefined) dataToUpdate.name = body.name.trim();
    if (body.description !== undefined) dataToUpdate.description = body.description?.trim() || null;
    if (body.imageUrl !== undefined) dataToUpdate.imageUrl = body.imageUrl?.trim() || null;
    if (body.startDate !== undefined) {
      dataToUpdate.startDate = body.startDate ? new Date(body.startDate) : null;
    }
    if (body.endDate !== undefined) {
      dataToUpdate.endDate = body.endDate ? new Date(body.endDate) : null;
    }
    if (body.products !== undefined) {
      dataToUpdate.products = typeof body.products === "string" ? body.products : JSON.stringify(body.products);
    }
    if (body.eligibleStores !== undefined) {
      dataToUpdate.eligibleStores = typeof body.eligibleStores === "string" ? body.eligibleStores : JSON.stringify(body.eligibleStores);
    }
    if (body.isActive !== undefined) {
      dataToUpdate.isActive = Boolean(body.isActive);
    }

    const updated = await prisma.campaign.update({
      where: { id: resolvedParams.id },
      data: dataToUpdate,
    });

    await persistDatabase();
    return Response.json(updated, { status: 200, headers: noStoreHeaders });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500, headers: noStoreHeaders });
  }
}

export async function PATCH(
  req: Request,
  props: { params: Promise<{ id: string }> | { id: string } }
) {
  return PUT(req, props);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    await ensureDatabaseReady();
    const resolvedParams = await Promise.resolve(params);
    await prisma.campaign.delete({
      where: { id: resolvedParams.id },
    });
    await persistDatabase();
    return Response.json({ success: true }, { status: 200, headers: noStoreHeaders });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500, headers: noStoreHeaders });
  }
}
