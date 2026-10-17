import { CardService } from "../../../services/cardService.ts";
import { requireAuth } from "../../../lib/auth.ts";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const noStoreHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  "Pragma": "no-cache",
  "Expires": "0",
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const pipeId = searchParams.get("pipeId");
    const phaseId = searchParams.get("phaseId") || undefined;

    if (!pipeId) {
      return Response.json({ error: "pipeId é obrigatório." }, { status: 400, headers: noStoreHeaders });
    }

    const cards = await CardService.listCards(pipeId, phaseId);
    return Response.json(cards, { status: 200, headers: noStoreHeaders });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500, headers: noStoreHeaders });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.pipeId || !body.title) {
      return Response.json({ error: "pipeId e title são obrigatórios." }, { status: 400, headers: noStoreHeaders });
    }

    if (!body.createdById) {
      const session = await requireAuth(req).catch(() => null);
      if (session?.userId) {
        body.createdById = session.userId;
      }
    }

    const card = await CardService.createCard(body);
    return Response.json(card, { status: 201, headers: noStoreHeaders });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 400, headers: noStoreHeaders });
  }
}