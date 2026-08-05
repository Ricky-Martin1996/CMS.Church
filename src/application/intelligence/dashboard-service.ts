import { getAnalytics as getAttendanceAnalytics } from "@/application/attendance/attendance-service";
import { getDashboard as getAttendanceDashboard } from "@/application/attendance/attendance-service";
import { getCommunicationAnalytics } from "@/application/communications/communication-service";
import { getEventAnalytics } from "@/application/events/event-service";
import { calculateChurchHealthScore } from "@/application/intelligence/health-score";
import {
  buildAiAssistantPanel,
  buildTaskCenter,
  defaultInsightProvider,
  type InsightProvider,
} from "@/application/intelligence/insight-engine";
import { getMinistryAnalytics } from "@/application/ministries/ministry-service";
import { getVisitorDashboard } from "@/application/visitors/visitor-journey-service";
import type {
  ChartSeriesPoint,
  ExecutiveCharts,
  ExecutiveDashboard,
  ExecutiveKpi,
  ModuleSnapshot,
} from "@/domain/entities/intelligence";
import type { TenantContext } from "@/domain/entities/tenant";
import { Role, ROLE_LABELS } from "@/domain/enums/role";
import { Permission, roleHasPermission } from "@/domain/permissions/rbac";
import { prisma } from "@/infrastructure/db/prisma";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { addDays, format, startOfDay, startOfMonth, subDays, subWeeks } from "date-fns";

function greetingName(ctx: TenantContext) {
  return ctx.user.firstName?.trim() || ROLE_LABELS[ctx.role] || "Leader";
}

async function collectCareSignals(organizationId: string) {
  const now = new Date();
  const inSeven = addDays(now, 7);
  const monthStart = startOfMonth(now);
  const fourWeeksAgo = subWeeks(startOfDay(now), 4);

  const [
    openPrayers,
    birthdayMembers,
    anniversaryHouseholds,
    activeHouseholds,
    recentAttendanceHouseholdIds,
  ] = await Promise.all([
    prisma.prayerRequest.count({
      where: {
        organizationId,
        status: { in: ["OPEN", "PRAYING"] },
      },
    }),
    prisma.member.findMany({
      where: {
        organizationId,
        deletedAt: null,
        dateOfBirth: { not: null },
      },
      select: { id: true, dateOfBirth: true },
      take: 2000,
    }),
    prisma.household.findMany({
      where: {
        organizationId,
        deletedAt: null,
        anniversaryDate: { not: null },
      },
      select: { id: true, anniversaryDate: true },
      take: 1000,
    }),
    prisma.household.count({
      where: { organizationId, deletedAt: null, status: "ACTIVE" },
    }),
    prisma.attendanceRecord.findMany({
      where: {
        organizationId,
        attendedAt: { gte: fourWeeksAgo },
        householdId: { not: null },
      },
      select: { householdId: true },
      distinct: ["householdId"],
    }),
  ]);

  const upcomingBirthdays = birthdayMembers.filter((m) => {
    if (!m.dateOfBirth) return false;
    const next = new Date(
      now.getFullYear(),
      m.dateOfBirth.getMonth(),
      m.dateOfBirth.getDate()
    );
    if (next < startOfDay(now)) next.setFullYear(now.getFullYear() + 1);
    return next <= inSeven;
  }).length;

  const upcomingAnniversaries = anniversaryHouseholds.filter((h) => {
    if (!h.anniversaryDate) return false;
    const next = new Date(
      now.getFullYear(),
      h.anniversaryDate.getMonth(),
      h.anniversaryDate.getDate()
    );
    if (next < startOfDay(now)) next.setFullYear(now.getFullYear() + 1);
    return next <= inSeven;
  }).length;

  const presentHouseholdIds = new Set(
    recentAttendanceHouseholdIds
      .map((r) => r.householdId)
      .filter(Boolean) as string[]
  );
  const absentHouseholds = Math.max(0, activeHouseholds - presentHouseholdIds.size);

  void monthStart;
  return {
    openPrayers,
    upcomingBirthdays,
    upcomingAnniversaries,
    absentHouseholds,
  };
}

