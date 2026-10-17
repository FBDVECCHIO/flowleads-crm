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
    const { authorName, content } = await req.json();
    if (!content) return Response.json({ error: "Conteúdo obrigatório." }, { status: 400, headers: noStoreHeaders });

    const comment = await CardService.addComment(id, authorName || "Equipe Comercial", content);
    return Response.json(comment, { status: 201, headers: noStoreHeaders });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500, headers: noStoreHeaders });
  }
}