import { PipeService } from "@/services/pipeService";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error: any) {
    return Response.json(
      { error: error.message },
      { status: error.message?.includes("imutável") ? 403 : 400, headers: { "Cache-Control": "no-store" } }
    );
  }
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
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error: any) {
    return Response.json(
      { error: error.message },
      { status: error.message?.includes("imutável") ? 403 : 400, headers: { "Cache-Control": "no-store" } }
    );
  }
}