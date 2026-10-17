import { prisma } from "../../../../lib/prisma.ts";

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
    const resolvedParams = await Promise.resolve(params);
    const body = await req.json();

    const updated = await prisma.seller.update({
      where: { id: resolvedParams.id },
      data: {
        name: body.name !== undefined ? body.name.trim() : undefined,
        storeId: body.storeId !== undefined ? (body.storeId || null) : undefined,
        role: body.role !== undefined ? (body.role === "CAPTADOR" ? "CAPTADOR" : "VENDEDOR") : undefined,
        phone: body.phone !== undefined ? body.phone?.trim() : undefined,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : undefined,
      },
      include: { store: true },
    });

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
    const resolvedParams = await Promise.resolve(params);
    await prisma.seller.delete({
      where: { id: resolvedParams.id },
    });
    return Response.json({ success: true }, { status: 200, headers: noStoreHeaders });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500, headers: noStoreHeaders });
  }
}
