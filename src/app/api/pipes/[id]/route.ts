import { PipeService } from "../../../../services/pipeService.ts";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const pipe = await PipeService.getPipeById(id);
    if (!pipe) return Response.json({ error: "Pipe não encontrado." }, { status: 404 });
    return Response.json(pipe);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}