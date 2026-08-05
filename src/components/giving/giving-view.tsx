"use client";

import { HeartHandshake, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GivingChart } from "@/components/dashboard/charts";
import { StatCard } from "@/components/dashboard/stat-card";
import { FadeIn } from "@/components/motion/page-transition";
import { formatCurrency } from "@/lib/utils";

const recentGifts = [
  { name: "Chen Family", amount: 250, fund: "General Tithe", when: "Today" },
  { name: "Anonymous", amount: 1000, fund: "Building Fund", when: "Yesterday" },
  { name: "Williams Family", amount: 180, fund: "Missions", when: "2 days ago" },
  { name: "Online gift", amount: 75, fund: "Offerings", when: "3 days ago" },
];

export function GivingView() {
  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="space-y-1">
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            Giving
          </h1>
          <p className="text-muted-foreground">
            Stewardship at a glance — calm, clear, and trustworthy.
          </p>
        </div>
      </FadeIn>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="This month"
          value={formatCurrency(69400)}
          delta="+8.4%"
          icon={HeartHandshake}
          delay={0.05}
        />
        <StatCard
          label="YTD giving"
          value={formatCurrency(428600)}
          delta="+11.2%"
          icon={TrendingUp}
          delay={0.1}
        />
        <StatCard
          label="Active givers"
          value="612"
          delta="+24"
          icon={HeartHandshake}
          delay={0.15}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <FadeIn delay={0.12} className="lg:col-span-3">
          <GivingChart />
        </FadeIn>
        <FadeIn delay={0.16} className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Recent gifts</CardTitle>
              <CardDescription>Latest contributions received</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentGifts.map((gift) => (
                <div
                  key={`${gift.name}-${gift.when}`}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-background/40 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{gift.name}</p>
                    <p className="text-xs text-muted-foreground">{gift.when}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(gift.amount)}</p>
                    <Badge variant="secondary" className="mt-1">
                      {gift.fund}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </FadeIn>
      </div>
    </div>
  );
}
