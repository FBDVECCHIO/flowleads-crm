import { PipeService } from "../../../../services/pipeService.ts";

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
    const { pipeId, phaseIds, phaseId, direction } = body;

    if (!pipeId) {
      return Response.json(
        { error: "pipeId é obrigatório." },
        { status: 400, headers: noStoreHeaders }
      );
    }

    let updatedPhases;
    if (phaseId && direction) {
      if (direction !== "left" && direction !== "right") {
        return Response.json(
          { error: "direction deve ser 'left' ou 'right'." },
          { status: 400, headers: noStoreHeaders }
        );
      }
      updatedPhases = await PipeService.movePhaseDirection(pipeId, phaseId, direction);
    } else if (Array.isArray(phaseIds)) {
      updatedPhases = await PipeService.reorderPhases(pipeId, phaseIds);
    } else {
      return Response.json(
        { error: "Informe phaseIds (array) ou phaseId + direction ('left' | 'right')." },
        { status: 400, headers: noStoreHeaders }
      );
    }

    return Response.json(updatedPhases, { status: 200, headers: noStoreHeaders });
  } catch (error: any) {
    return Response.json(
      { error: error.message },
      { status: 400, headers: noStoreHeaders }
    );
  }
}
