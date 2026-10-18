import { prisma } from "../../../lib/prisma.ts";
import { requireAuth } from "../../../lib/auth.ts";
import { persistDatabase, ensureDatabaseReady } from "../../../lib/dbSync.ts";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const noStoreHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  "Pragma": "no-cache",
  "Expires": "0",
};

export async function GET(req: Request) {
  try {
    await ensureDatabaseReady();
    const { searchParams } = new URL(req.url);
    const pipeId = searchParams.get("pipeId");

    const where = pipeId ? { pipeId } : {};
    const labels = await prisma.label.findMany({
      where,
      orderBy: { name: "asc" },
    });

    return Response.json(labels, { status: 200, headers: noStoreHeaders });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500, headers: noStoreHeaders });
  }
}


export async function POST(req: Request) {
  try {
    await ensureDatabaseReady();
    let session;
    try {
      session = await requireAuth(req);
    } catch (authErr: any) {
      return Response.json(
        { error: "Sessão não autenticada." },
        { status: 401 }
      );
    }

    // Strict governance: only SUPERVISOR or ADMIN can create tags
    if (session.role !== "SUPERVISOR" && session.role !== "ADMIN") {
      return Response.json(
        { error: "Acesso não autorizado: apenas usuários com perfil SUPERVISOR ou ADMIN podem criar novas etiquetas." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, color, pipeId } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return Response.json({ error: "Nome da etiqueta é obrigatório." }, { status: 400 });
    }

    if (!color || !/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(color)) {
      return Response.json({ error: "Cor hexadecimal inválida." }, { status: 400 });
    }

    // Resolve or fallback pipeId
    let targetPipeId = pipeId;
    const existing = targetPipeId ? await prisma.pipe.findUnique({ where: { id: targetPipeId } }) : null;
    if (!existing) {
      const defaultPipe = await prisma.pipe.findFirst();
      if (!defaultPipe) {
        return Response.json({ error: "Nenhum pipe encontrado." }, { status: 400 });
      }
      targetPipeId = defaultPipe.id;
    }

    const label = await prisma.label.create({
      data: {
        pipeId: targetPipeId,
        name: name.trim().toUpperCase(),
        color,
      },
    });

    await persistDatabase();
    return Response.json(label, { status: 201, headers: noStoreHeaders });
  } catch (error: any) {
    return Response.json({ error: error.message || "Erro ao criar etiqueta." }, { status: 500, headers: noStoreHeaders });
  }
}

