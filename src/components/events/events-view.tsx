"use client";

import { format } from "date-fns";
import { CalendarDays, MapPin, Plus, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FadeIn, StaggerChildren, staggerItem } from "@/components/motion/page-transition";
import { events } from "@/lib/data";
import { motion } from "framer-motion";

const typeLabel = {
  worship: "Worship",
  "small-group": "Groups",
  outreach: "Outreach",
  youth: "Youth",
} as const;

export function EventsView() {
  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <h1 className="font-display text-3xl font-semibold tracking-tight">
              Events
            </h1>
            <p className="text-muted-foreground">
              Plan gatherings with clarity — capacity, location, and flow.
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4" />
            Create event
          </Button>
        </div>
      </FadeIn>

      <StaggerChildren className="grid gap-4 md:grid-cols-2">
        {events.map((event) => {
          const pct = Math.round((event.attendees / event.capacity) * 100);
          return (
            <motion.div key={event.id} variants={staggerItem}>
              <Card className="h-full transition-shadow hover:shadow-[var(--shadow-float)]">
                <CardContent className="flex h-full flex-col gap-4 p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-display text-xl font-semibold tracking-tight">
                        {event.title}
                      </h2>
                      <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                        <CalendarDays className="h-4 w-4" aria-hidden />
                        {format(new Date(event.date), "EEEE, MMM d")} · {event.time}
                      </p>
                      <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" aria-hidden />
                        {event.location}
                      </p>
                    </div>
                    <Badge>{typeLabel[event.type]}</Badge>
                  </div>

                  <div className="mt-auto space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Users className="h-4 w-4" aria-hidden />
                        {event.attendees} registered
                      </span>
                      <span className="font-medium">{pct}%</span>
                    </div>
                    <div
                      className="h-2 overflow-hidden rounded-full bg-muted"
                      role="progressbar"
                      aria-valuenow={pct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </StaggerChildren>
    </div>
  );
}
