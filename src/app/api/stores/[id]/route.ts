import { prisma } from "../../../../lib/prisma.ts";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const body = await req.json();

    const updated = await prisma.store.update({
      where: { id: resolvedParams.id },
      data: {
        name: body.name !== undefined ? body.name.trim() : undefined,
        description: body.description !== undefined ? body.description?.trim() : undefined,
        phone: body.phone !== undefined ? body.phone?.trim() : undefined,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : undefined,
      },
      include: { sellers: true },
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
    await prisma.store.delete({
      where: { id: resolvedParams.id },
    });
    return Response.json({ success: true });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

