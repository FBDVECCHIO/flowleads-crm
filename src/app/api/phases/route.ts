import { PipeService } from "@/services/pipeService";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.pipeId || !body.name) {
      return Response.json(
        { error: "pipeId e name são obrigatórios." },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    const phase = await PipeService.createPhase(body.pipeId, body.name, body.color);
    return Response.json(phase, {
      status: 201,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error: any) {
    return Response.json(
      { error: error.message },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }
}