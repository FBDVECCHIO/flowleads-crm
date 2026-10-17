import { CardService } from "../../../../../services/cardService.ts";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const noStoreHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  "Pragma": "no-cache",
  "Expires": "0",
};

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { targetPhaseId, fieldValues } = await req.json();

    if (!targetPhaseId) {
      return Response.json({ error: "targetPhaseId é obrigatório." }, { status: 400, headers: noStoreHeaders });
    }

    const card = await CardService.moveCard(id, targetPhaseId, fieldValues);
    return Response.json(card, { status: 200, headers: noStoreHeaders });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 422, headers: noStoreHeaders });
  }
}