"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Clock,
  Kanban,
  ListTodo,
  MessageSquare,
  Percent,
  UserPlus,
  Users,
} from "lucide-react";
import { getVisitorDashboardAction } from "@/application/visitors/actions";
import { KpiCard } from "@/components/dashboard/stat-card";
import { ErrorState, LoadingState } from "@/components/shared/states";
import { FadeIn } from "@/components/motion/page-transition";
import { VisitorFunnel } from "@/components/visitors/visitor-funnel";
import {
  formatResponseTime,
  formatPercent,
  formatRelativeDate,
} from "@/components/visitors/utils";
import { COMMUNICATION_CHANNEL_LABELS } from "@/domain/enums/visitor";
import type { VisitorDashboard } from "@/domain/entities/visitor-journey";
import type { CommunicationLogEntity } from "@/domain/entities/visitor-journey";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/utils";

type SerializedDashboard = Omit<
  VisitorDashboard,
  "recentCommunications"
> & {
  recentCommunications: Array<
    Omit<CommunicationLogEntity, "occurredAt" | "createdAt"> & {
      occurredAt: string;
      createdAt: string;
    }
  >;
};

export function VisitorsDashboardView() {
  const [dashboard, setDashboard] = useState<SerializedDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await getVisitorDashboardAction();
    if (!res.ok) {
      setError(res.error);
      setLoading(false);
      return;
    }
    setDashboard(JSON.parse(JSON.stringify(res.data)) as SerializedDashboard);
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <LoadingState label="Loading visitor journey…" />;
  if (error || !dashboard)
    return (
      <ErrorState
        description={error ?? "Unable to load visitor dashboard"}
        onRetry={() => {
          setLoading(true);
          load();
        }}
      />
    );

  return (
    <div className="space-y-6 lg:space-y-7">
      <FadeIn>
        <div className="relative overflow-hidden rounded-[2rem] glass-strong p-6 sm:p-8">
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-chart-2/20 blur-3xl" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-2">
              <p className="text-sm font-medium text-primary">Visitor Journey</p>
              <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-5xl">
                Follow-up & conversion
              </h1>
              <p className="max-w-xl text-muted-foreground text-balance">
                Track every guest from first visit through membership — with
                clear next steps for your hospitality team.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="glow" size="lg" asChild>
                <Link href="/visitors/pipeline">
                  <Kanban className="h-4 w-4" />
                  Open Pipeline
                </Link>
              </Button>
              <Button variant="glass" size="lg" asChild>
                <Link href="/visitors/tasks">
                  <ListTodo className="h-4 w-4" />
                  Open Tasks
                </Link>
              </Button>
              <Button variant="glass" size="lg" asChild>
                <Link href="/attendance/check-in">
                  <UserPlus className="h-4 w-4" />
                  New visitor
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </FadeIn>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard
          label="New visitors"
          value={formatNumber(dashboard.newVisitorsCount)}
          icon={UserPlus}
          delay={0.05}
        />
        <KpiCard
          label="Needing follow-up"
          value={formatNumber(dashboard.needingFollowUpCount)}
          icon={Users}
          delay={0.08}
        />
        <KpiCard
          label="Conversion rate"
          value={formatPercent(dashboard.conversionRate)}
          icon={Percent}
          delay={0.11}
        />
        <KpiCard
          label="Avg response time"
          value={formatResponseTime(dashboard.avgResponseTimeHours)}
          icon={Clock}
          delay={0.14}
        />
        <KpiCard
          label="Open tasks"
          value={formatNumber(dashboard.openTasksCount)}
          icon={ListTodo}
          delay={0.17}
        />
      </div>

      <FadeIn delay={0.1}>
        <div className="glass-strong rounded-[2rem] p-6 sm:p-8">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-semibold">
                Journey funnel
              </h2>
              <p className="text-sm text-muted-foreground">
                Guests at each stage of the pipeline
              </p>
            </div>
            <Button variant="glass" size="sm" asChild>
              <Link href="/visitors/pipeline">
                View board
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <VisitorFunnel stages={dashboard.funnel} />
        </div>
      </FadeIn>

      <FadeIn delay={0.14}>
        <div className="glass rounded-[2rem] p-6 sm:p-8">
          <div className="mb-4 flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" aria-hidden />
            <h2 className="font-display text-xl font-semibold">
              Recent communications
            </h2>
          </div>
          {dashboard.recentCommunications.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No communications logged yet. Open a visitor profile to log your
              first touchpoint.
            </p>
          ) : (
            <ul className="space-y-2" aria-label="Recent communications">
              {dashboard.recentCommunications.map((comm) => (
                <li
                  key={comm.id}
                  className="flex flex-col gap-1 rounded-2xl border border-border/50 bg-background/35 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {COMMUNICATION_CHANNEL_LABELS[comm.channel]}
                      {comm.subject ? ` · ${comm.subject}` : ""}
                    </p>
                    <p className="truncate text-sm text-muted-foreground">
                      {comm.body}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
                    <time>{formatRelativeDate(comm.occurredAt)}</time>
                    <Link
                      href={`/visitors/${comm.visitorId}`}
                      className="font-medium text-primary hover:underline"
                    >
                      View
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </FadeIn>
    </div>
  );
}
