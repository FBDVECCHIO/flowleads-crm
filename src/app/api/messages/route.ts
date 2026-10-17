import { prisma } from "../../../lib/prisma.ts";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const noStoreHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  "Pragma": "no-cache",
  "Expires": "0",
};

export async function GET() {
  try {
    const messages = await prisma.systemMessage.findMany({
      orderBy: { createdAt: "desc" },
    });
    return Response.json(messages, { status: 200, headers: noStoreHeaders });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500, headers: noStoreHeaders });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.title || !body.title.trim() || !body.content || !body.content.trim()) {
      return Response.json({ error: "Título e conteúdo da mensagem são obrigatórios." }, { status: 400, headers: noStoreHeaders });
    }

    const org = await prisma.organization.findFirst();
    if (!org) return Response.json({ error: "Organização não encontrada." }, { status: 400, headers: noStoreHeaders });

    const msg = await prisma.systemMessage.create({
      data: {
        organizationId: org.id,
        title: body.title.trim().toUpperCase(),
        content: body.content.trim().toUpperCase(),
        authorName: body.authorName?.trim() ? body.authorName.trim().toUpperCase() : "SUPERVISOR",
        priority: body.priority === "URGENTE" ? "URGENTE" : "NORMAL",
      },
    });

    return Response.json(msg, { status: 201, headers: noStoreHeaders });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500, headers: noStoreHeaders });
  }
}


