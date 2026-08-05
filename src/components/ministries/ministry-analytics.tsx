"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { MotionCard } from "@/components/ui/motion-card";
import {
  CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import type { MinistryAnalytics } from "@/domain/entities/ministry";
import { formatNumber } from "@/lib/utils";
import { formatPercent } from "@/components/ministries/utils";

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color?: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-strong rounded-2xl px-3 py-2 text-xs shadow-[var(--shadow-soft)]">
      <p className="mb-1 font-medium">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="text-muted-foreground">
          {entry.name}: {formatNumber(entry.value)}
        </p>
      ))}
    </div>
  );
}

type SerializedAnalytics = Omit<
  MinistryAnalytics,
  "recentActivity"
> & {
  recentActivity: Array<
    Omit<MinistryAnalytics["recentActivity"][number], "occurredAt" | "createdAt"> & {
      occurredAt: string;
      createdAt: string;
    }
  >;
};

export function MinistryAnalyticsCharts({
  analytics,
  delay = 0,
}: {
  analytics: SerializedAnalytics;
  delay?: number;
}) {
  const coverageData = analytics.coverageByMinistry.map((c) => ({
    name: c.ministryName,
    filled: c.filled,
    needed: c.needed,
    coverage: c.coveragePercent,
  }));

  const growthData = analytics.ministryGrowth.map((g) => ({
    name: g.ministryName,
    current: g.volunteerCount,
    previous: g.previousCount,
    growth: g.growthPercent,
  }));

  const chartColors = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <MotionCard delay={delay} className="h-full">
        <CardHeader>
          <CardTitle>Coverage by ministry</CardTitle>
          <CardDescription>
            Filled vs needed slots · {formatPercent(analytics.coveragePercent)} overall
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[280px] sm:h-[320px]">
          {coverageData.length === 0 ? (
            <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
              No coverage data yet
            </p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={coverageData}
                layout="vertical"
                margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  stroke="hsl(var(--border))"
                  strokeDasharray="4 8"
                  horizontal={false}
                />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={88}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="filled" name="Filled" stackId="a" fill="hsl(var(--chart-1))" radius={[0, 0, 0, 0]} />
                <Bar
                  dataKey="needed"
                  name="Needed"
                  stackId="a"
                  fill="hsl(var(--muted))"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </MotionCard>

      <MotionCard delay={delay + 0.05} className="h-full">
        <CardHeader>
          <CardTitle>Volunteer growth</CardTitle>
          <CardDescription>Current vs previous month by ministry</CardDescription>
        </CardHeader>
        <CardContent className="h-[280px] sm:h-[320px]">
          {growthData.length === 0 ? (
            <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
              No growth data yet
            </p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={growthData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="4 8" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="current" name="Current" radius={[6, 6, 0, 0]}>
                  {growthData.map((_, i) => (
                    <Cell key={i} fill={chartColors[i % chartColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </MotionCard>
    </div>
  );
}
