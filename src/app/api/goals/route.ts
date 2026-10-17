import { getDefaultUser, verifySession } from "../../../lib/auth.ts";
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
    const url = new URL(req.url);
    const userIdParam = url.searchParams.get("userId");

    // Authenticate via cookie session or fallback to default user
    let currentUser: any = null;
    const cookieHeader = req.headers.get("cookie") || "";
    const match = cookieHeader.match(/flowleads_session=([^;]+)/);
    if (match) {
      const token = decodeURIComponent(match[1]);
      const userAgent = req.headers.get("user-agent") || undefined;
      const session = verifySession(token, userAgent);
      if (session) {
        currentUser = await prisma.user.findUnique({ where: { id: session.userId } });
      }
    }

    if (!currentUser) {
      try {
        currentUser = await getDefaultUser();
      } catch {
        // No default user
      }
    }

    const targetUserId = userIdParam || currentUser?.id;
    if (!targetUserId) {
      return Response.json({ error: "Usuário não autenticado." }, { status: 401 });
    }

    const userGoal = await getUserGoal(targetUserId);

    const isSupervisorOrAdmin =
      currentUser?.role === "ADMIN" || currentUser?.role === "SUPERVISOR";

    let teamRanking = null;
    if (isSupervisorOrAdmin || url.searchParams.get("includeRanking") === "true") {
      teamRanking = await getTeamGoalRanking(currentUser?.organizationId || userGoal.organizationId || "");
    }

    return Response.json({
      userGoal,
      teamRanking,
      isSupervisor: isSupervisorOrAdmin,
    }, { status: 200, headers: noStoreHeaders });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500, headers: noStoreHeaders });
  }
}