async function collectMemberSnapshot(organizationId: string) {
  const monthStart = startOfMonth(new Date());
  const [totalCount, activeCount, newThisMonth, growthBuckets] = await Promise.all([
    prisma.member.count({
      where: { organizationId, deletedAt: null },
    }),
    prisma.member.count({
      where: {
        organizationId,
        deletedAt: null,
        status: { in: ["ACTIVE", "NEW_MEMBER"] },
      },
    }),
    prisma.member.count({
      where: {
        organizationId,
        deletedAt: null,
        createdAt: { gte: monthStart },
      },
    }),
    Promise.all(
      Array.from({ length: 6 }, async (_, i) => {
        const end = startOfMonth(subDays(new Date(), (5 - i) * 30));
        const start = startOfMonth(subDays(end, 30));
        const count = await prisma.member.count({
          where: {
            organizationId,
            deletedAt: null,
            createdAt: { lte: end },
          },
        });
        return {
          label: format(start, "MMM"),
          primary: count,
        } satisfies ChartSeriesPoint;
      })
    ),
  ]);

  return { totalCount, activeCount, newThisMonth, growthBuckets };
}

async function collectHouseholdSnapshot(organizationId: string) {
  const agg = await prisma.household.aggregate({
    where: { organizationId, deletedAt: null, status: "ACTIVE" },
    _avg: { engagementScore: true },
    _count: true,
  });

  const top = await prisma.household.findMany({
    where: { organizationId, deletedAt: null, status: "ACTIVE" },
    orderBy: { engagementScore: "desc" },
    take: 6,
    select: { familyName: true, engagementScore: true },
  });

  return {
    activeCount: agg._count,
    averageEngagement: agg._avg.engagementScore ?? 0,
    engagementSeries: top.map((h) => ({
      label: h.familyName.slice(0, 10),
      primary: h.engagementScore,
    })),
  };
}

function emptyCharts(): ExecutiveCharts {
  return {
    attendance: [],
    growth: [],
    visitors: [],
    householdEngagement: [],
    volunteerReliability: [],
    eventParticipation: [],
    communicationDelivery: [],
  };
}

function buildKpis(
  role: Role,
  modules: ModuleSnapshot,
  permissions: Set<string>
): ExecutiveKpi[] {
  const kpis: ExecutiveKpi[] = [];

  const push = (kpi: ExecutiveKpi, permission?: string) => {
    if (permission && !permissions.has(permission)) return;
    kpis.push(kpi);
  };

  if (role === Role.FINANCE_MANAGER) {
    push(
      {
        id: "giving-view",
        label: "People with giving visibility",
        value: formatNumber(modules.members?.activeCount ?? 0),
        delta: `+${modules.members?.newThisMonth ?? 0} new`,
        href: "/people",
        spark: [40, 44, 48, 52, 55, 60],
      },
      Permission.PEOPLE_GIVING_VIEW
    );
    push(
      {
        id: "households",
        label: "Active households",
        value: formatNumber(modules.households?.activeCount ?? 0),
        href: "/households",
      },
      Permission.HOUSEHOLDS_READ
    );
    push(
      {
        id: "attendance",
        label: "Avg attendance",
        value: formatNumber(Math.round(modules.attendance?.averagePresent ?? 0)),
        href: "/attendance",
      },
      Permission.ATTENDANCE_READ
    );
    push({
      id: "engagement",
      label: "Household engagement",
      value: `${Math.round(modules.households?.averageEngagement ?? 0)}`,
      href: "/households",
    });
    return kpis.slice(0, 4);
  }

  if (role === Role.VOLUNTEER_LEADER) {
    push(
      {
        id: "volunteers",
        label: "Active volunteers",
        value: formatNumber(modules.ministries?.activeVolunteers ?? 0),
        href: "/volunteers",
      },
      Permission.VOLUNTEER_READ
    );
    push(
      {
        id: "coverage",
        label: "Schedule coverage",
        value: `${Math.round(modules.ministries?.coveragePercent ?? 0)}%`,
        href: "/schedule",
      },
      Permission.SCHEDULE_MANAGE
    );
    push(
      {
        id: "reliability",
        label: "Reliability",
        value: `${Math.round(modules.ministries?.averageReliability ?? 0)}`,
        href: "/volunteers",
      },
      Permission.VOLUNTEER_READ
    );
    push(
      {
        id: "events",
        label: "Upcoming events",
        value: formatNumber(modules.events?.upcomingEvents ?? 0),
        href: "/events",
      },
      Permission.EVENT_READ
    );
    return kpis.slice(0, 4);
  }

  if (role === Role.CELL_LEADER) {
    push(
      {
        id: "households",
        label: "Households",
        value: formatNumber(modules.households?.activeCount ?? 0),
        href: "/households",
      },
      Permission.HOUSEHOLDS_READ
    );
    push(
      {
        id: "visitors",
        label: "Need follow-up",
        value: formatNumber(modules.visitors?.needingFollowUpCount ?? 0),
        href: "/visitors",
      },
      Permission.VISITOR_READ
    );
    push(
      {
        id: "attendance",
        label: "Avg attendance",
        value: formatNumber(Math.round(modules.attendance?.averagePresent ?? 0)),
        href: "/attendance",
      },
      Permission.ATTENDANCE_READ
    );
    push(
      {
        id: "absent",
        label: "Quiet households",
        value: formatNumber(modules.care?.absentHouseholds ?? 0),
        href: "/households",
      },
      Permission.HOUSEHOLDS_READ
    );
    return kpis.slice(0, 4);
  }

  // Pastor / Church Admin / Super Admin / default leadership
  push(
    {
      id: "members",
      label: "Active members",
      value: formatNumber(modules.members?.activeCount ?? 0),
      delta: `+${modules.members?.newThisMonth ?? 0}`,
      href: "/people",
      spark: [40, 48, 46, 55, 62, 70],
    },
    Permission.PEOPLE_READ
  );
  push(
    {
      id: "attendance",
      label: "Avg. Sunday attendance",
      value: formatNumber(Math.round(modules.attendance?.averagePresent ?? 0)),
      href: "/attendance",
      spark: modules.attendance?.weeklyTrend.map((p) => p.primary) ?? undefined,
    },
    Permission.ATTENDANCE_READ
  );
  push(
    {
      id: "visitors",
      label: "Visitor conversion",
      value: `${Math.round(modules.visitors?.conversionRate ?? 0)}%`,
      delta: `${modules.visitors?.newVisitorsCount ?? 0} new`,
      href: "/visitors",
    },
    Permission.VISITOR_READ
  );
  push(
    {
      id: "events",
      label: "Events upcoming",
      value: formatNumber(modules.events?.upcomingEvents ?? 0),
      href: "/events",
    },
    Permission.EVENT_READ
  );

  if (role === Role.CHURCH_ADMIN || role === Role.SUPER_ADMIN) {
    push(
      {
        id: "comms",
        label: "Comm. delivery",
        value: `${Math.round(modules.communications?.deliveryRate ?? 0)}%`,
        href: "/communications",
      },
      Permission.COMMUNICATION_READ
    );
  }

  // Finance-ish giving card when permitted (demo-friendly)
  if (permissions.has(Permission.GIVING_READ) || permissions.has(Permission.PEOPLE_GIVING_VIEW)) {
    if (kpis.length < 4) {
      kpis.push({
        id: "giving",
        label: "Giving pulse",
        value: formatCurrency(0),
        delta: "Connect giving module",
        href: "/giving",
        spark: [35, 42, 40, 55, 58, 68],
      });
    }
  }

  return kpis.slice(0, 4);
}

