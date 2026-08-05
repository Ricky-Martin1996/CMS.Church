"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { format, addMonths, subMonths } from "date-fns";
import { motion } from "framer-motion";
import {
  CalendarDays,
  CalendarRange,
  Loader2,
  MapPin,
  Plus,
  QrCode,
  Users,
} from "lucide-react";
import {
  createChurchEventAction,
  getEventAnalyticsAction,
  listChurchEventsAction,
} from "@/application/events/actions";
import { safeCssUrl } from "@/lib/safe-url";
import { EventAnalyticsPanel } from "@/components/events/event-analytics";
import {
  capacityPercent,
  EVENT_TYPE_OPTIONS,
  eventStatusLabel,
  eventStatusVariant,
  eventTypeLabel,
  formatEventWhen,
} from "@/components/events/utils";
import { FadeIn, StaggerChildren, staggerItem } from "@/components/motion/page-transition";
import { ErrorState, LoadingState } from "@/components/shared/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChurchEventType,
  RecurrenceFrequency,
} from "@/domain/enums/event";
import type { EventAnalytics, EventListItem } from "@/domain/entities/event";

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

type SerializedAnalytics = Omit<EventAnalytics, "recentActivity"> & {
  recentActivity: Array<
    Omit<EventAnalytics["recentActivity"][number], "occurredAt" | "createdAt"> & {
      occurredAt: string;
      createdAt: string;
    }
  >;
};

