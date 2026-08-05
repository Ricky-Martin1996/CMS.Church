"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  MotionCard,
} from "@/components/ui/card";
import type {
  AttendanceAnalytics,
  AttendanceDashboardSessionSummary,
} from "@/domain/entities/attendance";
import { ATTENDANCE_SESSION_TYPE_LABELS } from "@/domain/enums/member";
import { formatNumber } from "@/lib/utils";
import { formatSessionDate } from "@/components/attendance/utils";

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-strong rounded-2xl px-3 py-2 text-xs shadow-[var(--shadow-soft)]">
      <p className="mb-1 font-medium">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="text-muted-foreground">
          <span style={{ color: entry.color }}>{entry.name}</span>:{" "}
          {formatNumber(entry.value)}
        </p>
      ))}
    </div>
  );
}

export function WeeklyTrendChart({
  data,
  delay = 0,
}: {
  data: AttendanceAnalytics["weeklyTrend"];
  delay?: number;
}) {
  return (
    <MotionCard delay={delay} className="h-full">
      <CardHeader>
        <CardTitle>Weekly trend</CardTitle>
        <CardDescription>Present count and visitors</CardDescription>
      </CardHeader>
      <CardContent className="h-[260px] sm:h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="presentFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={0.4} />
                <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="visitorFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--chart-2))" stopOpacity={0.35} />
                <stop offset="100%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="4 8" vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={36}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            />
            <Tooltip content={<ChartTooltip />} />
            <Area
              type="monotone"
              dataKey="presentCount"
              name="Present"
              stroke="hsl(var(--chart-1))"
              fill="url(#presentFill)"
              strokeWidth={2.5}
            />
            <Area
              type="monotone"
              dataKey="visitorCount"
              name="Visitors"
              stroke="hsl(var(--chart-2))"
              fill="url(#visitorFill)"
              strokeWidth={2.5}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </MotionCard>
  );
}

export function SessionComparisonChart({
  sessions,
  delay = 0,
}: {
  sessions: AttendanceDashboardSessionSummary[];
  delay?: number;
}) {
  const data = sessions.map((s) => ({
    label: formatSessionDate(s.date),
    present: s.presentCount,
    visitors: s.visitorCount,
    service: s.serviceName,
  }));

  return (
    <MotionCard delay={delay} className="h-full">
      <CardHeader>
        <CardTitle>Recent sessions</CardTitle>
        <CardDescription>Attendance by service date</CardDescription>
      </CardHeader>
      <CardContent className="h-[260px] sm:h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="4 8" vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={36}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            />
            <Tooltip content={<ChartTooltip />} />
            <Bar
              dataKey="present"
              name="Present"
              fill="hsl(var(--chart-1))"
              radius={[8, 8, 0, 0]}
            />
            <Bar
              dataKey="visitors"
              name="Visitors"
              fill="hsl(var(--chart-2))"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </MotionCard>
  );
}

export function MinistryComparisonCards({
  data,
  delay = 0,
}: {
  data: AttendanceAnalytics["bySessionType"];
  delay?: number;
}) {
  if (!data.length) return null;

  const maxPresent = Math.max(...data.map((d) => d.presentCount), 1);

  return (
    <MotionCard delay={delay}>
      <CardHeader>
        <CardTitle>By ministry & type</CardTitle>
        <CardDescription>Session breakdown across categories</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          {data.map((item) => (
            <div
              key={item.type}
              className="rounded-2xl bg-muted/40 p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">
                  {ATTENDANCE_SESSION_TYPE_LABELS[item.type]}
                </p>
                <span className="text-xs text-muted-foreground">
                  {item.sessionCount} sessions
                </span>
              </div>
              <p className="mt-2 font-display text-2xl font-semibold">
                {formatNumber(item.presentCount)}
              </p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{
                    width: `${(item.presentCount / maxPresent) * 100}%`,
                  }}
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatNumber(item.visitorCount)} visitors
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </MotionCard>
  );
}
