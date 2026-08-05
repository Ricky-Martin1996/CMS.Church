"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Info,
  ListTodo,
  Sparkles,
} from "lucide-react";
import type {
  AiAssistantPanel,
  ChurchHealthScore,
  ExecutiveCharts,
  ExecutiveKpi,
  OperationalInsight,
  TaskCenterItem,
} from "@/domain/entities/intelligence";
import {
  InsightSeverity,
  INSIGHT_SEVERITY_LABELS,
} from "@/domain/enums/intelligence";
import { ROLE_LABELS } from "@/domain/enums/role";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MotionCard } from "@/components/ui/motion-card";
import {
  CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
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

export function HealthScoreRing({ health }: { health: ChurchHealthScore }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (health.score / 100) * circumference;

  return (
    <div className="glass-strong flex flex-col gap-5 rounded-[1.75rem] p-5 sm:flex-row sm:items-center sm:p-6">
      <div className="relative mx-auto h-36 w-36 shrink-0 sm:mx-0">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 140 140">
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="10"
          />
          <motion.circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-3xl font-semibold">{health.score}</span>
          <span className="text-[11px] text-muted-foreground">Health</span>
        </div>
      </div>
      <div className="min-w-0 flex-1 space-y-3">
        <div>
          <p className="text-sm font-medium text-primary">Church Health Score</p>
          <h2 className="font-display text-2xl font-semibold">{health.grade}</h2>
          <p className="text-sm text-muted-foreground">
            Modular factors — weights can be customized per church later.
          </p>
        </div>
        <ul className="grid gap-2 sm:grid-cols-2">
          {health.factors.slice(0, 6).map((f) => (
            <li key={f.key} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>{f.label}</span>
                <span className="text-muted-foreground">{f.score}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <motion.div
                  className="h-full rounded-full bg-primary/80"
                  initial={{ width: 0 }}
                  animate={{ width: `${f.score}%` }}
                  transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function severityIcon(severity: InsightSeverity) {
  switch (severity) {
    case InsightSeverity.CRITICAL:
    case InsightSeverity.WARNING:
      return AlertTriangle;
    case InsightSeverity.SUCCESS:
      return CheckCircle2;
    default:
      return Info;
  }
}

export function InsightList({ insights }: { insights: OperationalInsight[] }) {
  return (
    <MotionCard delay={0.08} className="h-full">
      <CardHeader>
        <CardTitle>Operational insights</CardTitle>
        <CardDescription>
          Rule-based intelligence · LLM-ready interface
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.map((insight, i) => {
          const Icon = severityIcon(insight.severity);
          return (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="rounded-2xl border border-border/50 bg-background/35 p-3"
            >
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <Icon className="h-4 w-4 text-primary" />
                <Badge variant="outline">
                  {INSIGHT_SEVERITY_LABELS[insight.severity]}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {insight.category}
                </span>
              </div>
              <p className="text-sm font-medium">{insight.title}</p>
              <p className="text-xs text-muted-foreground">{insight.summary}</p>
              {insight.href && (
                <Link
                  href={insight.href}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  {insight.suggestedAction}
                  <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </motion.div>
          );
        })}
        {insights.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No insights yet — as modules gather data, recommendations appear here.
          </p>
        )}
      </CardContent>
    </MotionCard>
  );
}

export function AiAssistantPanelView({ panel }: { panel: AiAssistantPanel }) {
  return (
    <MotionCard delay={0.1} className="h-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <CardTitle>AI Assistant</CardTitle>
        </div>
        <CardDescription>
          Suggested actions from the insight engine (no external LLM yet)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="rounded-2xl border border-border/40 bg-background/40 p-3 text-sm leading-relaxed">
          {panel.weeklySummary}
        </p>
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Suggested actions
          </p>
          <ul className="space-y-2">
            {panel.suggestedActions.map((action) => (
              <li key={action.id}>
                {action.href ? (
                  <Link
                    href={action.href}
                    className="block rounded-xl border border-border/40 px-3 py-2 text-sm hover:bg-accent/40"
                  >
                    <span className="font-medium">{action.title}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {action.reason}
                    </span>
                  </Link>
                ) : (
                  <div className="rounded-xl border border-border/40 px-3 py-2 text-sm">
                    <span className="font-medium">{action.title}</span>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
        {panel.visitorRecommendations.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Visitor conversion
            </p>
            <ul className="list-inside list-disc text-sm text-muted-foreground">
              {panel.visitorRecommendations.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
        )}
        {panel.ministryHighlights.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Ministry highlights
            </p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {panel.ministryHighlights.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </MotionCard>
  );
}

export function TaskCenter({ tasks }: { tasks: TaskCenterItem[] }) {
  return (
    <MotionCard delay={0.12} className="h-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <ListTodo className="h-4 w-4 text-primary" />
          <CardTitle>Task center</CardTitle>
        </div>
        <CardDescription>
          Follow-ups, gaps, birthdays, prayer, events
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {tasks.map((task) => (
          <div
            key={task.id}
            className={cn(
              "flex items-start justify-between gap-3 rounded-2xl border border-border/40 px-3 py-2.5",
              task.priority === "high" && "border-amber-500/30 bg-amber-500/5"
            )}
          >
            <div>
              <p className="text-sm font-medium">{task.title}</p>
              <p className="text-xs text-muted-foreground">{task.description}</p>
            </div>
            {task.href && (
              <Button size="sm" variant="ghost" asChild>
                <Link href={task.href}>Open</Link>
              </Button>
            )}
          </div>
        ))}
        {tasks.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No outstanding leadership tasks in your scope.
          </p>
        )}
      </CardContent>
    </MotionCard>
  );
}

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
          {entry.value.toLocaleString()}
        </p>
      ))}
    </div>
  );
}

export function ExecutiveChartsPanel({
  charts,
  roleLabel,
}: {
  charts: ExecutiveCharts;
  roleLabel: string;
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <MotionCard delay={0.06}>
        <CardHeader>
          <CardTitle>Attendance</CardTitle>
          <CardDescription>Presence pulse for {roleLabel}</CardDescription>
        </CardHeader>
        <CardContent className="h-[260px]">
          {charts.attendance.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.attendance}>
                <defs>
                  <linearGradient id="execAtt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="4 8" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="primary"
                  name="Present"
                  stroke="hsl(var(--chart-1))"
                  fill="url(#execAtt)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </MotionCard>

      <MotionCard delay={0.08}>
        <CardHeader>
          <CardTitle>Growth & engagement</CardTitle>
          <CardDescription>Members, visitors, households, volunteers</CardDescription>
        </CardHeader>
        <CardContent className="h-[260px]">
          {(charts.growth.length > 0 || charts.visitors.length > 0 || charts.volunteerReliability.length > 0) ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={
                  charts.visitors.length
                    ? charts.visitors
                    : charts.growth.length
                      ? charts.growth
                      : charts.volunteerReliability
                }
              >
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="4 8" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="primary" name="Value" fill="hsl(var(--chart-2))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </CardContent>
      </MotionCard>

      <MotionCard delay={0.1}>
        <CardHeader>
          <CardTitle>Events & communications</CardTitle>
          <CardDescription>Participation and delivery</CardDescription>
        </CardHeader>
        <CardContent className="h-[240px]">
          {(charts.eventParticipation.length > 0 || charts.communicationDelivery.length > 0) ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={
                  charts.communicationDelivery.length
                    ? charts.communicationDelivery
                    : charts.eventParticipation
                }
              >
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="4 8" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="primary" name="Count" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </CardContent>
      </MotionCard>

      <MotionCard delay={0.12}>
        <CardHeader>
          <CardTitle>Household engagement</CardTitle>
          <CardDescription>Top pastoral engagement scores</CardDescription>
        </CardHeader>
        <CardContent className="h-[240px]">
          {charts.householdEngagement.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.householdEngagement} layout="vertical">
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="4 8" horizontal={false} />
                <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={72}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="primary" name="Engagement" fill="hsl(var(--chart-3))" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </MotionCard>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
      No chart data in your permission scope yet
    </div>
  );
}

export function RoleKpiStrip({ kpis }: { kpis: ExecutiveKpi[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {kpis.map((kpi, index) => (
        <Link
          key={kpi.id}
          href={kpi.href ?? "/dashboard"}
          className="block"
        >
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * index, duration: 0.45 }}
            className="glass group relative overflow-hidden rounded-[1.75rem] p-5 hover-lift"
          >
            <p className="text-sm text-muted-foreground">{kpi.label}</p>
            <p className="mt-2 font-display text-3xl font-semibold tracking-tight">
              {kpi.value}
            </p>
            {kpi.delta && (
              <p className="mt-1 text-xs text-primary">{kpi.delta}</p>
            )}
          </motion.div>
        </Link>
      ))}
    </div>
  );
}

export { ROLE_LABELS };
