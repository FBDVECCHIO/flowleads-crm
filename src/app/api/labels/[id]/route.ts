import { prisma } from "../../../../lib/prisma.ts";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const body = await req.json();

    const updated = await prisma.label.update({
      where: { id: resolvedParams.id },
      data: {
        name: body.name !== undefined ? body.name.trim() : undefined,
        color: body.color !== undefined ? body.color.trim() : undefined,
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
    await prisma.label.delete({
      where: { id: resolvedParams.id },
    });
    return Response.json({ success: true });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

