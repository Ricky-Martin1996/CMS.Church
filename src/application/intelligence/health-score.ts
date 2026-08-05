import type {
  ChurchHealthScore,
  HealthFactorScore,
  HealthScoreWeights,
  ModuleSnapshot,
} from "@/domain/entities/intelligence";
import {
  HEALTH_FACTOR_LABELS,
  HealthFactorKey,
} from "@/domain/enums/intelligence";

export const DEFAULT_HEALTH_WEIGHTS: Record<HealthFactorKey, number> = {
  [HealthFactorKey.ATTENDANCE]: 1.2,
  [HealthFactorKey.VISITOR_CONVERSION]: 1.1,
  [HealthFactorKey.VOLUNTEER_PARTICIPATION]: 1.1,
  [HealthFactorKey.PRAYER_RESPONSE]: 0.8,
  [HealthFactorKey.COMMUNICATION_ENGAGEMENT]: 0.9,
  [HealthFactorKey.EVENT_READINESS]: 1.0,
  [HealthFactorKey.MEMBERSHIP_GROWTH]: 1.0,
  [HealthFactorKey.HOUSEHOLD_ENGAGEMENT]: 0.9,
};

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(n)));
}

function mergeWeights(override?: HealthScoreWeights): Record<HealthFactorKey, number> {
  return { ...DEFAULT_HEALTH_WEIGHTS, ...override };
}

function gradeFor(score: number): ChurchHealthScore["grade"] {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Healthy";
  if (score >= 55) return "Watch";
  return "Needs Attention";
}

/**
 * Modular Church Health Score.
 * Each factor is 0–100; weights are normalized so churches can customize later.
 */
export function calculateChurchHealthScore(
  modules: ModuleSnapshot,
  weightOverride?: HealthScoreWeights
): ChurchHealthScore {
  const weights = mergeWeights(weightOverride);

  const attendanceTrend = modules.attendance?.weeklyTrend ?? [];
  const latestAttendance = attendanceTrend.at(-1)?.primary ?? 0;
  const priorAttendance =
    attendanceTrend.length > 1
      ? attendanceTrend.slice(0, -1).reduce((s, p) => s + p.primary, 0) /
        Math.max(1, attendanceTrend.length - 1)
      : latestAttendance;
  const attendanceScore = clamp(
    priorAttendance > 0
      ? 70 + ((latestAttendance - priorAttendance) / priorAttendance) * 100
      : latestAttendance > 0
        ? 75
        : 45
  );

  const conversion = modules.visitors?.conversionRate ?? 0;
  const visitorScore = clamp(40 + conversion * 0.7);

  const coverage = modules.ministries?.coveragePercent ?? 0;
  const reliability = modules.ministries?.averageReliability ?? 0;
  const volunteerScore = clamp(coverage * 0.55 + reliability * 0.45);

  const openPrayers = modules.care?.openPrayers ?? 0;
  const prayerScore = clamp(100 - Math.min(60, openPrayers * 4));

  const openRate = modules.communications?.openRate ?? 0;
  const deliveryRate = modules.communications?.deliveryRate ?? 0;
  const failureRate = modules.communications?.failureRate ?? 0;
  const communicationScore = clamp(
    deliveryRate * 0.45 + openRate * 0.45 + (100 - failureRate) * 0.1
  );

  const eventCoverage = modules.events?.volunteerCoverage ?? 0;
  const capacity = modules.events?.averageCapacityUsage ?? 0;
  const eventScore = clamp(eventCoverage * 0.6 + Math.min(100, capacity) * 0.4);

  const newMembers = modules.members?.newThisMonth ?? 0;
  const activeMembers = modules.members?.activeCount ?? 0;
  const growthScore = clamp(
    activeMembers > 0
      ? 55 + (newMembers / Math.max(20, activeMembers * 0.05)) * 20
      : 50
  );

  const householdEngagement = modules.households?.averageEngagement ?? 0;
  const householdScore = clamp(householdEngagement);

  const rawFactors: Array<{
    key: HealthFactorKey;
    score: number;
    detail: string;
  }> = [
    {
      key: HealthFactorKey.ATTENDANCE,
      score: attendanceScore,
      detail: `Latest week ${Math.round(latestAttendance)} vs recent avg ${Math.round(priorAttendance)}`,
    },
    {
      key: HealthFactorKey.VISITOR_CONVERSION,
      score: visitorScore,
      detail: `${Math.round(conversion)}% conversion · ${modules.visitors?.needingFollowUpCount ?? 0} awaiting follow-up`,
    },
    {
      key: HealthFactorKey.VOLUNTEER_PARTICIPATION,
      score: volunteerScore,
      detail: `${Math.round(coverage)}% coverage · reliability ${Math.round(reliability)}`,
    },
    {
      key: HealthFactorKey.PRAYER_RESPONSE,
      score: prayerScore,
      detail: `${openPrayers} open prayer requests`,
    },
    {
      key: HealthFactorKey.COMMUNICATION_ENGAGEMENT,
      score: communicationScore,
      detail: `${Math.round(openRate)}% open · ${Math.round(deliveryRate)}% delivery`,
    },
    {
      key: HealthFactorKey.EVENT_READINESS,
      score: eventScore,
      detail: `${Math.round(eventCoverage)}% volunteer cover · ${Math.round(capacity)}% capacity use`,
    },
    {
      key: HealthFactorKey.MEMBERSHIP_GROWTH,
      score: growthScore,
      detail: `${newMembers} new this month · ${activeMembers} active`,
    },
    {
      key: HealthFactorKey.HOUSEHOLD_ENGAGEMENT,
      score: householdScore,
      detail: `Average engagement ${Math.round(householdEngagement)}`,
    },
  ];

  const totalWeight = rawFactors.reduce((s, f) => s + (weights[f.key] || 0), 0) || 1;
  const factors: HealthFactorScore[] = rawFactors.map((f) => {
    const weight = weights[f.key] || 0;
    const normalized = weight / totalWeight;
    return {
      key: f.key,
      label: HEALTH_FACTOR_LABELS[f.key],
      score: f.score,
      weight: normalized,
      weightedScore: f.score * normalized,
      detail: f.detail,
    };
  });

  const score = clamp(factors.reduce((s, f) => s + f.weightedScore, 0));

  return {
    score,
    grade: gradeFor(score),
    factors,
    weights,
    computedAt: new Date(),
  };
}
