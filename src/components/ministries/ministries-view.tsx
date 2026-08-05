"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Clock,
  Loader2,
  Percent,
  Sparkles,
  Users,
  Wand2,
} from "lucide-react";
import {
  ensureDefaultMinistriesAction,
  getMinistryAnalyticsAction,
  listMinistriesAction,
} from "@/application/ministries/actions";
import { KpiCard } from "@/components/dashboard/stat-card";
import { MinistryAnalyticsCharts } from "@/components/ministries/ministry-analytics";
import { formatPercent, ministryStatusVariant } from "@/components/ministries/utils";
import { FadeIn } from "@/components/motion/page-transition";
import { ErrorState, LoadingState } from "@/components/shared/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { MinistryAnalytics, MinistryEntity } from "@/domain/entities/ministry";
import { MINISTRY_STATUS_LABELS } from "@/domain/enums/ministry";
import { formatNumber } from "@/lib/utils";
import { cn } from "@/lib/utils";

type SerializedMinistry = Omit<MinistryEntity, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};

type SerializedAnalytics = Omit<MinistryAnalytics, "recentActivity"> & {
  recentActivity: Array<
    Omit<MinistryAnalytics["recentActivity"][number], "occurredAt" | "createdAt"> & {
      occurredAt: string;
      createdAt: string;
    }
  >;
};

export function MinistriesView() {
  const [ministries, setMinistries] = useState<SerializedMinistry[]>([]);
  const [analytics, setAnalytics] = useState<SerializedAnalytics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, startTransition] = useTransition();

  const load = useCallback(async () => {
    const [ministriesRes, analyticsRes] = await Promise.all([
      listMinistriesAction(),
      getMinistryAnalyticsAction(),
    ]);

    if (!ministriesRes.ok) {
      setError(ministriesRes.error);
      setLoading(false);
      return;
    }
    if (!analyticsRes.ok) {
      setError(analyticsRes.error);
      setLoading(false);
      return;
    }

    setMinistries(
      JSON.parse(JSON.stringify(ministriesRes.data)) as SerializedMinistry[]
    );
    setAnalytics(
      JSON.parse(JSON.stringify(analyticsRes.data)) as SerializedAnalytics
    );
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleEnsureDefaults = () => {
    startTransition(async () => {
      const res = await ensureDefaultMinistriesAction();
      if (!res.ok) {
        setError(res.error);
        return;
      }
      await load();
    });
  };

  if (loading) return <LoadingState label="Loading ministries…" />;
  if (error || !analytics)
    return (
      <ErrorState
        description={error ?? "Unable to load ministries"}
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
              <p className="text-sm font-medium text-primary">Ministry & Volunteers</p>
              <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-5xl">
                Ministries
              </h1>
              <p className="max-w-xl text-muted-foreground text-balance">
                Coordinate teams, roles, and Sunday coverage across every ministry
                area — with clarity for leaders and schedulers.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="glow"
                size="lg"
                onClick={handleEnsureDefaults}
                disabled={pending}
              >
                {pending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Wand2 className="h-4 w-4" />
                )}
                Ensure defaults
              </Button>
              <Button variant="glass" size="lg" asChild>
                <Link href="/schedule">
                  <Sparkles className="h-4 w-4" />
                  Open scheduler
                </Link>
              </Button>
              <Button variant="glass" size="lg" asChild>
                <Link href="/volunteers">
                  <Users className="h-4 w-4" />
                  Volunteer roster
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </FadeIn>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Coverage"
          value={formatPercent(analytics.coveragePercent)}
          icon={Percent}
          delay={0.05}
        />
        <KpiCard
          label="Volunteer hours"
          value={formatNumber(analytics.totalHours)}
          icon={Clock}
          delay={0.1}
        />
        <KpiCard
          label="Reliability"
          value={formatPercent(analytics.averageReliability)}
          icon={Sparkles}
          delay={0.15}
        />
        <KpiCard
          label="Active volunteers"
          value={formatNumber(analytics.activeVolunteers)}
          delta={`+${analytics.totalVolunteers - analytics.activeVolunteers} inactive`}
          icon={Users}
          delay={0.2}
        />
      </div>

      <MinistryAnalyticsCharts analytics={analytics} delay={0.1} />

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-xl font-semibold tracking-tight">
            All ministries
          </h2>
          <p className="text-sm text-muted-foreground">
            {ministries.length} teams
          </p>
        </div>

        {ministries.length === 0 ? (
          <div className="glass rounded-[1.75rem] p-10 text-center">
            <p className="text-muted-foreground">
              No ministries yet. Tap &ldquo;Ensure defaults&rdquo; to seed Worship,
              Media, Hospitality, and more.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {ministries.map((ministry, i) => (
              <motion.div
                key={ministry.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.4 }}
              >
                <Link
                  href={`/ministries/${ministry.id}`}
                  className="group block rounded-[1.75rem] glass p-5 transition-all hover-lift hover:shadow-[var(--shadow-float)] sm:p-6"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-lg font-semibold text-white shadow-[var(--shadow-soft)]"
                      style={{ backgroundColor: ministry.color }}
                    >
                      {ministry.name.charAt(0)}
                    </div>
                    <Badge variant={ministryStatusVariant(ministry.status)}>
                      {MINISTRY_STATUS_LABELS[ministry.status]}
                    </Badge>
                  </div>
                  <h3 className="mt-4 font-display text-lg font-semibold tracking-tight group-hover:text-primary">
                    {ministry.name}
                  </h3>
                  {ministry.description && (
                    <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
                      {ministry.description}
                    </p>
                  )}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Badge variant="outline">
                      {ministry.roleCount ?? 0} roles
                    </Badge>
                    <Badge variant="outline">
                      {ministry.volunteerCount ?? 0} volunteers
                    </Badge>
                  </div>
                  <p
                    className={cn(
                      "mt-4 flex items-center gap-1 text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100"
                    )}
                  >
                    View ministry
                    <ArrowRight className="h-3.5 w-3.5" />
                  </p>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
