"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
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
import { attendanceData, givingData, memberGrowth } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";

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
          {currency ? formatCurrency(entry.value) : entry.value.toLocaleString()}
        </p>
      ))}
    </div>
  );
}

export function AttendanceChart({ delay = 0 }: { delay?: number }) {
  return (
    <MotionCard delay={delay} className="h-full">
      <CardHeader>
        <CardTitle>Attendance</CardTitle>
        <CardDescription>In-person and online · last 6 weeks</CardDescription>
      </CardHeader>
      <CardContent className="h-[280px] sm:h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={attendanceData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="inPersonFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={0.4} />
                <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="onlineFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--chart-2))" stopOpacity={0.35} />
                <stop offset="100%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="4 8" vertical={false} />
            <XAxis
              dataKey="week"
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
              dataKey="inPerson"
              name="In person"
              stroke="hsl(var(--chart-1))"
              fill="url(#inPersonFill)"
              strokeWidth={2.5}
            />
            <Area
              type="monotone"
              dataKey="online"
              name="Online"
              stroke="hsl(var(--chart-2))"
              fill="url(#onlineFill)"
              strokeWidth={2.5}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </MotionCard>
  );
}

export function GivingChart({ delay = 0 }: { delay?: number }) {
  return (
    <MotionCard delay={delay} className="h-full">
      <CardHeader>
        <CardTitle>Giving trends</CardTitle>
        <CardDescription>Tithes, offerings, and missions</CardDescription>
      </CardHeader>
      <CardContent className="h-[280px] sm:h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={givingData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
              tickFormatter={(v) => `$${v / 1000}k`}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            />
            <Tooltip content={<ChartTooltip currency />} />
            <Bar dataKey="tithes" name="Tithes" fill="hsl(var(--chart-1))" radius={[10, 10, 0, 0]} />
            <Bar
              dataKey="offerings"
              name="Offerings"
              fill="hsl(var(--chart-2))"
              radius={[10, 10, 0, 0]}
            />
            <Bar
              dataKey="missions"
              name="Missions"
              fill="hsl(var(--chart-3))"
              radius={[10, 10, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </MotionCard>
  );
}

export function MemberGrowthChart({ delay = 0 }: { delay?: number }) {
  return (
    <MotionCard delay={delay} className="h-full">
      <CardHeader>
        <CardTitle>Member growth</CardTitle>
        <CardDescription>Active members and first-time visitors</CardDescription>
      </CardHeader>
      <CardContent className="h-[240px] sm:h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={memberGrowth} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
              width={40}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            />
            <Tooltip content={<ChartTooltip />} />
            <Line
              type="monotone"
              dataKey="members"
              name="Members"
              stroke="hsl(var(--chart-1))"
              strokeWidth={2.5}
              dot={{ r: 3, fill: "hsl(var(--chart-1))" }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="visitors"
              name="Visitors"
              stroke="hsl(var(--chart-3))"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </MotionCard>
  );
}