export function EventsView() {
  const [events, setEvents] = useState<SerializedEvent[]>([]);
  const [analytics, setAnalytics] = useState<SerializedAnalytics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, startTransition] = useTransition();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    title: "",
    eventType: ChurchEventType.SUNDAY_SERVICE,
    startsAt: "",
    endsAt: "",
    venueName: "",
    capacity: "200",
    description: "",
    publish: true,
  });

  const load = useCallback(async () => {
    const [eventsRes, analyticsRes] = await Promise.all([
      listChurchEventsAction({ limit: 80 }),
      getEventAnalyticsAction(),
    ]);

    if (!eventsRes.ok) {
      setError(eventsRes.error);
      setLoading(false);
      return;
    }
    if (!analyticsRes.ok) {
      setError(analyticsRes.error);
      setLoading(false);
      return;
    }

    setEvents(JSON.parse(JSON.stringify(eventsRes.data)) as SerializedEvent[]);
    setAnalytics(
      JSON.parse(JSON.stringify(analyticsRes.data)) as SerializedAnalytics
    );
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const upcoming = useMemo(
    () =>
      events
        .filter((e) => new Date(e.startsAt) >= new Date() || e.status === "PUBLISHED")
        .sort(
          (a, b) =>
            new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
        ),
    [events]
  );

  const hero = upcoming[0] ?? events[0];
  const rest = upcoming.filter((e) => e.id !== hero?.id).slice(0, 6);

  const handleCreate = () => {
    if (!form.title.trim() || !form.startsAt) return;
    startTransition(async () => {
      const res = await createChurchEventAction({
        title: form.title.trim(),
        eventType: form.eventType,
        startsAt: new Date(form.startsAt).toISOString(),
        endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
        venueName: form.venueName || undefined,
        capacity: form.capacity ? Number(form.capacity) : null,
        description: form.description || undefined,
        recurrence: RecurrenceFrequency.NONE,
        publish: form.publish,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setShowCreate(false);
      setForm({
        title: "",
        eventType: ChurchEventType.SUNDAY_SERVICE,
        startsAt: "",
        endsAt: "",
        venueName: "",
        capacity: "200",
        description: "",
        publish: true,
      });
      await load();
    });
  };

  if (loading) return <LoadingState label="Loading church calendar…" />;
  if (error && !events.length) {
    return <ErrorState description={error} onRetry={load} />;
  }

  const heroPct = hero
    ? capacityPercent(hero.registrationCount, hero.capacity)
    : null;

  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-primary">Operational hub</p>
            <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Events
            </h1>
            <p className="max-w-xl text-muted-foreground">
              Church calendar, registration, QR tickets, staffing, and attendance
              — one surface for every gathering.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href="/events/calendar">
                <CalendarRange className="h-4 w-4" />
                Calendar
              </Link>
            </Button>
            <Button variant="glow" onClick={() => setShowCreate((v) => !v)}>
              <Plus className="h-4 w-4" />
              Create event
            </Button>
          </div>
        </div>
      </FadeIn>

      {showCreate && (
        <FadeIn>
          <div className="glass-strong space-y-4 rounded-[1.75rem] p-5 sm:p-6">
            <h2 className="font-display text-xl font-semibold">New event</h2>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span className="text-muted-foreground">Title</span>
                <input
                  className="w-full rounded-xl border border-border/60 bg-background/50 px-3 py-2"
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                  placeholder="Sunday Worship Service"
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-muted-foreground">Type</span>
                <select
                  className="w-full rounded-xl border border-border/60 bg-background/50 px-3 py-2"
                  value={form.eventType}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      eventType: e.target.value as ChurchEventType,
                    }))
                  }
                >
                  {EVENT_TYPE_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {eventTypeLabel(t)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-muted-foreground">Starts</span>
                <input
                  type="datetime-local"
                  className="w-full rounded-xl border border-border/60 bg-background/50 px-3 py-2"
                  value={form.startsAt}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, startsAt: e.target.value }))
                  }
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-muted-foreground">Ends</span>
                <input
                  type="datetime-local"
                  className="w-full rounded-xl border border-border/60 bg-background/50 px-3 py-2"
                  value={form.endsAt}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, endsAt: e.target.value }))
                  }
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-muted-foreground">Venue</span>
                <input
                  className="w-full rounded-xl border border-border/60 bg-background/50 px-3 py-2"
                  value={form.venueName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, venueName: e.target.value }))
                  }
                  placeholder="Main Sanctuary"
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-muted-foreground">Capacity</span>
                <input
                  type="number"
                  className="w-full rounded-xl border border-border/60 bg-background/50 px-3 py-2"
                  value={form.capacity}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, capacity: e.target.value }))
                  }
                />
              </label>
            </div>
            <label className="block space-y-1 text-sm">
              <span className="text-muted-foreground">Description</span>
              <textarea
                className="min-h-[88px] w-full rounded-xl border border-border/60 bg-background/50 px-3 py-2"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.publish}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, publish: e.target.checked }))
                  }
                />
                Publish immediately
              </label>
              <Button onClick={handleCreate} disabled={pending}>
                {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                Save event
              </Button>
            </div>
          </div>
        </FadeIn>
      )}

      {analytics && <EventAnalyticsPanel analytics={analytics} />}

      {hero && (
        <FadeIn delay={0.05}>
          <Link href={`/events/${hero.id}`} className="block">
            <article className="relative overflow-hidden rounded-[2rem] glass-strong p-6 sm:p-8 hover-lift">
              <div
                className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-chart-2/15"
                style={
                  safeCssUrl(hero.heroImageUrl)
                    ? {
                        backgroundImage: `linear-gradient(120deg, hsl(var(--background)/0.75), hsl(var(--background)/0.35)), url(${JSON.stringify(safeCssUrl(hero.heroImageUrl))})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }
                    : undefined
                }
              />
              <div className="relative grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-end">
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge>{eventTypeLabel(hero.eventType)}</Badge>
                    <Badge variant={eventStatusVariant(hero.status)}>
                      {eventStatusLabel(hero.status)}
                    </Badge>
                  </div>
                  <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                    {hero.title}
                  </h2>
                  <div className="flex flex-col gap-2 text-muted-foreground sm:flex-row sm:gap-6">
                    <p className="flex items-center gap-2 text-sm">
                      <CalendarDays className="h-4 w-4 text-primary" />
                      {formatEventWhen(hero.startsAt, hero.endsAt, hero.allDay)}
                    </p>
                    {hero.venueName && (
                      <p className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-primary" />
                        {hero.venueName}
                      </p>
                    )}
                  </div>
                </div>
                <div className="rounded-[1.5rem] border border-border/50 bg-background/50 p-5 backdrop-blur">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      {hero.registrationCount ?? 0} registered
                    </span>
                    <span className="font-display text-2xl font-semibold">
                      {heroPct ?? "—"}
                      {heroPct != null ? "%" : ""}
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                    <motion.div
                      className="h-full rounded-full bg-primary shadow-[0_0_12px_hsl(var(--primary)/0.5)]"
                      initial={{ width: 0 }}
                      animate={{ width: `${heroPct ?? 0}%` }}
                      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {hero.seatsRemaining != null
                      ? `${hero.seatsRemaining} seats remaining`
                      : "Open capacity"}
                    {hero.checkInCount
                      ? ` · ${hero.checkInCount} checked in`
                      : ""}
                  </p>
                </div>
              </div>
            </article>
          </Link>
        </FadeIn>
      )}

      <StaggerChildren className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rest.map((event) => {
          const pct = capacityPercent(event.registrationCount, event.capacity);
          return (
            <motion.article
              key={event.id}
              variants={staggerItem}
              className="glass flex flex-col gap-4 rounded-[1.75rem] p-5 hover-lift"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <Badge variant="outline">{eventTypeLabel(event.eventType)}</Badge>
                  <h3 className="font-display text-xl font-semibold tracking-tight">
                    <Link href={`/events/${event.id}`} className="hover:text-primary">
                      {event.title}
                    </Link>
                  </h3>
                </div>
                <Badge variant={eventStatusVariant(event.status)}>
                  {eventStatusLabel(event.status)}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {formatEventWhen(event.startsAt, event.endsAt, event.allDay)}
              </p>
              {event.venueName && (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  {event.venueName}
                </p>
              )}
              <div className="mt-auto space-y-2 pt-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{event.registrationCount ?? 0} registered</span>
                  <span>{pct != null ? `${pct}%` : "—"}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary/70"
                    style={{ width: `${pct ?? 0}%` }}
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/events/${event.id}`}>Open</Link>
                  </Button>
                  <Button size="sm" variant="ghost" asChild>
                    <Link href={`/events/${event.id}/check-in`}>
                      <QrCode className="h-3.5 w-3.5" />
                      Check-in
                    </Link>
                  </Button>
                </div>
              </div>
            </motion.article>
          );
        })}
      </StaggerChildren>

      {events.length === 0 && (
        <div className="glass rounded-[1.75rem] p-10 text-center">
          <p className="font-display text-xl font-semibold">No events yet</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Create your first Sunday service, prayer meeting, or outreach.
          </p>
          <Button className="mt-4" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" />
            Create event
          </Button>
        </div>
      )}

      {error && events.length > 0 && (
        <p className="text-sm text-amber-600 dark:text-amber-300">{error}</p>
      )}

      <p className="text-center text-xs text-muted-foreground">
        Month view · {format(subMonths(new Date(), 0), "MMMM yyyy")} ·{" "}
        <Link href="/events/calendar" className="text-primary hover:underline">
          Open full calendar
        </Link>{" "}
        · jump to {format(addMonths(new Date(), 1), "MMMM")}
      </p>
    </div>
  );
}
