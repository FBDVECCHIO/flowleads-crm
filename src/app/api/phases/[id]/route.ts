import { PipeService } from "@/services/pipeService";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const noStoreHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  "Pragma": "no-cache",
  "Expires": "0",
};

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const phase = await PipeService.updatePhase(id, {
      name: body.name,
      color: body.color,
    });

    return Response.json(phase, {
      status: 200,
      headers: noStoreHeaders,
    });
  } catch (error: any) {
    return Response.json(
      { error: error.message },
      { status: error.message?.includes("imutável") ? 403 : 400, headers: noStoreHeaders }
    );
  }
}

export async function PUT(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  return PATCH(req, props);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await PipeService.deletePhase(id);

    return Response.json(
      { success: true, message: "Fase excluída e leads migrados com sucesso." },
      { status: 200, headers: noStoreHeaders }
    );
  } catch (error: any) {
    return Response.json(
      { error: error.message },
      { status: error.message?.includes("imutável") ? 403 : 400, headers: noStoreHeaders }
    );
  }
}