export async function getExecutiveDashboard(
  ctx: TenantContext,
  options?: { insightProvider?: InsightProvider }
): Promise<ExecutiveDashboard> {
  const organizationId = ctx.organization.id;
  const role = ctx.role;
  const permissionsUsed: string[] = [];
  const can = (permission: (typeof Permission)[keyof typeof Permission]) => {
    const ok = roleHasPermission(role, permission);
    if (ok) permissionsUsed.push(permission);
    return ok;
  };

  const modules: ModuleSnapshot = {};
  const charts = emptyCharts();

  const memberPromise = can(Permission.PEOPLE_READ)
    ? collectMemberSnapshot(organizationId)
    : null;
  const householdPromise = can(Permission.HOUSEHOLDS_READ)
    ? collectHouseholdSnapshot(organizationId)
    : null;
  const attendancePromise = can(Permission.ATTENDANCE_READ)
    ? Promise.all([
        getAttendanceDashboard(organizationId, {
          from: subWeeks(new Date(), 8),
          to: new Date(),
        }),
        getAttendanceAnalytics(organizationId),
      ])
    : null;
  const visitorPromise = can(Permission.VISITOR_READ)
    ? getVisitorDashboard(organizationId)
    : null;
  const ministryPromise =
    can(Permission.MINISTRY_READ) || can(Permission.VOLUNTEER_READ)
      ? getMinistryAnalytics(organizationId)
      : null;
  const eventPromise = can(Permission.EVENT_READ)
    ? getEventAnalytics(organizationId)
    : null;
  const communicationPromise = can(Permission.COMMUNICATION_READ)
    ? getCommunicationAnalytics(organizationId)
    : null;
  const carePromise =
    can(Permission.PEOPLE_READ) || can(Permission.HOUSEHOLDS_READ)
      ? collectCareSignals(organizationId)
      : null;

  const [
    members,
    households,
    attendance,
    visitors,
    ministries,
    events,
    communications,
    care,
  ] = await Promise.all([
    memberPromise,
    householdPromise,
    attendancePromise,
    visitorPromise,
    ministryPromise,
    eventPromise,
    communicationPromise,
    carePromise,
  ]);

  if (members) {
    modules.members = {
      activeCount: members.activeCount,
      newThisMonth: members.newThisMonth,
      totalCount: members.totalCount,
    };
    charts.growth = members.growthBuckets;
  }

  if (households) {
    modules.households = {
      activeCount: households.activeCount,
      averageEngagement: households.averageEngagement,
    };
    charts.householdEngagement = households.engagementSeries;
  }

  if (attendance) {
    const [dashboard, analytics] = attendance;
    modules.attendance = {
      averagePresent: dashboard.averagePresent,
      weeklyTrend: analytics.weeklyTrend.map((p) => ({
        label: p.label,
        primary: p.presentCount,
        secondary: p.visitorCount,
      })),
    };
    charts.attendance = modules.attendance.weeklyTrend;
  }

  if (visitors) {
    modules.visitors = {
      newVisitorsCount: visitors.newVisitorsCount,
      needingFollowUpCount: visitors.needingFollowUpCount,
      conversionRate: visitors.conversionRate,
      openTasksCount: visitors.openTasksCount,
    };
    charts.visitors = visitors.funnel.map((f) => ({
      label: f.label,
      primary: f.count,
    }));
  }

  if (ministries) {
    const gaps = ministries.coverageByMinistry.filter(
      (c) => c.coveragePercent < 100
    ).length;
    modules.ministries = {
      coveragePercent: ministries.coveragePercent,
      averageReliability: ministries.averageReliability,
      activeVolunteers: ministries.activeVolunteers,
      gaps,
    };
    charts.volunteerReliability = ministries.coverageByMinistry
      .slice(0, 6)
      .map((c) => ({
        label: c.ministryName.slice(0, 12),
        primary: c.coveragePercent,
        secondary: ministries.averageReliability,
      }));
  }

  if (events) {
    modules.events = {
      upcomingEvents: events.upcomingEvents,
      volunteerCoverage: events.volunteerCoverage,
      averageCapacityUsage: events.averageCapacityUsage,
      noShowRate: events.noShowRate,
    };
    charts.eventParticipation = events.eventsByType.slice(0, 6).map((e) => ({
      label: e.type.replaceAll("_", " ").slice(0, 14),
      primary: e.count,
    }));
  }

  if (communications) {
    modules.communications = {
      deliveryRate: communications.deliveryRate,
      openRate: communications.openRate,
      failureRate: communications.failureRate,
      failedCount: communications.failedCount,
    };
    charts.communicationDelivery = communications.byChannel.map((c) => ({
      label: c.channel,
      primary: c.count,
    }));
  }

  if (care) {
    modules.care = care;
  }

  const health = calculateChurchHealthScore(modules);
  const insightProvider = options?.insightProvider ?? defaultInsightProvider;
  const insightContext = {
    organizationName: ctx.organization.name,
    modules,
  };
  const insights = await insightProvider.generate(insightContext);
  const aiPanel = buildAiAssistantPanel(insightContext, insights);
  const tasks = buildTaskCenter(modules).filter((task) => {
    if (task.href?.startsWith("/visitors") && !can(Permission.VISITOR_READ)) {
      return false;
    }
    if (task.href?.startsWith("/schedule") && !can(Permission.SCHEDULE_MANAGE) && !can(Permission.VOLUNTEER_READ)) {
      return false;
    }
    if (task.href?.startsWith("/communications") && !can(Permission.COMMUNICATION_READ)) {
      return false;
    }
    if (task.href?.startsWith("/events") && !can(Permission.EVENT_READ)) {
      return false;
    }
    if (task.href?.startsWith("/households") && !can(Permission.HOUSEHOLDS_READ)) {
      return false;
    }
    if (task.href?.startsWith("/people") && !can(Permission.PEOPLE_READ)) {
      return false;
    }
    return true;
  });

  const permissionSet = new Set(permissionsUsed);
  // Re-run can for KPI gating without duplicating side effects — use role checks
  const kpis = buildKpis(role, modules, new Set([
    ...Object.values(Permission).filter((p) => roleHasPermission(role, p)),
  ]));

  void permissionSet;

  return {
    role,
    organizationName: ctx.organization.name,
    greetingName: greetingName(ctx),
    health,
    kpis,
    insights,
    aiPanel,
    charts,
    tasks,
    modules,
    permissionsUsed: [...new Set(permissionsUsed)],
  };
}
