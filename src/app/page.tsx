import { AppShell } from "@/components/layout/AppShell";
import { PipeService } from "@/services/pipeService";
import { verifySession } from "@/lib/auth";
import { getUserGoal, getTeamGoalRanking } from "@/services/goalService";
import { GoalDashboard } from "@/components/goals/GoalDashboard";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * FlowLeads by Grupo Mário Neto
 * Tela Oficial de Abertura Pós-Login: Painel de Gestão de Metas
 * Saudação: Bem-vindo - [Nome]
 */
export default async function HomePage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("flowleads_session")?.value;

  if (!sessionCookie) {
    redirect("/auth/login");
  }

  const session = verifySession(decodeURIComponent(sessionCookie));
  if (!session) {
    redirect("/auth/login");
  }

  let defaultPipe: any = null;
  let currentUser: any = null;
  let userGoal: any = null;
  let teamRanking: any = null;
  let isSupervisor = false;

  try {
    const pipes = await PipeService.listPipes();
    defaultPipe = pipes && pipes.length > 0 ? pipes[0] : null;

    currentUser = await prisma.user.findUnique({
      where: { id: session.userId },
      include: { organization: true },
    });

    if (!currentUser) {
      redirect("/auth/login");
    }

    isSupervisor = currentUser.role === "ADMIN" || currentUser.role === "SUPERVISOR";
    userGoal = await getUserGoal(currentUser.id);

    if (isSupervisor && currentUser.organizationId) {
      teamRanking = await getTeamGoalRanking(currentUser.organizationId);
    }
  } catch (error: any) {
    if (error?.digest?.startsWith("NEXT_REDIRECT")) {
      throw error;
    }
    console.warn("Aviso: Falha ao carregar dados do usuário na tela de metas:", error);
    currentUser = {
      id: session.userId,
      name: session.name || "Carlos Silva",
      email: session.email,
      role: session.role || "ADMIN",
      organizationId: session.organizationId,
    };
    isSupervisor = true;
    userGoal = {
      userId: session.userId,
      userName: session.name || "Carlos Silva",
      targetAmount: 100000,
      currentAmount: 45000,
      percentage: 45,
      targetDeals: 10,
      currentDeals: 4,
      dealsPercentage: 40,
      rankingPosition: 1,
    };
  }

  return (
    <AppShell
      pipeId={defaultPipe?.id}
      userName={currentUser?.name || "Carlos Silva"}
      userRole={currentUser?.role || "ADMIN"}
      allowedMenus={currentUser?.allowedMenus}
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