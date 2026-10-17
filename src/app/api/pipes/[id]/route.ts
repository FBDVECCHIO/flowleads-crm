import { PipeService } from "../../../../services/pipeService.ts";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const noStoreHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  "Pragma": "no-cache",
  "Expires": "0",
};

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const pipe = await PipeService.getPipeById(id);
    if (!pipe) return Response.json({ error: "Pipe não encontrado." }, { status: 404, headers: noStoreHeaders });
    return Response.json(pipe, { status: 200, headers: noStoreHeaders });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500, headers: noStoreHeaders });
  }
}