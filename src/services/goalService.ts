import { prisma } from "../lib/prisma.ts";

export interface GoalProgress {
  userId: string;
  userName: string;
  avatarUrl?: string | null;
  targetAmount: number;
  currentAmount: number;
  percentage: number;
  targetDeals: number;
  currentDeals: number;
  dealsPercentage: number;
  rankingPosition: number;
  whatsappNumber?: string | null;
  role?: string;
  organizationId?: string;
  // Campos analíticos de dias úteis e ritmo (Pacing)
  workingDaysPerMonth: number;
  currentWorkingDay: number;
  remainingWorkingDays: number;
  dailyTargetNormal: number;
  dailyTargetAccumulated: number;
  weeklyTarget: number;
  pacingPercentage: number;
  pacingStatus: "ACIMA" | "NO_RITMO" | "ATRASADO";
}

/**
 * Calcula os dias úteis (Segunda a Sexta) totais do mês e os decorridos até a data de hoje.
 */
export function calculateBusinessDays(year?: number, month?: number, upToDay?: number): {
  totalBusinessDays: number;
  elapsedBusinessDays: number;
} {
  const now = new Date();
  const currentYear = year !== undefined ? year : now.getFullYear();
  const currentMonth = month !== undefined ? month : now.getMonth();
  const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const currentDay = upToDay !== undefined ? upToDay : now.getDate();

  let totalBusinessDays = 0;
  let elapsedBusinessDays = 0;

  for (let day = 1; day <= totalDaysInMonth; day++) {
    const d = new Date(currentYear, currentMonth, day);
    const dayOfWeek = d.getDay(); // 0 = Domingo, 6 = Sábado
    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
    if (isWeekday) {
      totalBusinessDays++;
      if (day <= currentDay) {
        elapsedBusinessDays++;
      }
    }
  }

  return {
    totalBusinessDays: totalBusinessDays || 22,
    elapsedBusinessDays: Math.max(1, Math.min(elapsedBusinessDays, totalBusinessDays || 22)),
  };
}

/**
 * Helper interno para computar as métricas analíticas de um usuário.
 */
function computeUserGoalMetrics(user: any): Omit<GoalProgress, "rankingPosition"> {
  const wonAssignees = (user.assignees || []).filter(
    (a: any) => a.card && a.card.currentPhase && a.card.currentPhase.isFinalWon === true
  );
  const currentAmount = wonAssignees.reduce((acc: number, a: any) => acc + (a.card?.dealValue || 0), 0);
  const currentDeals = wonAssignees.length;
  const targetAmount = user.monthlyTargetAmount ?? 100000;
  const targetDeals = user.monthlyTargetDeals ?? 10;
  const percentage = targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0;
  const dealsPercentage = targetDeals > 0 ? (currentDeals / targetDeals) * 100 : 0;

  const { elapsedBusinessDays, totalBusinessDays } = calculateBusinessDays();
  const workingDaysPerMonth = user.workingDaysPerMonth && user.workingDaysPerMonth > 0 ? user.workingDaysPerMonth : totalBusinessDays;
  const currentWorkingDay = Math.min(elapsedBusinessDays, workingDaysPerMonth);
  const remainingWorkingDays = Math.max(1, workingDaysPerMonth - currentWorkingDay);

  const dailyTargetNormal = targetAmount > 0 ? Math.round((targetAmount / workingDaysPerMonth) * 100) / 100 : 0;
  const missingAmount = Math.max(0, targetAmount - currentAmount);
  const dailyTargetAccumulated = remainingWorkingDays > 0 ? Math.round((missingAmount / remainingWorkingDays) * 100) / 100 : 0;
  const weeklyTarget = Math.round(dailyTargetNormal * 5 * 100) / 100;

  const expectedAttainmentSoFar = dailyTargetNormal * currentWorkingDay;
  const pacingPercentage = expectedAttainmentSoFar > 0
    ? (currentAmount / expectedAttainmentSoFar) * 100
    : currentAmount > 0 ? 100 : 0;

  let pacingStatus: "ACIMA" | "NO_RITMO" | "ATRASADO" = "NO_RITMO";
  if (pacingPercentage >= 105) {
    pacingStatus = "ACIMA";
  } else if (pacingPercentage < 80) {
    pacingStatus = "ATRASADO";
  }

  return {
    userId: user.id,
    userName: user.name,
    avatarUrl: user.avatarUrl,
    targetAmount,
    currentAmount,
    percentage: Math.round(percentage * 100) / 100,
    targetDeals,
    currentDeals,
    dealsPercentage: Math.round(dealsPercentage * 100) / 100,
    whatsappNumber: user.whatsappNumber,
    role: user.role,
    organizationId: user.organizationId,
    workingDaysPerMonth,
    currentWorkingDay,
    remainingWorkingDays,
    dailyTargetNormal: Math.round(dailyTargetNormal * 100) / 100,
    dailyTargetAccumulated: Math.round(dailyTargetAccumulated * 100) / 100,
    weeklyTarget: Math.round(weeklyTarget * 100) / 100,
    pacingPercentage: Math.round(pacingPercentage * 100) / 100,
    pacingStatus,
  };
}

/**
 * Calculates live team goal rankings for an organization ordered by attainment.
 */
export async function getTeamGoalRanking(organizationId: string): Promise<GoalProgress[]> {
  const users = await prisma.user.findMany({
    where: { organizationId },
    include: {
      assignees: {
        include: {
          card: {
            include: {
              currentPhase: true,
            },
          },
        },
      },
    },
  });

  const progressList = users.map((user) => computeUserGoalMetrics(user));

  // Sort by percentage descending, then currentAmount descending
  const sorted = [...progressList].sort((a, b) => {
    if (b.percentage !== a.percentage) {
      return b.percentage - a.percentage;
    }
    return b.currentAmount - a.currentAmount;
  });

  return sorted.map((item, index) => ({
    ...item,
    rankingPosition: index + 1,
  }));
}

/**
 * Retrieves the goal progress and ranking position for a specific user.
 */
export async function getUserGoal(userId: string): Promise<GoalProgress> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      assignees: {
        include: {
          card: {
            include: {
              currentPhase: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    throw new Error(`User with ID ${userId} not found`);
  }

  const teamRanking = await getTeamGoalRanking(user.organizationId);
  const userRank = teamRanking.find((r) => r.userId === userId);

  if (userRank) {
    return userRank;
  }

  // Fallback calculation
  const metrics = computeUserGoalMetrics(user);
  return {
    ...metrics,
    rankingPosition: 1,
  };
}
