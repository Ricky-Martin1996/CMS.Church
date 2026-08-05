"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import {
  addDays,
  addMonths,
  addWeeks,
  format,
  isSameDay,
  startOfDay,
  subMonths,
  subWeeks,
} from "date-fns";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import {
  listChurchEventsAction,
  rescheduleChurchEventAction,
} from "@/application/events/actions";
import {
  eventStatusVariant,
  eventTypeLabel,
  getMonthGrid,
  getWeekDays,
  isInMonth,
} from "@/components/events/utils";
import { FadeIn } from "@/components/motion/page-transition";
import { ErrorState, LoadingState } from "@/components/shared/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CalendarViewMode, EventListItem } from "@/domain/entities/event";
import { cn } from "@/lib/utils";

type SerializedEvent = Omit<
  EventListItem,
  | "startsAt"
  | "endsAt"
  | "recurrenceUntil"
  | "publishedAt"
  | "createdAt"
  | "updatedAt"
  | "deletedAt"
> & {
  startsAt: string;
  endsAt: string | null;
  recurrenceUntil: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

function DraggableEvent({
  event,
  compact,
}: {
  event: SerializedEvent;
  compact?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: event.id, data: { event } });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 20,
      }
    : undefined;

  return (
    <button
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "w-full rounded-lg border border-border/40 bg-background/70 px-2 py-1 text-left text-xs shadow-sm backdrop-blur transition",
        isDragging && "opacity-60 ring-2 ring-primary/40",
        compact ? "truncate" : "space-y-0.5"
      )}
      onClick={(e) => {
        if (isDragging) e.preventDefault();
      }}
    >
      <Link
        href={`/events/${event.id}`}
        className="block font-medium hover:text-primary"
        onClick={(e) => e.stopPropagation()}
      >
        {event.title}
      </Link>
      {!compact && (
        <p className="text-[10px] text-muted-foreground">
          {format(new Date(event.startsAt), "h:mm a")} ·{" "}
          {eventTypeLabel(event.eventType)}
        </p>
      )}
    </button>
  );
}

function DayDropZone({
  day,
  children,
  className,
}: {
  day: Date;
  children: React.ReactNode;
  className?: string;
}) {
  const id = `day-${format(day, "yyyy-MM-dd")}`;
  const { setNodeRef, isOver } = useDroppable({ id, data: { day } });
  return (
    <div
      ref={setNodeRef}
      className={cn(className, isOver && "ring-2 ring-primary/40 bg-primary/5")}
    >
      {children}
    </div>
  );
}

