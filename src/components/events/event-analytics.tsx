"use client";

import { motion } from "framer-motion";
import {
  CalendarDays,
  Percent,
  Ticket,
  UserCheck,
  Users,
} from "lucide-react";
import { KpiCard } from "@/components/dashboard/stat-card";
import { FadeIn } from "@/components/motion/page-transition";
import { eventTypeLabel } from "@/components/events/utils";
import type { EventAnalytics } from "@/domain/entities/event";
import { formatNumber } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

type SerializedAnalytics = Omit<EventAnalytics, "recentActivity"> & {
  recentActivity: Array<
    Omit<EventAnalytics["recentActivity"][number], "occurredAt" | "createdAt"> & {
      occurredAt: string;
      createdAt: string;
    }
  >;
};

export function EventAnalyticsPanel({
  analytics,
}: {
  analytics: SerializedAnalytics;
}) {
  const maxType = Math.max(
    1,
    ...analytics.eventsByType.map((t) => t.count)
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard
          label="Upcoming"
          value={formatNumber(analytics.upcomingEvents)}
          icon={CalendarDays}
        />
        <KpiCard
          label="Registrations"
          value={formatNumber(analytics.totalRegistrations)}
          icon={Ticket}
        />
        <KpiCard
          label="Check-ins"
          value={formatNumber(analytics.totalCheckIns)}
          icon={UserCheck}
        />
        <KpiCard
          label="No-show rate"
          value={`${analytics.noShowRate}%`}
          icon={Percent}
        />
        <KpiCard
          label="Volunteer coverage"
          value={`${analytics.volunteerCoverage}%`}
          icon={Users}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <FadeIn>
          <div className="glass rounded-[1.75rem] p-5">
            <h3 className="font-display text-lg font-semibold">By type</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Mix of gatherings across the calendar
            </p>
            <ul className="space-y-3">
              {analytics.eventsByType.slice(0, 8).map((row) => (
                <li key={row.type} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>{eventTypeLabel(row.type)}</span>
                    <span className="text-muted-foreground">{row.count}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <motion.div
                      className="h-full rounded-full bg-primary/80"
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.round((row.count / maxType) * 100)}%`,
                      }}
                      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>
                </li>
              ))}
              {analytics.eventsByType.length === 0 && (
                <li className="text-sm text-muted-foreground">No events yet</li>
              )}
            </ul>
          </div>
        </FadeIn>

        <FadeIn delay={0.06}>
          <div className="glass rounded-[1.75rem] p-5">
            <h3 className="font-display text-lg font-semibold">Timeline</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Recent operational activity
            </p>
            <ul className="relative space-y-4 before:absolute before:bottom-2 before:left-[7px] before:top-2 before:w-px before:bg-border/70">
              {analytics.recentActivity.map((item, index) => (
                <li
                  key={item.id}
                  className={cn("relative pl-6", index === 0 && "pt-0")}
                >
                  <span className="absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-primary/40 bg-background" />
                  <p className="text-sm font-medium">{item.title}</p>
                  {item.description && (
                    <p className="text-xs text-muted-foreground">
                      {item.description}
                    </p>
                  )}
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {format(new Date(item.occurredAt), "MMM d · h:mm a")}
                  </p>
                </li>
              ))}
              {analytics.recentActivity.length === 0 && (
                <li className="pl-6 text-sm text-muted-foreground">
                  Activity will appear as events move
                </li>
              )}
            </ul>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}
