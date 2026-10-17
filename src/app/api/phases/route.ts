import { PipeService } from "@/services/pipeService";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const noStoreHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  "Pragma": "no-cache",
  "Expires": "0",
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.pipeId || !body.name) {
      return Response.json(
        { error: "pipeId e name são obrigatórios." },
        { status: 400, headers: noStoreHeaders }
      );
    }

    const phase = await PipeService.createPhase(body.pipeId, body.name, body.color);
    return Response.json(phase, {
      status: 201,
      headers: noStoreHeaders,
    });
  } catch (error: any) {
    return Response.json(
      { error: error.message },
      { status: 400, headers: noStoreHeaders }
    );
  }
}