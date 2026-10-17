import { prisma } from "../../../lib/prisma.ts";

export async function GET() {
  try {
    const messages = await prisma.systemMessage.findMany({
      orderBy: { createdAt: "desc" },
    });
    return Response.json(messages);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.title || !body.title.trim() || !body.content || !body.content.trim()) {
      return Response.json({ error: "Título e conteúdo da mensagem são obrigatórios." }, { status: 400 });
    }

    const org = await prisma.organization.findFirst();
    if (!org) return Response.json({ error: "Organização não encontrada." }, { status: 400 });

    const msg = await prisma.systemMessage.create({
      data: {
        organizationId: org.id,
        title: body.title.trim(),
        content: body.content.trim(),
        authorName: body.authorName?.trim() || "Supervisor",
        priority: body.priority === "URGENTE" ? "URGENTE" : "NORMAL",
      },
    });

    return Response.json(msg, { status: 201 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

