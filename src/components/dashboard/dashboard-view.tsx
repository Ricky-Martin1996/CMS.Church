"use client";

import { useCallback, useEffect, useState } from "react";
import { getExecutiveDashboardAction } from "@/application/intelligence/actions";
import {
  AiAssistantPanelView,
  ExecutiveChartsPanel,
  HealthScoreRing,
  InsightList,
  RoleKpiStrip,
  ROLE_LABELS,
  TaskCenter,
} from "@/components/dashboard/executive/panels";
import { FadeIn } from "@/components/motion/page-transition";
import { ErrorState, LoadingState } from "@/components/shared/states";
import type { ExecutiveDashboard } from "@/domain/entities/intelligence";
import { Badge } from "@/components/ui/badge";

type SerializedDashboard = Omit<
  ExecutiveDashboard,
  "health" | "tasks" | "insights"
> & {
  health: Omit<ExecutiveDashboard["health"], "computedAt"> & {
    computedAt: string;
  };
  insights: ExecutiveDashboard["insights"];
  tasks: Array<
    Omit<ExecutiveDashboard["tasks"][number], "dueAt"> & {
      dueAt: string | null;
    }
  >;
};

export function DashboardView() {
  const [data, setData] = useState<SerializedDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await getExecutiveDashboardAction();
    if (!res.ok) {
      setError(res.error);
      setLoading(false);
      return;
    }
    setData(JSON.parse(JSON.stringify(res.data)) as SerializedDashboard);
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return <LoadingState label="Loading leadership intelligence…" />;
  }
  if (error || !data) {
    return (
      <ErrorState
        description={error ?? "Unable to load dashboard"}
        onRetry={load}
      />
    );
  }

  const roleLabel = ROLE_LABELS[data.role] ?? data.role;

  return (
    <div className="space-y-6 lg:space-y-7">
      <FadeIn>
        <div className="relative overflow-hidden rounded-[2rem] glass-strong p-6 sm:p-8">
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-chart-2/20 blur-3xl" />
          <div className="relative max-w-3xl space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium text-primary">
                {data.organizationName}
              </p>
              <Badge variant="outline">{roleLabel} view</Badge>
            </div>
            <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-5xl">
              Good day, {data.greetingName}
            </h1>
            <p className="max-w-2xl text-balance text-muted-foreground">
              Executive intelligence across members, households, attendance,
              visitors, ministries, events, and communications — scoped to your
              role.
            </p>
          </div>
        </div>
      </FadeIn>

      <RoleKpiStrip kpis={data.kpis} />

      <HealthScoreRing
        health={{
          ...data.health,
          computedAt: new Date(data.health.computedAt),
        }}
      />

      <div className="grid gap-4 xl:grid-cols-5">
        <div className="xl:col-span-3">
          <InsightList insights={data.insights} />
        </div>
        <div className="xl:col-span-2">
          <AiAssistantPanelView panel={data.aiPanel} />
        </div>
      </div>

      <ExecutiveChartsPanel charts={data.charts} roleLabel={roleLabel} />

      <div className="grid gap-4 lg:grid-cols-1">
        <TaskCenter
          tasks={data.tasks.map((t) => ({
            ...t,
            dueAt: t.dueAt ? new Date(t.dueAt) : null,
          }))}
        />
      </div>
    </div>
  );
}
