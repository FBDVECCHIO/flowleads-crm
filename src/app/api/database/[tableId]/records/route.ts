import { prisma } from "../../../../../lib/prisma.ts";

export async function GET(req: Request, { params }: { params: Promise<{ tableId: string }> }) {
  try {
    const { tableId } = await params;
    const records = await prisma.databaseRecord.findMany({
      where: { tableId },
      orderBy: { createdAt: "desc" },
    });
    return Response.json(records);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ tableId: string }> }) {
  try {
    const { tableId } = await params;
    const { title, values } = await req.json();
    const record = await prisma.databaseRecord.create({
      data: {
        tableId,
        title: title || "Novo Registro",
        values: JSON.stringify(values || {}),
      },
    });
    return Response.json(record, { status: 201 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}