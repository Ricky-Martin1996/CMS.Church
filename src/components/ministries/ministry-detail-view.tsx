"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  Users,
  Wrench,
} from "lucide-react";
import {
  getSchedulerBoardAction,
  listMinistriesAction,
  listScheduleEventsAction,
  listVolunteersAction,
} from "@/application/ministries/actions";
import { FadeIn } from "@/components/motion/page-transition";
import { ErrorState, LoadingState } from "@/components/shared/states";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  formatMinistryDateTime,
  getInitials,
  ministryStatusVariant,
} from "@/components/ministries/utils";
import type {
  MinistryEntity,
  MinistryRoleEntity,
  ScheduleEventEntity,
  VolunteerListItem,
} from "@/domain/entities/ministry";
import {
  MINISTRY_STATUS_LABELS,
  SCHEDULE_EVENT_TYPE_LABELS,
} from "@/domain/enums/ministry";

type SerializedMinistry = Omit<MinistryEntity, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};

type SerializedEvent = Omit<ScheduleEventEntity, "startsAt" | "endsAt" | "createdAt" | "updatedAt"> & {
  startsAt: string;
  endsAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type SerializedVolunteer = Omit<
  VolunteerListItem,
  "createdAt" | "updatedAt" | "member" | "certifications" | "availabilities" | "preferences" | "skills"
> & {
  createdAt: string;
  updatedAt: string;
  member: VolunteerListItem["member"];
  certifications: VolunteerListItem["certifications"];
  availabilities: VolunteerListItem["availabilities"];
  preferences: VolunteerListItem["preferences"];
  skills: VolunteerListItem["skills"];
};

type RoleSummary = Pick<MinistryRoleEntity, "id" | "name" | "slotsNeeded" | "description">;

export function MinistryDetailView({ ministryId }: { ministryId: string }) {
  const [ministry, setMinistry] = useState<SerializedMinistry | null>(null);
  const [volunteers, setVolunteers] = useState<SerializedVolunteer[]>([]);
  const [events, setEvents] = useState<SerializedEvent[]>([]);
  const [roles, setRoles] = useState<RoleSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const now = new Date();
    const [ministriesRes, volunteersRes, eventsRes] = await Promise.all([
      listMinistriesAction(),
      listVolunteersAction({ ministryId }),
      listScheduleEventsAction({
        ministryId,
        from: now.toISOString(),
        limit: 8,
      }),
    ]);

    if (!ministriesRes.ok) {
      setError(ministriesRes.error);
      setLoading(false);
      return;
    }

    const found = ministriesRes.data.find((m) => m.id === ministryId);
    if (!found) {
      setError("Ministry not found");
      setLoading(false);
      return;
    }

    if (!volunteersRes.ok) {
      setError(volunteersRes.error);
      setLoading(false);
      return;
    }
    if (!eventsRes.ok) {
      setError(eventsRes.error);
      setLoading(false);
      return;
    }

    const serializedEvents = JSON.parse(
      JSON.stringify(eventsRes.data)
    ) as SerializedEvent[];

    let derivedRoles: RoleSummary[] = [];
    if (serializedEvents.length > 0) {
      const boardRes = await getSchedulerBoardAction({
        eventId: serializedEvents[0].id,
      });
      if (boardRes.ok) {
        const seen = new Map<string, RoleSummary>();
        for (const slot of boardRes.data.slots) {
          if (slot.roleId && slot.roleName) {
            seen.set(slot.roleId, {
              id: slot.roleId,
              name: slot.roleName,
              slotsNeeded: slot.needed,
              description: null,
            });
          }
        }
        derivedRoles = Array.from(seen.values());
      }
    }

    setMinistry(JSON.parse(JSON.stringify(found)) as SerializedMinistry);
    setVolunteers(
      JSON.parse(JSON.stringify(volunteersRes.data)) as SerializedVolunteer[]
    );
    setEvents(serializedEvents);
    setRoles(derivedRoles);
    setError(null);
    setLoading(false);
  }, [ministryId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <LoadingState label="Loading ministry…" />;
  if (error || !ministry)
    return (
      <ErrorState
        description={error ?? "Unable to load ministry"}
        onRetry={() => {
          setLoading(true);
          load();
        }}
      />
    );

  return (
    <div className="space-y-6 lg:space-y-7">
      <FadeIn>
        <div className="relative overflow-hidden rounded-[2rem] glass-strong p-6 sm:p-8">
          <div
            className="pointer-events-none absolute inset-0 opacity-20"
            style={{
              background: `linear-gradient(135deg, ${ministry.color} 0%, transparent 60%)`,
            }}
          />
          <div className="relative space-y-4">
            <Button variant="ghost" size="sm" asChild className="-ml-2">
              <Link href="/ministries">
                <ArrowLeft className="h-4 w-4" />
                Ministries
              </Link>
            </Button>
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-4">
                <div
                  className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-2xl font-semibold text-white shadow-[var(--shadow-soft)]"
                  style={{ backgroundColor: ministry.color }}
                >
                  {ministry.name.charAt(0)}
                </div>
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                      {ministry.name}
                    </h1>
                    <Badge variant={ministryStatusVariant(ministry.status)}>
                      {MINISTRY_STATUS_LABELS[ministry.status]}
                    </Badge>
                  </div>
                  {ministry.description && (
                    <p className="max-w-2xl text-muted-foreground">
                      {ministry.description}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Badge variant="outline">
                      {ministry.roleCount ?? roles.length} roles
                    </Badge>
                    <Badge variant="outline">
                      {volunteers.length} volunteers
                    </Badge>
                    <Badge variant="outline">{events.length} upcoming</Badge>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="glow" size="lg" asChild>
                  <Link href={`/schedule?ministry=${ministry.id}`}>
                    <CalendarClock className="h-4 w-4" />
                    Schedule team
                  </Link>
                </Button>
                <Button variant="glass" size="lg" asChild>
                  <Link href="/volunteers">
                    <Users className="h-4 w-4" />
                    Roster
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </FadeIn>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="space-y-4 lg:col-span-1">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
            <Wrench className="h-4 w-4 text-primary" />
            Roles
          </h2>
          <div className="space-y-3">
            {roles.length === 0 ? (
              <div className="glass rounded-[1.5rem] p-5 text-sm text-muted-foreground">
                {ministry.roleCount
                  ? `${ministry.roleCount} roles configured. Create a schedule event to see role slots.`
                  : "No roles yet. Ensure default ministries to seed roles."}
              </div>
            ) : (
              roles.map((role, i) => (
                <motion.div
                  key={role.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass rounded-[1.5rem] p-4"
                >
                  <p className="font-medium">{role.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {role.slotsNeeded} slot{role.slotsNeeded !== 1 ? "s" : ""} typical
                  </p>
                </motion.div>
              ))
            )}
          </div>
        </section>

        <section className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between gap-4">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
              <Users className="h-4 w-4 text-primary" />
              Volunteers
            </h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/volunteers">View all</Link>
            </Button>
          </div>
          {volunteers.length === 0 ? (
            <div className="glass rounded-[1.5rem] p-6 text-sm text-muted-foreground">
              No volunteers linked to this ministry yet. Add ministry preferences on
              volunteer profiles.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {volunteers.slice(0, 8).map((volunteer) => (
                <Link
                  key={volunteer.id}
                  href={`/volunteers/${volunteer.id}`}
                  className="group flex items-center gap-3 rounded-[1.5rem] glass p-4 transition-all hover-lift"
                >
                  <Avatar className="h-10 w-10 rounded-xl">
                    {volunteer.member.avatarUrl && (
                      <AvatarImage src={volunteer.member.avatarUrl} alt="" />
                    )}
                    <AvatarFallback className="rounded-xl text-xs">
                      {getInitials(
                        volunteer.member.firstName,
                        volunteer.member.lastName
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium group-hover:text-primary">
                      {volunteer.displayName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {volunteer.upcomingAssignmentCount} upcoming
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
            <CalendarClock className="h-4 w-4 text-primary" />
            Upcoming schedule
          </h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/schedule?ministry=${ministry.id}`}>Open scheduler</Link>
          </Button>
        </div>
        {events.length === 0 ? (
          <div className="glass rounded-[1.5rem] p-6 text-sm text-muted-foreground">
            No upcoming events. Create one from the schedule board.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {events.map((event, i) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Link
                  href={`/schedule?event=${event.id}`}
                  className="group block rounded-[1.5rem] glass p-5 transition-all hover-lift"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium group-hover:text-primary">
                        {event.title}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatMinistryDateTime(event.startsAt)}
                      </p>
                    </div>
                    <Badge variant="outline">
                      {SCHEDULE_EVENT_TYPE_LABELS[event.eventType]}
                    </Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {event.location && (
                      <Badge variant="muted">{event.location}</Badge>
                    )}
                    {event.neededSlots != null && (
                      <Badge variant="outline">
                        {event.filledSlots ?? 0}/{event.neededSlots} filled
                      </Badge>
                    )}
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
