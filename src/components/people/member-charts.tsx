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
import { formatCurrency } from "@/lib/utils";
import type { MemberAnalytics } from "@/domain/entities/member";

function ChartTooltip({
  active,
  payload,
  label,
  currency,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
  currency?: boolean;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-strong rounded-2xl px-3 py-2 text-xs shadow-[var(--shadow-soft)]">
      <p className="mb-1 font-medium">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="text-muted-foreground">
          <span style={{ color: entry.color }}>{entry.name}</span>:{" "}
          {currency
            ? formatCurrency(entry.value / 100)
            : entry.value.toLocaleString()}
        </p>
      ))}
    </div>
  );
}

export function AttendanceTrendChart({
  data,
  className,
}: {
  data: MemberAnalytics["attendanceTrend"];
  className?: string;
}) {
  if (!data.length) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No attendance data yet
      </p>
    );
  }

  return (
    <div className={className ?? "h-[240px]"}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="memberAttendanceFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={0.4} />
              <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="4 8" vertical={false} />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={32}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
          />
          <Tooltip content={<ChartTooltip />} />
          <Area
            type="monotone"
            dataKey="count"
            name="Attendance"
            stroke="hsl(var(--chart-1))"
            fill="url(#memberAttendanceFill)"
            strokeWidth={2.5}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function GivingTrendChart({
  data,
  className,
}: {
  data: MemberAnalytics["givingTrend"];
  className?: string;
}) {
  const hasGiving = data.some((d) => d.amountCents > 0);
  if (!hasGiving) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No giving records in this period
      </p>
    );
  }

  return (
    <div className={className ?? "h-[240px]"}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="4 8" vertical={false} />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={48}
            tickFormatter={(v) => `$${Math.round(v / 100)}`}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
          />
          <Tooltip content={<ChartTooltip currency />} />
          <Bar
            dataKey="amountCents"
            name="Giving"
            fill="hsl(var(--chart-2))"
            radius={[10, 10, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ScoreBar({
  label,
  value,
  variant = "default",
}: {
  label: string;
  value: number;
  variant?: "default" | "risk";
}) {
  const indicatorClass =
    variant === "risk"
      ? value > 60
        ? "bg-destructive"
        : value > 30
          ? "bg-warning"
          : "bg-success"
      : undefined;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">{value}</span>
      </div>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all duration-500 ${indicatorClass ?? "bg-primary"}`}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
}
