"use client";

import { format } from "date-fns";
import { motion } from "framer-motion";
import { CalendarDays, MapPin, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FadeIn, StaggerChildren, staggerItem } from "@/components/motion/page-transition";
import { events } from "@/lib/data";
import { cn } from "@/lib/utils";

const typeLabel = {
  worship: "Worship",
  "small-group": "Groups",
  outreach: "Outreach",
  youth: "Youth",
} as const;

export function EventsView() {
  const [hero, ...rest] = events;
  const heroPct = Math.round((hero.attendees / hero.capacity) * 100);

  return (
    <div className="page-pad">
      <FadeIn>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-primary">Gatherings</p>
            <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Events
            </h1>
            <p className="max-w-lg text-[15px] leading-relaxed text-muted-foreground">
              Plan with clarity — capacity, place, and presence in one calm view.
            </p>
          </div>
          <Button variant="glow">
            <Plus className="h-4 w-4" />
            Create event
          </Button>
        </div>
      </FadeIn>

      <FadeIn delay={0.08}>
        <article className="relative overflow-hidden rounded-[2rem] glass-strong p-6 sm:p-8 hover-lift">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-chart-2/10" />
          <div className="relative grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-end">
            <div className="space-y-4">
              <Badge>{typeLabel[hero.type]}</Badge>
              <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                {hero.title}
              </h2>
              <div className="flex flex-col gap-2 text-muted-foreground sm:flex-row sm:gap-6">
                <p className="flex items-center gap-2 text-sm">
                  <CalendarDays className="h-4 w-4 text-primary" aria-hidden />
                  {format(new Date(hero.date), "EEEE, MMMM d")} · {hero.time}
                </p>
                <p className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-primary" aria-hidden />
                  {hero.location}
                </p>
              </div>
            </div>
            <div className="rounded-[1.5rem] border border-border/50 bg-background/40 p-5">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Users className="h-4 w-4" aria-hidden />
                  {hero.attendees} registered
                </span>
                <span className="font-display text-2xl font-semibold">{heroPct}%</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                <motion.div
                  className="h-full rounded-full bg-primary shadow-[0_0_12px_hsl(var(--primary)/0.5)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${heroPct}%` }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {hero.capacity - hero.attendees} seats remaining
              </p>
            </div>
          </div>
        </article>
      </FadeIn>

      <StaggerChildren className="grid gap-4 md:grid-cols-3">
        {rest.map((event, index) => {
          const pct = Math.round((event.attendees / event.capacity) * 100);
          return (
            <motion.article
              key={event.id}
              variants={staggerItem}
              className={cn(
                "glass flex flex-col gap-5 rounded-[1.75rem] p-6 hover-lift",
                index === 0 && "md:col-span-1"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-display text-xl font-semibold tracking-tight">
                  {event.title}
                </h3>
                <Badge variant="secondary">{typeLabel[event.type]}</Badge>
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" aria-hidden />
                  {format(new Date(event.date), "EEE, MMM d")} · {event.time}
                </p>
                <p className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" aria-hidden />
                  {event.location}
                </p>
              </div>
              <div className="mt-auto space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    {event.attendees} / {event.capacity}
                  </span>
                  <span>{pct}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </motion.article>
          );
        })}
      </StaggerChildren>
    </div>
  );
}
