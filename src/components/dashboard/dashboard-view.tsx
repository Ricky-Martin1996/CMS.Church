"use client";

import {
  CalendarDays,
  HeartHandshake,
  TrendingUp,
  Users,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { AttendanceChart, GivingChart } from "@/components/dashboard/charts";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { UpcomingEvents } from "@/components/dashboard/upcoming-events";
import { FadeIn } from "@/components/motion/page-transition";
import { formatCurrency, formatNumber } from "@/lib/utils";

export function DashboardView() {
  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="space-y-1">
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Good morning, Pastor
          </h1>
          <p className="text-muted-foreground">
            Grace Community is healthy this week — here’s your calm overview.
          </p>
        </div>
      </FadeIn>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Active members"
          value={formatNumber(2847)}
          delta="+48"
          icon={Users}
          delay={0.05}
        />
        <StatCard
          label="Avg. Sunday attendance"
          value={formatNumber(1098)}
          delta="+6.2%"
          icon={TrendingUp}
          delay={0.1}
        />
        <StatCard
          label="Monthly giving"
          value={formatCurrency(69400)}
          delta="+8.4%"
          icon={HeartHandshake}
          delay={0.15}
        />
        <StatCard
          label="Events this week"
          value="12"
          delta="+2"
          icon={CalendarDays}
          delay={0.2}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <FadeIn delay={0.12}>
          <AttendanceChart />
        </FadeIn>
        <FadeIn delay={0.16}>
          <GivingChart />
        </FadeIn>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ActivityFeed />
        <UpcomingEvents />
      </div>
    </div>
  );
}
