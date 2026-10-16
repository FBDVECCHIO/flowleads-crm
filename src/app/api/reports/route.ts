import { prisma } from "../../../lib/prisma.ts";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const pipeId = searchParams.get("pipeId");
    if (!pipeId) return Response.json({ error: "pipeId obrigatório" }, { status: 400 });

    const pipe = await prisma.pipe.findUnique({
      where: { id: pipeId },
      include: {
        phases: { orderBy: { order: "asc" } },
        cards: {
          include: {
            currentPhase: true,
            assignees: { include: { user: true } },
          },
        },
      },
    });
    if (!pipe) return Response.json({ error: "Pipe não encontrado" }, { status: 404 });

    const totalCards = pipe.cards.length;
    const wonCards = pipe.cards.filter((c) => c.currentPhase.isFinalWon);
    const lostCards = pipe.cards.filter((c) => c.currentPhase.isFinalLost);
    const activeCards = pipe.cards.filter((c) => !c.currentPhase.isFinalWon && !c.currentPhase.isFinalLost);

    const totalPipelineValue = pipe.cards.reduce((acc, c) => acc + (c.dealValue || 0), 0);
    const wonValue = wonCards.reduce((acc, c) => acc + (c.dealValue || 0), 0);
    const conversionRate = totalCards > 0 ? (wonCards.length / totalCards) * 100 : 0;

    const funnel = pipe.phases.map((phase) => {
      const count = pipe.cards.filter((c) => c.currentPhaseId === phase.id).length;
      const value = pipe.cards.filter((c) => c.currentPhaseId === phase.id).reduce((acc, c) => acc + (c.dealValue || 0), 0);
      return {
        phaseId: phase.id,
        phaseName: phase.name,
        color: phase.color,
        order: phase.order,
        isFinalWon: phase.isFinalWon,
        isFinalLost: phase.isFinalLost,
        count,
        value,
      };
    });

    return Response.json({
      summary: {
        totalCards,
        activeCards: activeCards.length,
        wonCards: wonCards.length,
        lostCards: lostCards.length,
        totalPipelineValue,
        wonValue,
        conversionRate: Math.round(conversionRate * 10) / 10,
      },
      funnel,
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}