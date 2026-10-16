import { CardService } from "../../../../services/cardService.ts";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const card = await CardService.getCardById(id);
    if (!card) return Response.json({ error: "Card não encontrado." }, { status: 404 });
    return Response.json(card);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { fieldValues } = await req.json();
    const updated = await CardService.updateCardFields(id, fieldValues || {});
    return Response.json(updated);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}