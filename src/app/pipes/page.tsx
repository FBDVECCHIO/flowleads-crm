import { redirect } from "next/navigation";
import { PipeService } from "@/services/pipeService";

export const dynamic = "force-dynamic";

export default async function PipesRootPage() {
  const pipes = await PipeService.listPipes();
  if (pipes && pipes.length > 0) {
    redirect(`/pipes/${pipes[0].id}`);
  }
  redirect("/");
}
