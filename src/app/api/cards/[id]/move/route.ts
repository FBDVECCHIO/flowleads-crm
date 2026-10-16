import { CardService } from "../../../../../services/cardService.ts";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { targetPhaseId, fieldValues } = await req.json();

    if (!targetPhaseId) {
      return Response.json({ error: "targetPhaseId é obrigatório." }, { status: 400 });
    }

    const card = await CardService.moveCard(id, targetPhaseId, fieldValues);
    return Response.json(card);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 422 });
  }
}