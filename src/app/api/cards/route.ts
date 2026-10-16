import { CardService } from "../../../services/cardService.ts";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const pipeId = searchParams.get("pipeId");
    const phaseId = searchParams.get("phaseId") || undefined;

    if (!pipeId) {
      return Response.json({ error: "pipeId é obrigatório." }, { status: 400 });
    }

    const cards = await CardService.listCards(pipeId, phaseId);
    return Response.json(cards);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.pipeId || !body.title) {
      return Response.json({ error: "pipeId e title são obrigatórios." }, { status: 400 });
    }

    const card = await CardService.createCard(body);
    return Response.json(card, { status: 201 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}