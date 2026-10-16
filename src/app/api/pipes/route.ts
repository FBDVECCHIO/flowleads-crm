import { PipeService } from "../../../services/pipeService.ts";

export async function GET() {
  try {
    const pipes = await PipeService.listPipes();
    return Response.json(pipes);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}