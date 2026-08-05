import type {
  AiAssistantPanel,
  ModuleSnapshot,
  OperationalInsight,
  TaskCenterItem,
} from "@/domain/entities/intelligence";
import {
  InsightCategory,
  InsightSeverity,
  TaskCenterKind,
} from "@/domain/enums/intelligence";

/**
 * Context fed to insight providers. Designed so an LLM provider can consume
 * the same payload later without changing call sites.
 */
export type InsightContext = {
  organizationName: string;
  modules: ModuleSnapshot;
  now?: Date;
};

export type InsightProvider = {
  readonly id: string;
  generate(context: InsightContext): Promise<OperationalInsight[]>;
};

function insight(
  partial: Omit<OperationalInsight, "id"> & { id?: string }
): OperationalInsight {
  return {
    id:
      partial.id ??
      `${partial.category.toLowerCase()}-${partial.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .slice(0, 40)}`,
    ...partial,
  };
}

/**
 * Rule-based operational insight engine.
 * Swap or wrap with an LLM-backed InsightProvider later.
 */
export class RuleBasedInsightEngine implements InsightProvider {
  readonly id = "rule-engine";

  async generate(context: InsightContext): Promise<OperationalInsight[]> {
    const { modules } = context;
    const insights: OperationalInsight[] = [];

    if ((modules.care?.absentHouseholds ?? 0) >= 1) {
      insights.push(
        insight({
          category: InsightCategory.HOUSEHOLDS,
          severity:
            (modules.care?.absentHouseholds ?? 0) >= 5
              ? InsightSeverity.CRITICAL
              : InsightSeverity.WARNING,
          title: "Families absent 4+ weeks",
          summary: `${modules.care?.absentHouseholds} households have no recent attendance signal.`,
          suggestedAction: "Schedule pastoral check-ins for quiet households",
          href: "/households",
          metric: modules.care?.absentHouseholds,
          evidence: { absentHouseholds: modules.care?.absentHouseholds },
        })
      );
    }

    if ((modules.visitors?.needingFollowUpCount ?? 0) > 0) {
      insights.push(
        insight({
          category: InsightCategory.VISITORS,
          severity:
            (modules.visitors?.needingFollowUpCount ?? 0) >= 5
              ? InsightSeverity.CRITICAL
              : InsightSeverity.WARNING,
          title: "Visitors awaiting follow-up",
          summary: `${modules.visitors?.needingFollowUpCount} visitors need a personal touch.`,
          suggestedAction: "Clear open visitor tasks in the pipeline",
          href: "/visitors/tasks",
          metric: modules.visitors?.needingFollowUpCount,
        })
      );
    }

    if ((modules.ministries?.gaps ?? 0) > 0 || (modules.ministries?.coveragePercent ?? 100) < 75) {
      insights.push(
        insight({
          category: InsightCategory.VOLUNTEERS,
          severity:
            (modules.ministries?.coveragePercent ?? 100) < 60
              ? InsightSeverity.CRITICAL
              : InsightSeverity.WARNING,
          title: "Volunteer shortages",
          summary: `Coverage is ${Math.round(modules.ministries?.coveragePercent ?? 0)}% with staffing gaps across ministries.`,
          suggestedAction: "Open the schedule board and fill open slots",
          href: "/schedule",
          metric: modules.ministries?.coveragePercent,
        })
      );
    }

    const trend = modules.attendance?.weeklyTrend ?? [];
    if (trend.length >= 2) {
      const last = trend.at(-1)!.primary;
      const prev = trend.at(-2)!.primary;
      if (prev > 0 && last < prev * 0.92) {
        insights.push(
          insight({
            category: InsightCategory.ATTENDANCE,
            severity: InsightSeverity.WARNING,
            title: "Attendance trending down",
            summary: `Latest week (${Math.round(last)}) is below the prior week (${Math.round(prev)}).`,
            suggestedAction: "Review campus services and pastoral outreach",
            href: "/attendance",
            evidence: { last, prev },
          })
        );
      } else if (prev > 0 && last > prev * 1.05) {
        insights.push(
          insight({
            category: InsightCategory.ATTENDANCE,
            severity: InsightSeverity.SUCCESS,
            title: "Attendance climbing",
            summary: `Presence rose to ${Math.round(last)} from ${Math.round(prev)}.`,
            suggestedAction: "Celebrate wins with ministry leaders",
            href: "/attendance",
          })
        );
      }
    }

    if ((modules.events?.volunteerCoverage ?? 100) < 80) {
      insights.push(
        insight({
          category: InsightCategory.EVENTS,
          severity: InsightSeverity.WARNING,
          title: "Event staffing gaps",
          summary: `Upcoming event volunteer coverage is ${Math.round(modules.events?.volunteerCoverage ?? 0)}%.`,
          suggestedAction: "Link ministries and fill remaining slots",
          href: "/events",
          metric: modules.events?.volunteerCoverage,
        })
      );
    }

    if ((modules.communications?.failedCount ?? 0) > 0 || (modules.communications?.failureRate ?? 0) >= 10) {
      insights.push(
        insight({
          category: InsightCategory.COMMUNICATION,
          severity: InsightSeverity.WARNING,
          title: "Communication failures",
          summary: `${modules.communications?.failedCount ?? 0} failed sends · ${Math.round(modules.communications?.failureRate ?? 0)}% failure rate.`,
          suggestedAction: "Review failed deliveries in the Communication Hub",
          href: "/communications",
        })
      );
    }

    if ((modules.care?.openPrayers ?? 0) >= 3) {
      insights.push(
        insight({
          category: InsightCategory.PRAYER,
          severity: InsightSeverity.INFO,
          title: "Prayer backlog",
          summary: `${modules.care?.openPrayers} prayer requests are still open.`,
          suggestedAction: "Assign intercessors and update request status",
          href: "/people",
          metric: modules.care?.openPrayers,
        })
      );
    }

    if ((modules.care?.upcomingBirthdays ?? 0) > 0 || (modules.care?.upcomingAnniversaries ?? 0) > 0) {
      insights.push(
        insight({
          category: InsightCategory.CARE,
          severity: InsightSeverity.INFO,
          title: "Birthdays & anniversaries this week",
          summary: `${modules.care?.upcomingBirthdays ?? 0} birthdays · ${modules.care?.upcomingAnniversaries ?? 0} anniversaries.`,
          suggestedAction: "Queue care messages from the Communication Hub",
          href: "/communications",
        })
      );
    }

    if ((modules.visitors?.conversionRate ?? 0) >= 40) {
      insights.push(
        insight({
          category: InsightCategory.VISITORS,
          severity: InsightSeverity.SUCCESS,
          title: "Strong visitor conversion",
          summary: `Conversion is running at ${Math.round(modules.visitors?.conversionRate ?? 0)}%.`,
          suggestedAction: "Document what is working for hospitality teams",
          href: "/visitors",
        })
      );
    }

    return insights.slice(0, 12);
  }
}

