"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Bell,
  Loader2,
  MapPin,
  QrCode,
  Ticket,
  Users,
  AlertTriangle,
} from "lucide-react";
import {
  cancelChurchEventAction,
  getChurchEventProfileAction,
  publishChurchEventAction,
  queueEventMessageAction,
  registerForEventAction,
} from "@/application/events/actions";
import {
  capacityPercent,
  eventStatusLabel,
  eventStatusVariant,
  eventTypeLabel,
  formatEventWhen,
} from "@/components/events/utils";
import { FadeIn } from "@/components/motion/page-transition";
import { ErrorState, LoadingState } from "@/components/shared/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { EventProfile } from "@/domain/entities/event";
import {
  EventMessageChannel,
  RegistrantType,
  REGISTRATION_STATUS_LABELS,
  RECURRENCE_LABELS,
} from "@/domain/enums/event";
import { cn } from "@/lib/utils";

type SerializedProfile = {
  event: Omit<
    EventProfile["event"],
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
  speakers: EventProfile["speakers"];
  attachments: EventProfile["attachments"];
  resources: EventProfile["resources"];
  ministries: EventProfile["ministries"];
  registrations: Array<
    Omit<
      EventProfile["registrations"][number],
      "registeredAt" | "cancelledAt" | "checkedInAt" | "createdAt" | "updatedAt" | "tickets"
    > & {
      registeredAt: string;
      cancelledAt: string | null;
      checkedInAt: string | null;
      createdAt: string;
      updatedAt: string;
      tickets?: Array<
        Omit<
          NonNullable<EventProfile["registrations"][number]["tickets"]>[number],
          "issuedAt" | "usedAt" | "createdAt"
        > & {
          issuedAt: string;
          usedAt: string | null;
          createdAt: string;
        }
      >;
    }
  >;
  waitlist: Array<
    Omit<EventProfile["waitlist"][number], "promotedAt" | "createdAt"> & {
      promotedAt: string | null;
      createdAt: string;
    }
  >;
  checkIns: Array<
    Omit<EventProfile["checkIns"][number], "checkedInAt" | "createdAt"> & {
      checkedInAt: string;
      createdAt: string;
    }
  >;
  activities: Array<
    Omit<EventProfile["activities"][number], "occurredAt" | "createdAt"> & {
      occurredAt: string;
      createdAt: string;
    }
  >;
  messages: Array<
    Omit<
      EventProfile["messages"][number],
      "scheduledFor" | "sentAt" | "createdAt"
    > & {
      scheduledFor: string | null;
      sentAt: string | null;
      createdAt: string;
    }
  >;
  volunteer: Omit<EventProfile["volunteer"], "conflicts"> & {
    conflicts: Array<
      Omit<EventProfile["volunteer"]["conflicts"][number], "conflictingStartsAt"> & {
        conflictingStartsAt: string;
      }
    >;
  };
};

