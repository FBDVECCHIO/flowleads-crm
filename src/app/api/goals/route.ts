import { requireAuth } from "../../../lib/auth.ts";
import { getUserGoal, getTeamGoalRanking } from "../../../services/goalService.ts";
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
    const session = await requireAuth(req);
    const url = new URL(req.url);
    const userIdParam = url.searchParams.get("userId");

    const currentUser = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!currentUser) {
      return Response.json({ error: "Usuário não autenticado." }, { status: 401, headers: noStoreHeaders });
    }

    const isSupervisorOrAdmin =
      currentUser.role === "ADMIN" || currentUser.role === "SUPERVISOR";

    // Non-supervisors (MEMBER) are strictly isolated to their own metrics (Anti-IDOR)
    let targetUserId = currentUser.id;
    if (isSupervisorOrAdmin && userIdParam) {
      const targetUser = await prisma.user.findUnique({ where: { id: userIdParam } });
      if (targetUser && (!currentUser.organizationId || targetUser.organizationId === currentUser.organizationId)) {
        targetUserId = targetUser.id;
      }
    }

    const userGoal = await getUserGoal(targetUserId);

    let teamRanking = null;
    if (isSupervisorOrAdmin) {
      teamRanking = await getTeamGoalRanking(currentUser.organizationId || userGoal.organizationId || "");
    }

    return Response.json({
      userGoal,
      teamRanking,
      isSupervisor: isSupervisorOrAdmin,
    }, { status: 200, headers: noStoreHeaders });
  } catch (error: any) {
    const status = error.status || error.statusCode || 500;
    return Response.json({ error: error.message }, { status, headers: noStoreHeaders });
  }
}