export function EventCalendarView() {
  const [mode, setMode] = useState<CalendarViewMode>("month");
  const [anchor, setAnchor] = useState(() => new Date());
  const [events, setEvents] = useState<SerializedEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const range = useMemo(() => {
    if (mode === "week" || mode === "timeline") {
      const days = getWeekDays(anchor);
      return { from: startOfDay(days[0]), to: addDays(startOfDay(days[6]), 1) };
    }
    if (mode === "agenda") {
      return {
        from: startOfDay(anchor),
        to: addDays(startOfDay(anchor), 45),
      };
    }
    const grid = getMonthGrid(anchor);
    return {
      from: startOfDay(grid[0]),
      to: addDays(startOfDay(grid[41]), 1),
    };
  }, [anchor, mode]);

  const load = useCallback(async () => {
    const res = await listChurchEventsAction({
      from: range.from.toISOString(),
      to: range.to.toISOString(),
      limit: 200,
    });
    if (!res.ok) {
      setError(res.error);
      setLoading(false);
      return;
    }
    setEvents(JSON.parse(JSON.stringify(res.data)) as SerializedEvent[]);
    setError(null);
    setLoading(false);
  }, [range.from, range.to]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const eventsForDay = (day: Date) =>
    events.filter((e) => isSameDay(new Date(e.startsAt), day));

  const onDragEnd = (event: DragEndEvent) => {
    const eventId = String(event.active.id);
    const day = event.over?.data?.current?.day as Date | undefined;
    if (!day) return;
    const current = events.find((e) => e.id === eventId);
    if (!current) return;
    if (isSameDay(new Date(current.startsAt), day)) return;

    const prevStart = new Date(current.startsAt);
    const nextStart = new Date(day);
    nextStart.setHours(prevStart.getHours(), prevStart.getMinutes(), 0, 0);

    startTransition(async () => {
      const res = await rescheduleChurchEventAction({
        eventId,
        startsAt: nextStart.toISOString(),
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      await load();
    });
  };

  const title =
    mode === "week" || mode === "timeline"
      ? `Week of ${format(getWeekDays(anchor)[0], "MMM d")}`
      : format(anchor, "MMMM yyyy");

  if (loading && events.length === 0) {
    return <LoadingState label="Loading calendar…" />;
  }
  if (error && events.length === 0) {
    return <ErrorState description={error} onRetry={load} />;
  }

  const monthDays = getMonthGrid(anchor);
  const weekDays = getWeekDays(anchor);

  return (
    <div className="space-y-5">
      <FadeIn>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/events">
                <ArrowLeft className="h-4 w-4" />
                Events hub
              </Link>
            </Button>
            <h1 className="font-display text-3xl font-semibold tracking-tight">
              Church Calendar
            </h1>
            <p className="text-sm text-muted-foreground">
              Month, week, agenda, and timeline — drag events to reschedule.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                ["month", "Month"],
                ["week", "Week"],
                ["agenda", "Agenda"],
                ["timeline", "Timeline"],
              ] as const
            ).map(([id, label]) => (
              <Button
                key={id}
                size="sm"
                variant={mode === id ? "default" : "outline"}
                onClick={() => setMode(id)}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
      </FadeIn>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="outline"
            onClick={() =>
              setAnchor((a) =>
                mode === "week" || mode === "timeline"
                  ? subWeeks(a, 1)
                  : subMonths(a, 1)
              )
            }
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            onClick={() =>
              setAnchor((a) =>
                mode === "week" || mode === "timeline"
                  ? addWeeks(a, 1)
                  : addMonths(a, 1)
              )
            }
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setAnchor(new Date())}>
            Today
          </Button>
          {pending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>
        <p className="font-display text-xl font-semibold">{title}</p>
      </div>

      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        {mode === "month" && (
          <div className="glass overflow-hidden rounded-[1.75rem]">
            <div className="grid grid-cols-7 border-b border-border/40 text-center text-xs font-medium text-muted-foreground">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div key={d} className="px-2 py-3">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {monthDays.map((day) => {
                const dayEvents = eventsForDay(day);
                return (
                  <DayDropZone
                    key={day.toISOString()}
                    day={day}
                    className={cn(
                      "min-h-[104px] border-b border-r border-border/30 p-1.5",
                      !isInMonth(day, anchor) && "bg-muted/20 opacity-60"
                    )}
                  >
                    <p
                      className={cn(
                        "mb-1 text-xs",
                        isSameDay(day, new Date()) &&
                          "font-semibold text-primary"
                      )}
                    >
                      {format(day, "d")}
                    </p>
                    <div className="space-y-1">
                      {dayEvents.slice(0, 3).map((e) => (
                        <DraggableEvent key={e.id} event={e} compact />
                      ))}
                      {dayEvents.length > 3 && (
                        <p className="text-[10px] text-muted-foreground">
                          +{dayEvents.length - 3} more
                        </p>
                      )}
                    </div>
                  </DayDropZone>
                );
              })}
            </div>
          </div>
        )}

        {mode === "week" && (
          <div className="grid gap-3 md:grid-cols-7">
            {weekDays.map((day) => (
              <DayDropZone
                key={day.toISOString()}
                day={day}
                className="glass min-h-[220px] rounded-[1.5rem] p-3"
              >
                <p className="mb-2 text-sm font-medium">
                  {format(day, "EEE d")}
                </p>
                <div className="space-y-2">
                  {eventsForDay(day).map((e) => (
                    <DraggableEvent key={e.id} event={e} />
                  ))}
                </div>
              </DayDropZone>
            ))}
          </div>
        )}

        {mode === "agenda" && (
          <div className="glass space-y-2 rounded-[1.75rem] p-4">
            {events
              .slice()
              .sort(
                (a, b) =>
                  new Date(a.startsAt).getTime() -
                  new Date(b.startsAt).getTime()
              )
              .map((e) => (
                <DayDropZone
                  key={e.id}
                  day={new Date(e.startsAt)}
                  className="rounded-xl"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/30 px-2 py-3 last:border-0">
                    <div>
                      <Link
                        href={`/events/${e.id}`}
                        className="font-medium hover:text-primary"
                      >
                        {e.title}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(e.startsAt), "EEE, MMM d · h:mm a")}
                        {e.venueName ? ` · ${e.venueName}` : ""}
                      </p>
                    </div>
                    <Badge variant={eventStatusVariant(e.status)}>
                      {eventTypeLabel(e.eventType)}
                    </Badge>
                  </div>
                </DayDropZone>
              ))}
            {events.length === 0 && (
              <p className="p-6 text-center text-sm text-muted-foreground">
                No upcoming events in this window
              </p>
            )}
          </div>
        )}

        {mode === "timeline" && (
          <div className="glass overflow-x-auto rounded-[1.75rem] p-4">
            <div className="flex min-w-[720px] gap-3">
              {weekDays.map((day) => (
                <DayDropZone
                  key={day.toISOString()}
                  day={day}
                  className="w-40 shrink-0 space-y-2"
                >
                  <p className="sticky top-0 text-xs font-medium text-muted-foreground">
                    {format(day, "EEE M/d")}
                  </p>
                  <div className="relative min-h-[320px] rounded-xl border border-dashed border-border/50 bg-background/30 p-2">
                    {eventsForDay(day).map((e, i) => (
                      <motion.div
                        key={e.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="mb-2"
                        style={{
                          marginTop: `${new Date(e.startsAt).getHours() * 4}px`,
                        }}
                      >
                        <DraggableEvent event={e} />
                      </motion.div>
                    ))}
                  </div>
                </DayDropZone>
              ))}
            </div>
          </div>
        )}
      </DndContext>

      {error && (
        <p className="text-sm text-amber-600 dark:text-amber-300">{error}</p>
      )}
    </div>
  );
}
