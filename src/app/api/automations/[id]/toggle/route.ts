import { prisma } from "../../../../../lib/prisma.ts";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { isActive } = await req.json();
    const auto = await prisma.automation.update({
      where: { id },
      data: { isActive: Boolean(isActive) },
    });
    return Response.json(auto);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}