export function EventDetailView({ eventId }: { eventId: string }) {
  const [profile, setProfile] = useState<SerializedProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, startTransition] = useTransition();
  const [guestName, setGuestName] = useState("");
  const [partySize, setPartySize] = useState("1");
  const [messageBody, setMessageBody] = useState(
    "Reminder: you're registered — we look forward to seeing you."
  );

  const load = useCallback(async () => {
    const res = await getChurchEventProfileAction(eventId);
    if (!res.ok) {
      setError(res.error);
      setLoading(false);
      return;
    }
    setProfile(JSON.parse(JSON.stringify(res.data)) as SerializedProfile);
    setError(null);
    setLoading(false);
  }, [eventId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <LoadingState label="Loading event…" />;
  if (error || !profile) {
    return <ErrorState description={error ?? "Event not found"} onRetry={load} />;
  }

  const { event } = profile;
  const pct = capacityPercent(event.registrationCount, event.capacity);

  const run = (fn: () => Promise<void>) => {
    startTransition(async () => {
      try {
        await fn();
        await load();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Action failed");
      }
    });
  };

  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/events">
              <ArrowLeft className="h-4 w-4" />
              Events
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/events/${eventId}/check-in`}>
              <QrCode className="h-4 w-4" />
              Check-in desk
            </Link>
          </Button>
        </div>
      </FadeIn>

      <FadeIn delay={0.04}>
        <article className="relative overflow-hidden rounded-[2rem] glass-strong">
          <div
            className="absolute inset-0 bg-gradient-to-br from-primary/25 via-transparent to-chart-2/20"
            style={
              event.heroImageUrl
                ? {
                    backgroundImage: `linear-gradient(115deg, hsl(var(--background)/0.8), hsl(var(--background)/0.4)), url(${event.heroImageUrl})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }
                : undefined
            }
          />
          <div className="relative space-y-5 p-6 sm:p-8 lg:p-10">
            <div className="flex flex-wrap gap-2">
              <Badge>{eventTypeLabel(event.eventType)}</Badge>
              <Badge variant={eventStatusVariant(event.status)}>
                {eventStatusLabel(event.status)}
              </Badge>
              <Badge variant="outline">
                {RECURRENCE_LABELS[event.recurrence]}
              </Badge>
            </div>
            <h1 className="max-w-3xl font-display text-3xl font-semibold tracking-tight sm:text-5xl">
              {event.title}
            </h1>
            {event.description && (
              <p className="max-w-2xl text-muted-foreground">{event.description}</p>
            )}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span>{formatEventWhen(event.startsAt, event.endsAt, event.allDay)}</span>
              {event.venueName && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-primary" />
                  {event.venueName}
                  {event.campus ? ` · ${event.campus}` : ""}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {event.status === "DRAFT" && (
                <Button
                  disabled={pending}
                  onClick={() =>
                    run(async () => {
                      const res = await publishChurchEventAction(eventId);
                      if (!res.ok) throw new Error(res.error);
                    })
                  }
                >
                  Publish
                </Button>
              )}
              {event.status !== "CANCELLED" && (
                <Button
                  variant="outline"
                  disabled={pending}
                  onClick={() =>
                    run(async () => {
                      const res = await cancelChurchEventAction(eventId);
                      if (!res.ok) throw new Error(res.error);
                    })
                  }
                >
                  Cancel event
                </Button>
              )}
              {pending && <Loader2 className="h-4 w-4 animate-spin self-center" />}
            </div>
          </div>
        </article>
      </FadeIn>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Registered",
            value: String(event.registrationCount ?? profile.registrations.filter((r) => r.status !== "CANCELLED" && r.status !== "WAITLISTED").reduce((s, r) => s + r.partySize, 0)),
            icon: Ticket,
          },
          {
            label: "Capacity",
            value: pct != null ? `${pct}%` : "Open",
            icon: Users,
          },
          {
            label: "Checked in",
            value: String(profile.checkIns.length),
            icon: QrCode,
          },
          {
            label: "Volunteer cover",
            value: `${profile.volunteer.coveragePercent}%`,
            icon: Users,
          },
        ].map((kpi) => (
          <div key={kpi.label} className="glass rounded-[1.5rem] p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{kpi.label}</p>
              <kpi.icon className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-2 font-display text-2xl font-semibold">{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <FadeIn>
            <section className="glass rounded-[1.75rem] p-5">
              <h2 className="font-display text-lg font-semibold">Register</h2>
              <p className="mb-3 text-sm text-muted-foreground">
                Members, visitors, families, or walk-in guests
              </p>
              <div className="flex flex-wrap gap-2">
                <input
                  className="min-w-[180px] flex-1 rounded-xl border border-border/60 bg-background/50 px-3 py-2 text-sm"
                  placeholder="Guest / family name"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                />
                <input
                  type="number"
                  min={1}
                  className="w-20 rounded-xl border border-border/60 bg-background/50 px-3 py-2 text-sm"
                  value={partySize}
                  onChange={(e) => setPartySize(e.target.value)}
                />
                <Button
                  disabled={pending || !guestName.trim()}
                  onClick={() =>
                    run(async () => {
                      const res = await registerForEventAction({
                        eventId,
                        registrantType: RegistrantType.GUEST,
                        guestName: guestName.trim(),
                        partySize: Number(partySize) || 1,
                      });
                      if (!res.ok) throw new Error(res.error);
                      setGuestName("");
                    })
                  }
                >
                  Register guest
                </Button>
              </div>
            </section>
          </FadeIn>

          <FadeIn delay={0.05}>
            <section className="glass rounded-[1.75rem] p-5">
              <h2 className="font-display text-lg font-semibold">Registrations</h2>
              <ul className="mt-3 divide-y divide-border/40">
                {profile.registrations.slice(0, 20).map((reg) => (
                  <li
                    key={reg.id}
                    className="flex items-center justify-between gap-3 py-3 text-sm"
                  >
                    <div>
                      <p className="font-medium">{reg.displayName}</p>
                      <p className="text-xs text-muted-foreground">
                        {reg.registrantType} · party {reg.partySize}
                        {reg.tickets?.[0] ? (
                          <>
                            {" "}
                            · QR{" "}
                            <code className="rounded bg-muted px-1 text-[10px]">
                              {reg.tickets[0].qrToken.slice(0, 8)}…
                            </code>
                          </>
                        ) : null}
                      </p>
                    </div>
                    <Badge variant="outline">
                      {REGISTRATION_STATUS_LABELS[reg.status]}
                    </Badge>
                  </li>
                ))}
                {profile.registrations.length === 0 && (
                  <li className="py-4 text-sm text-muted-foreground">
                    No registrations yet
                  </li>
                )}
              </ul>
            </section>
          </FadeIn>

          <FadeIn delay={0.08}>
            <section className="glass rounded-[1.75rem] p-5">
              <h2 className="font-display text-lg font-semibold">Activity</h2>
              <ul className="relative mt-4 space-y-4 before:absolute before:bottom-1 before:left-[7px] before:top-1 before:w-px before:bg-border/60">
                {profile.activities.map((a, i) => (
                  <motion.li
                    key={a.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="relative pl-6"
                  >
                    <span className="absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-primary/50 bg-background" />
                    <p className="text-sm font-medium">{a.title}</p>
                    {a.description && (
                      <p className="text-xs text-muted-foreground">{a.description}</p>
                    )}
                    <p className="text-[11px] text-muted-foreground">
                      {format(new Date(a.occurredAt), "MMM d · h:mm a")}
                    </p>
                  </motion.li>
                ))}
              </ul>
            </section>
          </FadeIn>
        </div>

        <div className="space-y-4">
          <section className="glass rounded-[1.75rem] p-5">
            <h2 className="font-display text-lg font-semibold">Ministries</h2>
            <ul className="mt-3 space-y-2">
              {profile.ministries.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center gap-2 rounded-xl border border-border/40 px-3 py-2 text-sm"
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: m.ministryColor }}
                  />
                  {m.ministryName}
                </li>
              ))}
              {profile.ministries.length === 0 && (
                <li className="text-sm text-muted-foreground">
                  No ministries linked
                </li>
              )}
            </ul>
            {profile.volunteer.gaps.length > 0 && (
              <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
                <p className="flex items-center gap-2 font-medium">
                  <AlertTriangle className="h-4 w-4" />
                  Staffing gaps
                </p>
                <ul className="mt-2 space-y-1 text-muted-foreground">
                  {profile.volunteer.gaps.map((g, i) => (
                    <li key={`${g.ministryId}-${i}`}>
                      {g.ministryName}: need {g.gap} more
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {profile.volunteer.conflicts.length > 0 && (
              <div className="mt-3 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm">
                <p className="font-medium">Schedule conflicts</p>
                <ul className="mt-2 space-y-1 text-muted-foreground">
                  {profile.volunteer.conflicts.map((c) => (
                    <li key={c.volunteerId + c.conflictingEventTitle}>
                      {c.volunteerName} · {c.conflictingEventTitle}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {profile.volunteer.scheduleEventId && (
              <Button variant="outline" size="sm" className="mt-3" asChild>
                <Link href={`/schedule?event=${profile.volunteer.scheduleEventId}`}>
                  Open staffing board
                </Link>
              </Button>
            )}
          </section>

          <section className="glass rounded-[1.75rem] p-5">
            <h2 className="font-display text-lg font-semibold">Speakers</h2>
            <ul className="mt-3 space-y-2">
              {profile.speakers.map((s) => (
                <li key={s.id} className="text-sm">
                  <p className="font-medium">{s.name}</p>
                  {s.title && (
                    <p className="text-xs text-muted-foreground">{s.title}</p>
                  )}
                </li>
              ))}
              {profile.speakers.length === 0 && (
                <li className="text-sm text-muted-foreground">No speakers listed</li>
              )}
            </ul>
          </section>

          <section className="glass rounded-[1.75rem] p-5">
            <h2 className="font-display text-lg font-semibold">Resources</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {profile.resources.map((r) => (
                <li key={r.id} className="flex justify-between">
                  <span>
                    {r.name}{" "}
                    <span className="text-muted-foreground">({r.type})</span>
                  </span>
                  <span>×{r.quantity}</span>
                </li>
              ))}
              {profile.resources.length === 0 && (
                <li className="text-muted-foreground">No resources booked</li>
              )}
            </ul>
          </section>

          <section className="glass rounded-[1.75rem] p-5">
            <h2 className="mb-2 flex items-center gap-2 font-display text-lg font-semibold">
              <Bell className="h-4 w-4 text-primary" />
              Reminders
            </h2>
            <p className="mb-3 text-xs text-muted-foreground">
              Queues Email / WhatsApp / SMS / Push (provider hooks ready)
            </p>
            <textarea
              className="mb-2 min-h-[72px] w-full rounded-xl border border-border/60 bg-background/50 px-3 py-2 text-sm"
              value={messageBody}
              onChange={(e) => setMessageBody(e.target.value)}
            />
            <div className="flex flex-wrap gap-2">
              {(
                [
                  EventMessageChannel.EMAIL,
                  EventMessageChannel.WHATSAPP,
                  EventMessageChannel.SMS,
                  EventMessageChannel.PUSH,
                ] as const
              ).map((channel) => (
                <Button
                  key={channel}
                  size="sm"
                  variant="outline"
                  disabled={pending || !messageBody.trim()}
                  onClick={() =>
                    run(async () => {
                      const res = await queueEventMessageAction({
                        eventId,
                        channel,
                        subject: `Reminder: ${event.title}`,
                        body: messageBody.trim(),
                      });
                      if (!res.ok) throw new Error(res.error);
                    })
                  }
                >
                  Queue {channel}
                </Button>
              ))}
            </div>
            {profile.messages.length > 0 && (
              <ul className="mt-3 space-y-2 border-t border-border/40 pt-3 text-xs text-muted-foreground">
                {profile.messages.slice(0, 5).map((m) => (
                  <li key={m.id}>
                    {m.channel} · queued{" "}
                    {format(new Date(m.createdAt), "MMM d h:mm a")}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {profile.waitlist.length > 0 && (
            <section className="glass rounded-[1.75rem] p-5">
              <h2 className="font-display text-lg font-semibold">Waitlist</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {profile.waitlist.map((w) => (
                  <li key={w.id} className={cn("flex justify-between")}>
                    <span>
                      #{w.position} {w.displayName}
                    </span>
                    <span className="text-muted-foreground">×{w.partySize}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