export function buildAiAssistantPanel(
  context: InsightContext,
  insights: OperationalInsight[]
): AiAssistantPanel {
  const { modules, organizationName } = context;
  const critical = insights.filter((i) => i.severity === InsightSeverity.CRITICAL);
  const warnings = insights.filter((i) => i.severity === InsightSeverity.WARNING);

  const weeklySummary = [
    `${organizationName} health snapshot this week:`,
    modules.attendance
      ? `average presence around ${Math.round(modules.attendance.averagePresent)}`
      : null,
    modules.visitors
      ? `${modules.visitors.newVisitorsCount} new visitors with ${modules.visitors.needingFollowUpCount} needing follow-up`
      : null,
    modules.ministries
      ? `volunteer coverage at ${Math.round(modules.ministries.coveragePercent)}%`
      : null,
    modules.events
      ? `${modules.events.upcomingEvents} upcoming events`
      : null,
    critical.length || warnings.length
      ? `${critical.length} urgent and ${warnings.length} attention items`
      : "operations look calm",
  ]
    .filter(Boolean)
    .join(" · ");

  return {
    weeklySummary,
    suggestedActions: insights.slice(0, 5).map((i) => ({
      id: i.id,
      title: i.suggestedAction,
      reason: i.summary,
      href: i.href,
    })),
    ministryHighlights: [
      modules.ministries
        ? `${modules.ministries.activeVolunteers} active volunteers · reliability ${Math.round(modules.ministries.averageReliability)}`
        : "Connect ministries to unlock highlights",
      modules.events
        ? `Event readiness coverage ${Math.round(modules.events.volunteerCoverage)}%`
        : "No upcoming event staffing signal",
    ],
    visitorRecommendations: insights
      .filter((i) => i.category === InsightCategory.VISITORS)
      .map((i) => i.suggestedAction)
      .slice(0, 4),
    followUpPriorities: insights
      .filter(
        (i) =>
          i.category === InsightCategory.VISITORS ||
          i.category === InsightCategory.HOUSEHOLDS ||
          i.category === InsightCategory.PRAYER
      )
      .map((i) => i.title)
      .slice(0, 5),
    source: "rule-engine",
  };
}

