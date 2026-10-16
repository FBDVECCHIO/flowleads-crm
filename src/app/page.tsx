import { AppShell } from "@/components/layout/AppShell";
import { PipeService } from "@/services/pipeService";
import { getDefaultUser, verifySession } from "@/lib/auth";
import { getUserGoal, getTeamGoalRanking } from "@/services/goalService";
import { GoalDashboard } from "@/components/goals/GoalDashboard";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

/**
 * FlowLeads by Grupo Mário Neto
 * Tela Oficial de Abertura Pós-Login: Painel de Gestão de Metas
 * Saudação: Bem-vindo - [Nome]
 */
export default async function HomePage() {
  const pipes = await PipeService.listPipes();
  const defaultPipe = pipes[0];

  // Resolve authenticated user from session cookie or fallback to default
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("flowleads_session")?.value;

  let currentUser: any = null;
  if (sessionCookie) {
    const session = verifySession(decodeURIComponent(sessionCookie));
    if (session) {
      currentUser = await prisma.user.findUnique({
        where: { id: session.userId },
        include: { organization: true },
      });
    }
  }

  if (!currentUser) {
    currentUser = await getDefaultUser();
  }

  const isSupervisor = currentUser.role === "ADMIN" || currentUser.role === "SUPERVISOR";
  const userGoal = await getUserGoal(currentUser.id);

  let teamRanking = null;
  if (isSupervisor) {
    teamRanking = await getTeamGoalRanking(currentUser.organizationId);
  }

  return (
    <AppShell
      pipeId={defaultPipe?.id}
      userName={currentUser.name}
      userRole={currentUser.role}
      orgName="Grupo Mário Neto"
    >
      {/* Dashboard Oficial de Gestão de Metas: Bem-vindo - [Nome] */}
      <div className="space-y-6">
        <GoalDashboard
          userGoal={userGoal}
          teamRanking={teamRanking}
          isSupervisor={isSupervisor}
          defaultPipeId={defaultPipe?.id}
          orgName="Grupo Mário Neto"
        />
      </div>
    </AppShell>
  );
}