import { AppShell } from "@/components/layout/AppShell";
import { PipeService } from "@/services/pipeService";
import { getDefaultUser, verifySession } from "@/lib/auth";
import { getUserGoal, getTeamGoalRanking } from "@/services/goalService";
import { GoalDashboard } from "@/components/goals/GoalDashboard";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * FlowLeads by Grupo Mário Neto
 * Tela Oficial de Abertura Pós-Login: Painel de Gestão de Metas
 * Saudação: Bem-vindo - [Nome]
 */
export default async function HomePage() {
  let defaultPipe: any = null;
  let currentUser: any = null;
  let userGoal: any = null;
  let teamRanking: any = null;
  let isSupervisor = false;

  try {
    const pipes = await PipeService.listPipes();
    defaultPipe = pipes && pipes.length > 0 ? pipes[0] : null;

    // Resolve authenticated user from session cookie or fallback to default
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("flowleads_session")?.value;

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

    if (currentUser) {
      isSupervisor = currentUser.role === "ADMIN" || currentUser.role === "SUPERVISOR";
      userGoal = await getUserGoal(currentUser.id);

      if (isSupervisor && currentUser.organizationId) {
        teamRanking = await getTeamGoalRanking(currentUser.organizationId);
      }
    }
  } catch (error) {
    console.warn("Aviso: Banco de dados inicializando ou sem tabelas durante pre-renderização:", error);
    currentUser = {
      id: "cmvbdkt9q0001lggc9b7v561a",
      name: "Carlos Silva",
      email: "carlos@acmecorp.com",
      role: "ADMIN",
      organizationId: "cmvbdkt9p0000lggc4091m8pa",
    };
    isSupervisor = true;
    userGoal = {
      targetValue: 100000,
      currentValue: 45000,
      percentage: 45,
      period: "MENSAL",
    };
  }

  return (
    <AppShell
      pipeId={defaultPipe?.id}
      userName={currentUser?.name || "Carlos Silva"}
      userRole={currentUser?.role || "ADMIN"}
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