export function buildTaskCenter(modules: ModuleSnapshot): TaskCenterItem[] {
  const tasks: TaskCenterItem[] = [];

  if ((modules.visitors?.openTasksCount ?? 0) > 0) {
    tasks.push({
      id: "follow-up-tasks",
      kind: TaskCenterKind.FOLLOW_UP,
      title: `${modules.visitors?.openTasksCount} follow-up tasks open`,
      description: "Visitor journey tasks waiting on leaders",
      href: "/visitors/tasks",
      priority: (modules.visitors?.openTasksCount ?? 0) >= 5 ? "high" : "medium",
    });
  }

  if ((modules.ministries?.gaps ?? 0) > 0 || (modules.ministries?.coveragePercent ?? 100) < 80) {
    tasks.push({
      id: "volunteer-gaps",
      kind: TaskCenterKind.VOLUNTEER_GAP,
      title: "Fill volunteer gaps",
      description: `Coverage ${Math.round(modules.ministries?.coveragePercent ?? 0)}% — open schedule board`,
      href: "/schedule",
      priority: "high",
    });
  }

  if ((modules.care?.upcomingBirthdays ?? 0) > 0) {
    tasks.push({
      id: "birthdays",
      kind: TaskCenterKind.BIRTHDAY,
      title: `${modules.care?.upcomingBirthdays} birthdays this week`,
      description: "Send care notes or schedule calls",
      href: "/communications",
      priority: "low",
    });
  }

  if ((modules.care?.upcomingAnniversaries ?? 0) > 0) {
    tasks.push({
      id: "anniversaries",
      kind: TaskCenterKind.ANNIVERSARY,
      title: `${modules.care?.upcomingAnniversaries} anniversaries ahead`,
      description: "Celebrate households this week",
      href: "/households",
      priority: "low",
    });
  }

  if ((modules.care?.openPrayers ?? 0) > 0) {
    tasks.push({
      id: "prayer-assignments",
      kind: TaskCenterKind.PRAYER,
      title: `${modules.care?.openPrayers} prayer requests open`,
      description: "Assign or close pastoral prayer items",
      href: "/people",
      priority: "medium",
    });
  }

  if ((modules.events?.upcomingEvents ?? 0) > 0 && (modules.events?.volunteerCoverage ?? 100) < 90) {
    tasks.push({
      id: "event-prep",
      kind: TaskCenterKind.EVENT_PREP,
      title: "Prepare upcoming events",
      description: `${modules.events?.upcomingEvents} events · staffing ${Math.round(modules.events?.volunteerCoverage ?? 0)}%`,
      href: "/events",
      priority: "medium",
    });
  }

  if ((modules.communications?.failedCount ?? 0) > 0) {
    tasks.push({
      id: "comm-failures",
      kind: TaskCenterKind.COMMUNICATION,
      title: "Resolve failed messages",
      description: `${modules.communications?.failedCount} failed deliveries`,
      href: "/communications",
      priority: "medium",
    });
  }

  return tasks;
}

export const defaultInsightProvider: InsightProvider = new RuleBasedInsightEngine();
