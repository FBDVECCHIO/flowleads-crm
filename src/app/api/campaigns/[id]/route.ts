import { prisma } from "../../../../lib/prisma.ts";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const body = await req.json();

    const updated = await prisma.campaign.update({
      where: { id: resolvedParams.id },
      data: {
        name: body.name !== undefined ? body.name.trim() : undefined,
        description: body.description !== undefined ? body.description?.trim() : undefined,
        imageUrl: body.imageUrl !== undefined ? body.imageUrl?.trim() : undefined,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined,
        products: body.products !== undefined ? (typeof body.products === "string" ? body.products : JSON.stringify(body.products)) : undefined,
        eligibleStores: body.eligibleStores !== undefined ? (typeof body.eligibleStores === "string" ? body.eligibleStores : JSON.stringify(body.eligibleStores)) : undefined,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : undefined,
      },
    });

    return Response.json(updated);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    await prisma.campaign.delete({
      where: { id: resolvedParams.id },
    });
    return Response.json({ success: true });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

