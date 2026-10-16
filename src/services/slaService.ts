export interface SlaResult {
  status: "ON_TRACK" | "WARNING" | "OVERDUE";
  hoursSpent: number;
  slaHours: number | null;
  percentageUsed: number;
}

export class SlaService {
  static calculateSla(phaseEnteredAt: Date, slaHours?: number | null): SlaResult {
    if (!slaHours || slaHours <= 0) {
      return {
        status: "ON_TRACK",
        hoursSpent: 0,
        slaHours: null,
        percentageUsed: 0,
      };
    }

    const now = new Date();
    const diffMs = now.getTime() - new Date(phaseEnteredAt).getTime();
    const hoursSpent = Math.max(0, diffMs / (1000 * 60 * 60));
    const percentageUsed = (hoursSpent / slaHours) * 100;

    let status: "ON_TRACK" | "WARNING" | "OVERDUE" = "ON_TRACK";
    if (percentageUsed >= 100) {
      status = "OVERDUE";
    } else if (percentageUsed >= 70) {
      status = "WARNING";
    }

    return {
      status,
      hoursSpent: Math.round(hoursSpent * 10) / 10,
      slaHours,
      percentageUsed: Math.round(percentageUsed),
    };
  }
}