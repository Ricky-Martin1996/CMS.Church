"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Loader2,
  QrCode,
  Search,
  UserPlus,
} from "lucide-react";
import {
  eventCheckInAction,
  getChurchEventProfileAction,
} from "@/application/events/actions";
import { formatEventWhen } from "@/components/events/utils";
import { FadeIn } from "@/components/motion/page-transition";
import { ErrorState, LoadingState } from "@/components/shared/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { EventProfile } from "@/domain/entities/event";
import { REGISTRATION_STATUS_LABELS } from "@/domain/enums/event";
import { cn } from "@/lib/utils";

type SerializedProfile = {
  event: {
    id: string;
    title: string;
    startsAt: string;
    endsAt: string | null;
    allDay: boolean;
    venueName: string | null;
    checkInCode: string;
  };
  registrations: Array<{
    id: string;
    displayName: string;
    status: keyof typeof REGISTRATION_STATUS_LABELS;
    partySize: number;
    memberId: string | null;
    tickets?: Array<{ id: string; qrToken: string; status: string }>;
  }>;
  checkIns: Array<{
    id: string;
    method: string;
    checkedInAt: string;
    displayName?: string;
    notes: string | null;
  }>;
};

export function EventCheckInView({ eventId }: { eventId: string }) {
  const [profile, setProfile] = useState<SerializedProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, startTransition] = useTransition();
  const [qrToken, setQrToken] = useState("");
  const [search, setSearch] = useState("");
  const [manualName, setManualName] = useState("");

  const load = useCallback(async () => {
    const res = await getChurchEventProfileAction(eventId);
    if (!res.ok) {
      setError(res.error);
      setLoading(false);
      return;
    }
    const data = JSON.parse(JSON.stringify(res.data)) as EventProfile;
    setProfile({
      event: {
        id: data.event.id,
        title: data.event.title,
        startsAt: String(data.event.startsAt),
        endsAt: data.event.endsAt ? String(data.event.endsAt) : null,
        allDay: data.event.allDay,
        venueName: data.event.venueName,
        checkInCode: data.event.checkInCode,
      },
      registrations: data.registrations.map((r) => ({
        id: r.id,
        displayName: r.displayName,
        status: r.status,
        partySize: r.partySize,
        memberId: r.memberId,
        tickets: r.tickets?.map((t) => ({
          id: t.id,
          qrToken: t.qrToken,
          status: t.status,
        })),
      })),
      checkIns: data.checkIns.map((c) => ({
        id: c.id,
        method: c.method,
        checkedInAt: String(c.checkedInAt),
        displayName: c.displayName,
        notes: c.notes,
      })),
    });
    setError(null);
    setLoading(false);
  }, [eventId]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    if (!profile) return [];
    const q = search.trim().toLowerCase();
    return profile.registrations.filter((r) => {
      if (r.status === "CANCELLED" || r.status === "CHECKED_IN") return false;
      if (!q) return true;
      return (
        r.displayName.toLowerCase().includes(q) ||
        r.tickets?.some((t) => t.qrToken.toLowerCase().includes(q))
      );
    });
  }, [profile, search]);

  const runCheckIn = (payload: {
    method: "QR" | "SEARCH" | "MANUAL";
    qrToken?: string;
    registrationId?: string;
    memberId?: string;
    guestName?: string;
    notes?: string;
  }) => {
    startTransition(async () => {
      setMessage(null);
      const res = await eventCheckInAction({
        eventId,
        ...payload,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setError(null);
      setMessage(`Checked in via ${payload.method}`);
      setQrToken("");
      setManualName("");
      await load();
    });
  };

  if (loading) return <LoadingState label="Opening check-in desk…" />;
  if (!profile) {
    return <ErrorState description={error ?? "Event not found"} onRetry={load} />;
  }

  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/events/${eventId}`}>
              <ArrowLeft className="h-4 w-4" />
              Back to event
            </Link>
          </Button>
        </div>
        <div className="mt-3 space-y-2">
          <p className="text-sm font-medium text-primary">Check-in desk</p>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            {profile.event.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            {formatEventWhen(
              profile.event.startsAt,
              profile.event.endsAt,
              profile.event.allDay
            )}
            {profile.event.venueName ? ` · ${profile.event.venueName}` : ""}
          </p>
        </div>
      </FadeIn>

      <div className="grid gap-4 lg:grid-cols-3">
        <FadeIn>
          <section className="glass-strong space-y-3 rounded-[1.75rem] p-5">
            <div className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-primary" />
              <h2 className="font-display text-lg font-semibold">Scan QR</h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Paste ticket token from QR. Duplicate scans are blocked.
            </p>
            <input
              className="w-full rounded-xl border border-border/60 bg-background/50 px-3 py-2 font-mono text-sm"
              placeholder="Ticket QR token"
              value={qrToken}
              onChange={(e) => setQrToken(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && qrToken.trim()) {
                  runCheckIn({ method: "QR", qrToken: qrToken.trim() });
                }
              }}
            />
            <Button
              className="w-full"
              disabled={pending || !qrToken.trim()}
              onClick={() =>
                runCheckIn({ method: "QR", qrToken: qrToken.trim() })
              }
            >
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Check in ticket"
              )}
            </Button>
            <p className="text-[11px] text-muted-foreground">
              Event code:{" "}
              <code className="rounded bg-muted px-1">
                {profile.event.checkInCode.slice(0, 10)}…
              </code>
            </p>
          </section>
        </FadeIn>

        <FadeIn delay={0.05}>
          <section className="glass space-y-3 rounded-[1.75rem] p-5 lg:col-span-2">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              <h2 className="font-display text-lg font-semibold">
                Search registrations
              </h2>
            </div>
            <input
              className="w-full rounded-xl border border-border/60 bg-background/50 px-3 py-2 text-sm"
              placeholder="Search by name or ticket…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <ul className="max-h-[280px] space-y-2 overflow-y-auto">
              {filtered.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border/40 px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium">{r.displayName}</p>
                    <p className="text-xs text-muted-foreground">
                      {REGISTRATION_STATUS_LABELS[r.status]} · party{" "}
                      {r.partySize}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    disabled={pending}
                    onClick={() =>
                      runCheckIn({
                        method: "SEARCH",
                        registrationId: r.id,
                        memberId: r.memberId ?? undefined,
                      })
                    }
                  >
                    Check in
                  </Button>
                </li>
              ))}
              {filtered.length === 0 && (
                <li className="py-6 text-center text-sm text-muted-foreground">
                  No matching open registrations
                </li>
              )}
            </ul>
          </section>
        </FadeIn>
      </div>

      <FadeIn delay={0.08}>
        <section className="glass flex flex-col gap-3 rounded-[1.75rem] p-5 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              <h2 className="font-display text-lg font-semibold">
                Manual walk-in
              </h2>
            </div>
            <input
              className="w-full rounded-xl border border-border/60 bg-background/50 px-3 py-2 text-sm"
              placeholder="Guest name"
              value={manualName}
              onChange={(e) => setManualName(e.target.value)}
            />
          </div>
          <Button
            disabled={pending || !manualName.trim()}
            onClick={() =>
              runCheckIn({
                method: "MANUAL",
                guestName: manualName.trim(),
                notes: manualName.trim(),
              })
            }
          >
            Manual check-in
          </Button>
        </section>
      </FadeIn>

      {(message || error) && (
        <p
          className={cn(
            "text-sm",
            error
              ? "text-amber-700 dark:text-amber-300"
              : "text-emerald-700 dark:text-emerald-300"
          )}
        >
          {error ?? message}
        </p>
      )}

      <section className="glass rounded-[1.75rem] p-5">
        <h2 className="font-display text-lg font-semibold">Live check-ins</h2>
        <ul className="mt-3 space-y-2">
          {profile.checkIns.map((c, i) => (
            <motion.li
              key={c.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              className="flex items-center justify-between gap-3 border-b border-border/30 py-2 text-sm last:border-0"
            >
              <div>
                <p className="font-medium">
                  {c.displayName ?? c.notes ?? "Guest"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(c.checkedInAt), "h:mm:ss a")}
                </p>
              </div>
              <Badge variant="outline">{c.method}</Badge>
            </motion.li>
          ))}
          {profile.checkIns.length === 0 && (
            <li className="py-4 text-sm text-muted-foreground">
              Waiting for the first scan…
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}
