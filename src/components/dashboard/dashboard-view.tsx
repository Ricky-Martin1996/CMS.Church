"use client";

import {
  CalendarDays,
  HeartHandshake,
  TrendingUp,
  Users,
} from "lucide-react";
import { KpiCard } from "@/components/dashboard/stat-card";
import {
  AttendanceChart,
  MemberGrowthChart,
} from "@/components/dashboard/charts";
import {
  ActivityFeed,
  AiInsights,
  BirthdayWidget,
  EventsTimeline,
  PrayerWidget,
  QuickActions,
} from "@/components/dashboard/widgets";
import { FadeIn } from "@/components/motion/page-transition";
import { formatCurrency, formatNumber } from "@/lib/utils";

export function DashboardView() {
  return (
    <div className="space-y-6 lg:space-y-7">
      <FadeIn>
        <div className="relative overflow-hidden rounded-[2rem] glass-strong p-6 sm:p-8">
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-chart-2/20 blur-3xl" />
          <div className="relative max-w-2xl space-y-2">
            <p className="text-sm font-medium text-primary">Grace Community</p>
            <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-5xl">
              Good morning, Pastor
            </h1>
            <p className="max-w-xl text-muted-foreground text-balance">
              Your church is healthy this week — calm clarity across people,
              gatherings, and generosity.
            </p>
          </div>
        </div>
      </FadeIn>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Active members"
          value={formatNumber(2847)}
          delta="+48"
          icon={Users}
          delay={0.05}
          spark={[40, 48, 46, 55, 62, 70]}
        />
        <KpiCard
          label="Avg. Sunday attendance"
          value={formatNumber(1098)}
          delta="+6.2%"
          icon={TrendingUp}
          delay={0.1}
          spark={[52, 58, 54, 66, 63, 72]}
        />
        <KpiCard
          label="Monthly giving"
          value={formatCurrency(69400)}
          delta="+8.4%"
          icon={HeartHandshake}
          delay={0.15}
          spark={[35, 42, 40, 55, 58, 68]}
        />
        <KpiCard
          label="Events this week"
          value="12"
          delta="+2"
          icon={CalendarDays}
          delay={0.2}
          spark={[20, 28, 24, 36, 40, 48]}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-5">
        <div className="xl:col-span-3">
          <AttendanceChart delay={0.12} />
        </div>
        <div className="xl:col-span-2">
          <MemberGrowthChart delay={0.16} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <AiInsights delay={0.14} />
        <QuickActions delay={0.18} />
        <BirthdayWidget delay={0.2} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <EventsTimeline delay={0.16} />
        </div>
        <div className="lg:col-span-1">
          <PrayerWidget delay={0.2} />
        </div>
        <div className="lg:col-span-1">
          <ActivityFeed delay={0.24} />
        </div>
      </div>
    </div>
  );
}
