import { prisma } from "../../../lib/prisma.ts";

export async function GET() {
  try {
    const tables = await prisma.databaseTable.findMany({
      include: {
        fields: { orderBy: { order: "asc" } },
        _count: { select: { records: true } },
      },
    });
    return Response.json(tables);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}