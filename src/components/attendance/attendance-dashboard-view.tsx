"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ClipboardCheck,
  LayoutList,
  QrCode,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
import {
  getActiveLiveSessionAction,
  getAnalyticsAction,
  getDashboardAction,
  getLiveStatsAction,
} from "@/application/attendance/actions";
import {
  MinistryComparisonCards,
  SessionComparisonChart,
  WeeklyTrendChart,
} from "@/components/attendance/attendance-charts";
import { LiveStatsHeader } from "@/components/attendance/live-stats-header";
import { SessionStatusBadge } from "@/components/attendance/session-status-badge";
import { formatSessionDate } from "@/components/attendance/utils";
import { KpiCard } from "@/components/dashboard/stat-card";
import { ErrorState, LoadingState } from "@/components/shared/states";
import { FadeIn } from "@/components/motion/page-transition";
import type {
  AttendanceAnalytics,
  AttendanceDashboard,
  SessionLiveStats,
} from "@/domain/entities/attendance";
import { AttendanceSessionStatus } from "@/domain/enums/member";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/utils";

export function AttendanceDashboardView() {
  const [dashboard, setDashboard] = useState<AttendanceDashboard | null>(null);
  const [analytics, setAnalytics] = useState<AttendanceAnalytics | null>(null);
  const [liveStats, setLiveStats] = useState<SessionLiveStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [dashRes, analyticsRes, liveRes] = await Promise.all([
      getDashboardAction(),
      getAnalyticsAction(),
      getActiveLiveSessionAction(),
    ]);

    if (!dashRes.ok) {
      setError(dashRes.error);
      setLoading(false);
      return;
    }
    if (!analyticsRes.ok) {
      setError(analyticsRes.error);
      setLoading(false);
      return;
    }

    setDashboard(dashRes.data);
    setAnalytics(analyticsRes.data);

    if (liveRes.ok && liveRes.data) {
      const statsRes = await getLiveStatsAction(liveRes.data.id);
      if (statsRes.ok) setLiveStats(statsRes.data);
    } else {
      setLiveStats(null);
    }

    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!dashboard?.activeLiveSession) return;
    const tick = async () => {
      if (typeof document !== "undefined" && document.hidden) return;
      const statsRes = await getLiveStatsAction(
        dashboard.activeLiveSession!.id
      );
      if (statsRes.ok) setLiveStats(statsRes.data);
    };
    const interval = setInterval(() => {
      void tick();
    }, 5000);
    const onVisibility = () => {
      if (!document.hidden) void tick();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [dashboard?.activeLiveSession]);

  if (loading) return <LoadingState label="Loading attendance…" />;
  if (error || !dashboard || !analytics)
    return (
      <ErrorState
        description={error ?? "Unable to load attendance data"}
        onRetry={() => {
          setLoading(true);
          load();
        }}
      />
    );

  const isLive =
    dashboard.activeLiveSession?.status === AttendanceSessionStatus.LIVE;

  return (
    <div className="space-y-6 lg:space-y-7">
      <FadeIn>
        <div className="relative overflow-hidden rounded-[2rem] glass-strong p-6 sm:p-8">
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-chart-2/20 blur-3xl" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-2">
              <p className="text-sm font-medium text-primary">Attendance</p>
              <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-5xl">
                Check-in & insights
              </h1>
              <p className="max-w-xl text-muted-foreground text-balance">
                Live service counts, visitor trends, and session analytics —
                everything your team needs at a glance.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="glow" size="lg" asChild>
                <Link href="/attendance/check-in">
                  <QrCode className="h-4 w-4" />
                  Open Check-in
                </Link>
              </Button>
              <Button variant="glass" size="lg" asChild>
                <Link href="/attendance/sessions">
                  <LayoutList className="h-4 w-4" />
                  Manage Sessions
                </Link>
              </Button>
              <Button variant="ghost" size="lg" asChild>
                <Link href="/visitors">
                  Visitor Journey →
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </FadeIn>

      {isLive && liveStats && dashboard.activeLiveSession && (
        <FadeIn delay={0.04}>
          <div className="glass-strong rounded-[2rem] p-6 sm:p-8">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <SessionStatusBadge
                status={AttendanceSessionStatus.LIVE}
                pulse
              />
              <span className="text-sm text-muted-foreground">
                {dashboard.activeLiveSession.serviceName} ·{" "}
                {formatSessionDate(dashboard.activeLiveSession.date)}
              </span>
            </div>
            <LiveStatsHeader
              stats={liveStats}
              serviceName={dashboard.activeLiveSession.serviceName}
            />
          </div>
        </FadeIn>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Total present (30d)"
          value={formatNumber(dashboard.totalPresent)}
          icon={Users}
          delay={0.05}
        />
        <KpiCard
          label="Visitors (30d)"
          value={formatNumber(dashboard.totalVisitors)}
          icon={UserPlus}
          delay={0.1}
        />
        <KpiCard
          label="Avg. per session"
          value={formatNumber(Math.round(dashboard.averagePresent))}
          icon={TrendingUp}
          delay={0.15}
        />
        <KpiCard
          label="Sessions (30d)"
          value={formatNumber(dashboard.totalSessions)}
          icon={ClipboardCheck}
          delay={0.2}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-5">
        <div className="xl:col-span-3">
          <WeeklyTrendChart data={analytics.weeklyTrend} delay={0.1} />
        </div>
        <div className="xl:col-span-2">
          <SessionComparisonChart
            sessions={dashboard.recentSessions}
            delay={0.14}
          />
        </div>
      </div>

      <MinistryComparisonCards data={analytics.bySessionType} delay={0.16} />

      {analytics.visitorStats.totalVisitors > 0 && (
        <FadeIn delay={0.18}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                label: "Total visitors",
                value: analytics.visitorStats.totalVisitors,
              },
              {
                label: "First-time",
                value: analytics.visitorStats.firstTimeVisitors,
              },
              {
                label: "Second visit",
                value: analytics.visitorStats.secondTimeVisitors,
              },
              {
                label: "Returning",
                value: analytics.visitorStats.returningVisitors,
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="glass rounded-[1.75rem] p-5"
              >
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="mt-1 font-display text-3xl font-semibold">
                  {formatNumber(stat.value)}
                </p>
              </div>
            ))}
          </div>
        </FadeIn>
      )}
    </div>
  );
}
