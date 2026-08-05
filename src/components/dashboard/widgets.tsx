"use client";

import Link from "next/link";
import {
  CalendarDays,
  CalendarPlus,
  ClipboardCheck,
  HandCoins,
  HeartHandshake,
  Home,
  MessageSquare,
  Sparkles,
  UserPlus,
  UserRoundPlus,
  UsersRound,
  Cake,
  HandHeart,
} from "lucide-react";
import { format } from "date-fns";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  MotionCard,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  activities,
  birthdays,
  events,
  insights,
  prayerRequests,
  quickActions,
  type ActivityItem,
} from "@/lib/data";
import { cn } from "@/lib/utils";

const activityIcons = {
  person: UserPlus,
  giving: HeartHandshake,
  event: CalendarDays,
  message: MessageSquare,
};

const quickIcons = {
  UserPlus,
  UserRoundPlus,
  Home,
  ClipboardCheck,
  CalendarPlus,
  HandCoins,
  UsersRound,
};

export function ActivityFeed({ delay = 0 }: { delay?: number }) {
  return (
    <MotionCard delay={delay} className="h-full">
      <CardHeader>
        <CardTitle>Recent activity</CardTitle>
        <CardDescription>Live pulse across campuses</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-1" aria-label="Recent activity">
          {activities.map((item: ActivityItem) => {
            const Icon = activityIcons[item.type];
            return (
              <li
                key={item.id}
                className="flex gap-3 rounded-2xl px-2 py-2.5 transition-colors hover:bg-accent/45"
              >
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                  <Icon className="h-4 w-4" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </div>
                <time className="shrink-0 text-xs text-muted-foreground">
                  {item.time}
                </time>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </MotionCard>
  );
}

export function EventsTimeline({ delay = 0 }: { delay?: number }) {
  return (
    <MotionCard delay={delay} className="h-full">
      <CardHeader>
        <CardTitle>Upcoming timeline</CardTitle>
        <CardDescription>Next gatherings on the calendar</CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="relative space-y-0 border-l border-border/70 ml-3">
          {events.map((event, i) => {
            const pct = Math.round((event.attendees / event.capacity) * 100);
            return (
              <li key={event.id} className="relative pb-6 pl-6 last:pb-0">
                <span
                  className={cn(
                    "absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-background",
                    i === 0 ? "bg-primary shadow-[0_0_10px_hsl(var(--primary))]" : "bg-muted-foreground/50"
                  )}
                />
                <div className="rounded-2xl border border-border/50 bg-background/35 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{event.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {format(new Date(event.date), "EEE, MMM d")} · {event.time}
                      </p>
                      <p className="text-xs text-muted-foreground">{event.location}</p>
                    </div>
                    <Badge variant="secondary">{pct}%</Badge>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </CardContent>
    </MotionCard>
  );
}

export function BirthdayWidget({ delay = 0 }: { delay?: number }) {
  return (
    <MotionCard delay={delay} className="h-full">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Birthdays</CardTitle>
          <CardDescription>Celebrate this week</CardDescription>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-chart-3/15 text-chart-3">
          <Cake className="h-4 w-4" aria-hidden />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {birthdays.map((b) => (
          <div
            key={b.id}
            className="flex items-center gap-3 rounded-2xl border border-border/50 bg-background/35 px-3 py-2.5"
          >
            <Avatar className="h-9 w-9">
              <AvatarFallback className="text-xs">
                {b.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{b.name}</p>
              <p className="text-xs text-muted-foreground">Turning {b.age}</p>
            </div>
            <span className="text-xs font-medium text-primary">{b.date}</span>
          </div>
        ))}
      </CardContent>
    </MotionCard>
  );
}

export function PrayerWidget({ delay = 0 }: { delay?: number }) {
  const statusVariant = {
    open: "outline",
    praying: "default",
    answered: "success",
  } as const;

  return (
    <MotionCard delay={delay} className="h-full">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Prayer requests</CardTitle>
          <CardDescription>Care for your community</CardDescription>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/12 text-primary">
          <HandHeart className="h-4 w-4" aria-hidden />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {prayerRequests.map((p) => (
          <div
            key={p.id}
            className="rounded-2xl border border-border/50 bg-background/35 p-3.5"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">{p.from}</p>
              <Badge variant={statusVariant[p.status]}>{p.status}</Badge>
            </div>
            <p className="mt-1.5 text-sm text-muted-foreground">{p.request}</p>
            <p className="mt-2 text-[11px] text-muted-foreground">{p.time}</p>
          </div>
        ))}
      </CardContent>
    </MotionCard>
  );
}

export function AiInsights({ delay = 0 }: { delay?: number }) {
  const toneStyles = {
    positive: "border-success/25 bg-success/8",
    attention: "border-warning/30 bg-warning/10",
    neutral: "border-border/60 bg-background/40",
  };

  return (
    <MotionCard delay={delay} className="h-full overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-chart-2/10" />
      <CardHeader className="relative flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" aria-hidden />
            AI Insights
          </CardTitle>
          <CardDescription>Quiet guidance for this week</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="relative space-y-3">
        {insights.map((insight) => (
          <div
            key={insight.id}
            className={cn(
              "rounded-2xl border p-3.5",
              toneStyles[insight.tone]
            )}
          >
            <p className="text-sm font-medium">{insight.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{insight.body}</p>
          </div>
        ))}
      </CardContent>
    </MotionCard>
  );
}

export function QuickActions({ delay = 0 }: { delay?: number }) {
  return (
    <MotionCard delay={delay} className="h-full">
      <CardHeader>
        <CardTitle>Quick actions</CardTitle>
        <CardDescription>Jump into the work that matters</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3">
        {quickActions.map((action) => {
          const Icon = quickIcons[action.icon];
          return (
            <Button
              key={action.id}
              asChild
              variant="glass"
              className="h-auto flex-col items-start gap-3 rounded-2xl p-4 text-left hover:shadow-[var(--shadow-glow)]"
            >
              <Link href={action.href}>
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/12 text-primary">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="text-sm font-medium text-foreground">
                  {action.label}
                </span>
              </Link>
            </Button>
          );
        })}
      </CardContent>
    </MotionCard>
  );
}
