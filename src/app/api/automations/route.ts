import { prisma } from "../../../lib/prisma.ts";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const noStoreHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  "Pragma": "no-cache",
  "Expires": "0",
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const pipeId = searchParams.get("pipeId");
    if (!pipeId) return Response.json({ error: "pipeId obrigatório" }, { status: 400, headers: noStoreHeaders });

    const automations = await prisma.automation.findMany({
      where: { pipeId },
      orderBy: { createdAt: "desc" },
    });
    return Response.json(automations, { status: 200, headers: noStoreHeaders });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500, headers: noStoreHeaders });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const auto = await prisma.automation.create({
      data: {
        pipeId: body.pipeId,
        name: body.name,
        triggerType: body.triggerType,
        triggerConfig: JSON.stringify(body.triggerConfig || {}),
        conditions: JSON.stringify(body.conditions || []),
        actionType: body.actionType,
        actionConfig: JSON.stringify(body.actionConfig || {}),
        isActive: true,
      },
    });
    return Response.json(auto, { status: 201, headers: noStoreHeaders });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 400, headers: noStoreHeaders });
  }
}