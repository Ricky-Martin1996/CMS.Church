"use client";

import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { events } from "@/lib/data";
import { FadeIn } from "@/components/motion/page-transition";

const typeLabel = {
  worship: "Worship",
  "small-group": "Groups",
  outreach: "Outreach",
  youth: "Youth",
} as const;

export function UpcomingEvents() {
  return (
    <FadeIn delay={0.22}>
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Upcoming events</CardTitle>
          <CardDescription>Next gatherings on the calendar</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {events.map((event) => {
            const pct = Math.round((event.attendees / event.capacity) * 100);
            return (
              <div
                key={event.id}
                className="rounded-2xl border border-border/60 bg-background/40 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{event.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {format(new Date(event.date), "EEE, MMM d")} · {event.time}
                    </p>
                    <p className="text-xs text-muted-foreground">{event.location}</p>
                  </div>
                  <Badge variant="secondary">{typeLabel[event.type]}</Badge>
                </div>
                <div className="mt-3">
                  <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                    <span>
                      {event.attendees} / {event.capacity}
                    </span>
                    <span>{pct}% full</span>
                  </div>
                  <div
                    className="h-1.5 overflow-hidden rounded-full bg-muted"
                    role="progressbar"
                    aria-valuenow={pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${event.title} capacity`}
                  >
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </FadeIn>
  );
}
