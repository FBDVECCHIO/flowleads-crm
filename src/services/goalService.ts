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

  const progressList = users.map((user) => {
    const wonAssignees = user.assignees.filter(
      (a) => a.card && a.card.currentPhase && a.card.currentPhase.isFinalWon === true
    );
    const currentAmount = wonAssignees.reduce((acc, a) => acc + (a.card?.dealValue || 0), 0);
    const currentDeals = wonAssignees.length;
    const targetAmount = user.monthlyTargetAmount ?? 100000;
    const targetDeals = user.monthlyTargetDeals ?? 10;
    const percentage = targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0;
    const dealsPercentage = targetDeals > 0 ? (currentDeals / targetDeals) * 100 : 0;

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
    };
  });

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
  const wonAssignees = user.assignees.filter(
    (a) => a.card && a.card.currentPhase && a.card.currentPhase.isFinalWon === true
  );
  const currentAmount = wonAssignees.reduce((acc, a) => acc + (a.card?.dealValue || 0), 0);
  const currentDeals = wonAssignees.length;
  const targetAmount = user.monthlyTargetAmount ?? 100000;
  const targetDeals = user.monthlyTargetDeals ?? 10;
  const percentage = targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0;
  const dealsPercentage = targetDeals > 0 ? (currentDeals / targetDeals) * 100 : 0;

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
    rankingPosition: 1,
    whatsappNumber: user.whatsappNumber,
    role: user.role,
    organizationId: user.organizationId,
  };
}
