import { CardService } from "../../../../../services/cardService.ts";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { authorName, content } = await req.json();
    if (!content) return Response.json({ error: "Conteúdo obrigatório." }, { status: 400 });

    const comment = await CardService.addComment(id, authorName || "Equipe Comercial", content);
    return Response.json(comment, { status: 201 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}