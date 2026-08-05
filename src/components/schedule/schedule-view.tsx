"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format, addWeeks, subWeeks, isSameDay } from "date-fns";
import { motion } from "framer-motion";
import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { listScheduleEventsAction } from "@/application/ministries/actions";
import { FadeIn } from "@/components/motion/page-transition";
import { SchedulerBoard } from "@/components/schedule/scheduler-board";
import {
  formatScheduleDateTime,
  getWeekDays,
  getWeekRange,
} from "@/components/schedule/utils";
import { ErrorState, LoadingState } from "@/components/shared/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ScheduleEventEntity } from "@/domain/entities/ministry";
import { SCHEDULE_EVENT_TYPE_LABELS } from "@/domain/enums/ministry";
import { cn } from "@/lib/utils";

type SerializedEvent = Omit<
  ScheduleEventEntity,
  "startsAt" | "endsAt" | "createdAt" | "updatedAt"
> & {
  startsAt: string;
  endsAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export function ScheduleView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventParam = searchParams.get("event");
  const ministryParam = searchParams.get("ministry");

  const [weekAnchor, setWeekAnchor] = useState(() => new Date());
  const [events, setEvents] = useState<SerializedEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(
    eventParam
  );
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const { start, end } = getWeekRange(weekAnchor);
  const weekDays = getWeekDays(weekAnchor);

  const loadEvents = useCallback(async () => {
    const res = await listScheduleEventsAction({
      from: start.toISOString(),
      to: end.toISOString(),
      ministryId: ministryParam ?? undefined,
      limit: 50,
    });

    if (!res.ok) {
      setError(res.error);
      setLoading(false);
      return;
    }

    const serialized = JSON.parse(JSON.stringify(res.data)) as SerializedEvent[];
    setEvents(serialized);
    setError(null);
    setLoading(false);
  }, [start, end, ministryParam]);

  useEffect(() => {
    setLoading(true);
    loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    if (events.length === 0) return;
    if (eventParam && events.some((e) => e.id === eventParam)) {
      setSelectedEventId(eventParam);
      setSelectedDate(null);
    } else if (!selectedEventId && !selectedDate) {
      setSelectedEventId(events[0].id);
    }
  }, [events, eventParam, selectedEventId, selectedDate]);

  const eventsForDay = (day: Date) =>
    events.filter((e) => isSameDay(new Date(e.startsAt), day));

  const handleSelectEvent = (eventId: string) => {
    setSelectedEventId(eventId);
    setSelectedDate(null);
    router.replace(`/schedule?event=${eventId}`, { scroll: false });
  };

  const handleSelectDay = (day: Date) => {
    const dayEvents = eventsForDay(day);
    if (dayEvents.length > 0) {
      handleSelectEvent(dayEvents[0].id);
    } else {
      setSelectedEventId(null);
      setSelectedDate(day.toISOString());
      router.replace(`/schedule?date=${day.toISOString()}`, { scroll: false });
    }
  };

  const handleEventCreated = (eventId: string) => {
    setSelectedEventId(eventId);
    setSelectedDate(null);
    router.replace(`/schedule?event=${eventId}`, { scroll: false });
    loadEvents();
  };

  return (
    <div className="space-y-6 lg:space-y-7">
      <FadeIn>
        <div className="relative overflow-hidden rounded-[2rem] glass-strong p-6 sm:p-8">
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-2">
              <p className="text-sm font-medium text-primary">Volunteer scheduling</p>
              <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-5xl">
                Schedule
              </h1>
              <p className="max-w-xl text-muted-foreground text-balance">
                Week calendar and drag-and-drop board — assign volunteers to
                slots with conflict awareness.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="glass"
                size="icon"
                onClick={() => setWeekAnchor(subWeeks(weekAnchor, 1))}
                aria-label="Previous week"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="min-w-[140px] text-center text-sm font-medium">
                {format(start, "MMM d")} – {format(end, "MMM d, yyyy")}
              </span>
              <Button
                variant="glass"
                size="icon"
                onClick={() => setWeekAnchor(addWeeks(weekAnchor, 1))}
                aria-label="Next week"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </FadeIn>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="space-y-4">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
            <CalendarClock className="h-4 w-4 text-primary" />
            Week overview
          </h2>

          {loading ? (
            <LoadingState label="Loading events…" />
          ) : error ? (
            <ErrorState description={error} onRetry={loadEvents} />
          ) : (
            <div className="grid gap-3 sm:grid-cols-7">
              {weekDays.map((day, i) => {
                const dayEvents = eventsForDay(day);
                const isSelected =
                  selectedDate && isSameDay(new Date(selectedDate), day) ||
                  dayEvents.some((e) => e.id === selectedEventId);

                return (
                  <motion.button
                    key={day.toISOString()}
                    type="button"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => handleSelectDay(day)}
                    className={cn(
                      "flex min-h-[100px] flex-col rounded-[1.25rem] border p-3 text-left transition-all touch-manipulation",
                      isSelected
                        ? "border-primary/50 bg-primary/8 shadow-[var(--shadow-soft)]"
                        : "border-border/50 bg-background/30 hover:border-primary/30"
                    )}
                  >
                    <span className="text-xs font-medium text-muted-foreground">
                      {format(day, "EEE")}
                    </span>
                    <span className="font-display text-lg font-semibold">
                      {format(day, "d")}
                    </span>
                    <div className="mt-2 space-y-1">
                      {dayEvents.slice(0, 2).map((e) => (
                        <span
                          key={e.id}
                          className="block truncate text-[10px] text-muted-foreground"
                        >
                          {e.title}
                        </span>
                      ))}
                      {dayEvents.length > 2 && (
                        <span className="text-[10px] text-primary">
                          +{dayEvents.length - 2} more
                        </span>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}

          {!loading && !error && events.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                Events this week
              </h3>
              <ul className="space-y-2">
                {events.map((event) => (
                  <li key={event.id}>
                    <button
                      type="button"
                      onClick={() => handleSelectEvent(event.id)}
                      className={cn(
                        "w-full rounded-[1.25rem] border p-4 text-left transition-all",
                        selectedEventId === event.id
                          ? "border-primary/50 bg-primary/8"
                          : "border-border/50 bg-background/30 hover:border-primary/30"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium">{event.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatScheduleDateTime(event.startsAt)}
                          </p>
                        </div>
                        <Badge variant="outline">
                          {SCHEDULE_EVENT_TYPE_LABELS[event.eventType]}
                        </Badge>
                      </div>
                      {event.neededSlots != null && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          {event.filledSlots ?? 0}/{event.neededSlots} slots filled
                        </p>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <aside className="hidden lg:block glass rounded-[1.75rem] p-5">
          <h3 className="font-display text-sm font-semibold">Quick tips</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>Drag volunteers from the pool into slot columns</li>
            <li>Confirm or decline pending assignments on the board</li>
            <li>Conflicts show as a banner when overlaps occur</li>
          </ul>
        </aside>
      </div>

      <section className="glass rounded-[1.75rem] p-5 sm:p-6">
        <SchedulerBoard
          eventId={selectedEventId ?? undefined}
          date={selectedDate ?? undefined}
          onEventCreated={handleEventCreated}
        />
      </section>
    </div>
  );
}
