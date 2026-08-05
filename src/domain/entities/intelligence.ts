import type { Role } from "@/domain/enums/role";
import type {
  HealthFactorKey,
  InsightCategory,
  InsightSeverity,
  TaskCenterKind,
} from "@/domain/enums/intelligence";

export type HealthFactorScore = {
  key: HealthFactorKey;
  label: string;
  score: number;
  weight: number;
  weightedScore: number;
  detail: string;
};

export type ChurchHealthScore = {
  score: number;
  grade: "Excellent" | "Healthy" | "Watch" | "Needs Attention";
  factors: HealthFactorScore[];
  weights: Record<HealthFactorKey, number>;
  computedAt: Date;
};

/** Modular weights — churches can override later without schema changes. */
export type HealthScoreWeights = Partial<Record<HealthFactorKey, number>>;

export type OperationalInsight = {
  id: string;
  category: InsightCategory;
  severity: InsightSeverity;
  title: string;
  summary: string;
  suggestedAction: string;
  href?: string;
  metric?: number | null;
  /** Opaque payload for a future LLM enhancer */
  evidence?: Record<string, unknown>;
};

export type AiAssistantPanel = {
  weeklySummary: string;
  suggestedActions: Array<{
    id: string;
    title: string;
    reason: string;
    href?: string;
  }>;
  ministryHighlights: string[];
  visitorRecommendations: string[];
  followUpPriorities: string[];
  source: "rule-engine";
};

export type ExecutiveKpi = {
  id: string;
  label: string;
  value: string;
  delta?: string;
  href?: string;
  spark?: number[];
};

export type ChartSeriesPoint = {
  label: string;
  primary: number;
  secondary?: number;
};

export type ExecutiveCharts = {
  attendance: ChartSeriesPoint[];
  growth: ChartSeriesPoint[];
  visitors: ChartSeriesPoint[];
  householdEngagement: ChartSeriesPoint[];
  volunteerReliability: ChartSeriesPoint[];
  eventParticipation: ChartSeriesPoint[];
  communicationDelivery: ChartSeriesPoint[];
};

export type TaskCenterItem = {
  id: string;
  kind: TaskCenterKind;
  title: string;
  description: string;
  href?: string;
  dueAt?: Date | null;
  priority: "low" | "medium" | "high";
};

export type ModuleSnapshot = {
  members?: {
    activeCount: number;
    newThisMonth: number;
    totalCount: number;
  };
  households?: {
    activeCount: number;
    averageEngagement: number;
  };
  attendance?: {
    averagePresent: number;
    weeklyTrend: ChartSeriesPoint[];
  };
  visitors?: {
    newVisitorsCount: number;
    needingFollowUpCount: number;
    conversionRate: number;
    openTasksCount: number;
  };
  ministries?: {
    coveragePercent: number;
    averageReliability: number;
    activeVolunteers: number;
    gaps: number;
  };
  events?: {
    upcomingEvents: number;
    volunteerCoverage: number;
    averageCapacityUsage: number;
    noShowRate: number;
  };
  communications?: {
    deliveryRate: number;
    openRate: number;
    failureRate: number;
    failedCount: number;
  };
  care?: {
    openPrayers: number;
    upcomingBirthdays: number;
    upcomingAnniversaries: number;
    absentHouseholds: number;
  };
};

export type ExecutiveDashboard = {
  role: Role;
  organizationName: string;
  greetingName: string;
  health: ChurchHealthScore;
  kpis: ExecutiveKpi[];
  insights: OperationalInsight[];
  aiPanel: AiAssistantPanel;
  charts: ExecutiveCharts;
  tasks: TaskCenterItem[];
  modules: ModuleSnapshot;
  permissionsUsed: string[];
};
