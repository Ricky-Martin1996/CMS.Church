"use client";

import { HeartHandshake, TrendingUp, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { GivingChart } from "@/components/dashboard/charts";
import { KpiCard } from "@/components/dashboard/stat-card";
import { FadeIn } from "@/components/motion/page-transition";
import { MotionCard, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

const recentGifts = [
  { name: "Chen Family", amount: 250, fund: "General Tithe", when: "Today" },
  { name: "Anonymous", amount: 1000, fund: "Building Fund", when: "Yesterday" },
  { name: "Williams Family", amount: 180, fund: "Missions", when: "2 days ago" },
  { name: "Online gift", amount: 75, fund: "Offerings", when: "3 days ago" },
];

const funds = [
  { name: "Tithes", value: 74, color: "bg-primary" },
  { name: "Offerings", value: 16, color: "bg-chart-2" },
  { name: "Missions", value: 10, color: "bg-chart-3" },
];

export function GivingView() {
  return (
    <div className="page-pad">
      <FadeIn>
        <div className="relative overflow-hidden rounded-[1.5rem] glass-strong p-6 sm:rounded-[2rem] sm:p-8">
          <div className="pointer-events-none absolute -left-16 top-0 h-48 w-48 rounded-full bg-primary/18 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 right-0 h-40 w-40 rounded-full bg-chart-3/18 blur-3xl" />
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-primary">Stewardship</p>
              <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                Giving
              </h1>
              <p className="max-w-lg text-[15px] leading-relaxed text-muted-foreground">
                Generosity at a glance — calm, clear, and trustworthy.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-2xl border border-primary/20 bg-primary/10 px-4 py-2 text-sm text-primary">
              <Sparkles className="h-4 w-4" />
              Recurring gifts cover 61% of operations
            </div>
          </div>
        </div>
      </FadeIn>

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard
          label="This month"
          value={formatCurrency(69400)}
          delta="+8.4%"
          icon={HeartHandshake}
          delay={0.05}
          spark={[30, 40, 38, 52, 58, 70]}
        />
        <KpiCard
          label="YTD giving"
          value={formatCurrency(428600)}
          delta="+11.2%"
          icon={TrendingUp}
          delay={0.1}
          spark={[20, 28, 35, 44, 52, 64]}
        />
        <KpiCard
          label="Active givers"
          value="612"
          delta="+24"
          icon={HeartHandshake}
          delay={0.15}
          spark={[40, 42, 48, 50, 58, 62]}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <GivingChart delay={0.12} />
        </div>
        <MotionCard delay={0.16} className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Fund mix</CardTitle>
            <CardDescription>Where generosity is flowing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {funds.map((fund) => (
              <div key={fund.name} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{fund.name}</span>
                  <span className="text-muted-foreground">{fund.value}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${fund.color}`}
                    style={{ width: `${fund.value}%` }}
                  />
                </div>
              </div>
            ))}
            <div className="rounded-2xl border border-border/50 bg-background/35 p-4">
              <p className="text-xs text-muted-foreground">Largest gift this week</p>
              <p className="mt-1 font-display text-2xl font-semibold">
                {formatCurrency(1000)}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">Building Fund</p>
            </div>
          </CardContent>
        </MotionCard>
      </div>

      <MotionCard delay={0.2}>
        <CardHeader>
          <CardTitle>Recent gifts</CardTitle>
          <CardDescription>Latest contributions received</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {recentGifts.map((gift) => (
              <div
                key={`${gift.name}-${gift.when}`}
                className="rounded-2xl border border-border/50 bg-background/35 p-4 transition-shadow hover:shadow-[var(--shadow-glow)]"
              >
                <p className="truncate font-medium">{gift.name}</p>
                <p className="mt-2 font-display text-xl font-semibold">
                  {formatCurrency(gift.amount)}
                </p>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <Badge variant="secondary">{gift.fund}</Badge>
                  <span className="text-xs text-muted-foreground">{gift.when}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </MotionCard>
    </div>
  );
}
