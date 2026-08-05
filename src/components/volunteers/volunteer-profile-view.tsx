"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Clock,
  Loader2,
  Mail,
  Phone,
} from "lucide-react";
import {
  getSchedulerBoardAction,
  getVolunteerProfileAction,
  listScheduleEventsAction,
  volunteerCheckInAction,
} from "@/application/ministries/actions";
import { FadeIn } from "@/components/motion/page-transition";
import { ErrorState, LoadingState } from "@/components/shared/states";
import { VolunteerMessageForm } from "@/components/volunteers/volunteer-message-form";
import {
  formatVolunteerDateTime,
  getInitials,
  reliabilityTone,
  trainingStatusVariant,
  WEEKDAY_LABELS,
} from "@/components/volunteers/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
  ScheduleAssignmentEntity,
  VolunteerProfileEntity,
} from "@/domain/entities/ministry";
import {
  ASSIGNMENT_STATUS_LABELS,
  TRAINING_STATUS_LABELS,
  VolunteerCheckInStatus,
} from "@/domain/enums/ministry";
import { cn, formatNumber } from "@/lib/utils";
import { subMonths, addMonths } from "date-fns";

type SerializedProfile = Omit<
  VolunteerProfileEntity,
  "createdAt" | "updatedAt"
> & {
  createdAt: string;
  updatedAt: string;
};

type SerializedAssignment = Omit<
  ScheduleAssignmentEntity,
  "assignedAt" | "respondedAt" | "createdAt" | "updatedAt"
> & {
  assignedAt: string;
  respondedAt: string | null;
  createdAt: string;
  updatedAt: string;
  slot?: {
    id: string;
    title: string;
    startsAt: string;
    endsAt: string | null;
  };
  event?: { id: string; title: string; startsAt: string };
};

export function VolunteerProfileView({ volunteerId }: { volunteerId: string }) {
  const [profile, setProfile] = useState<SerializedProfile | null>(null);
  const [assignments, setAssignments] = useState<SerializedAssignment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkInPending, startCheckIn] = useTransition();

  const loadAssignments = useCallback(async () => {
    const now = new Date();
    const eventsRes = await listScheduleEventsAction({
      from: subMonths(now, 3).toISOString(),
      to: addMonths(now, 3).toISOString(),
      limit: 30,
    });

    if (!eventsRes.ok) return [];

    const collected: SerializedAssignment[] = [];
    for (const event of eventsRes.data) {
      const boardRes = await getSchedulerBoardAction({ eventId: event.id });
      if (!boardRes.ok) continue;

      for (const slot of boardRes.data.slots) {
        for (const assignment of slot.assignments) {
          if (assignment.volunteerId === volunteerId) {
            collected.push(
              JSON.parse(JSON.stringify(assignment)) as SerializedAssignment
            );
          }
        }
      }
    }

    return collected.sort(
      (a, b) =>
        new Date(b.slot?.startsAt ?? b.assignedAt).getTime() -
        new Date(a.slot?.startsAt ?? a.assignedAt).getTime()
    );
  }, [volunteerId]);

  const load = useCallback(async () => {
    const profileRes = await getVolunteerProfileAction(volunteerId);

    if (!profileRes.ok) {
      setError(profileRes.error);
      setLoading(false);
      return;
    }

    const assignmentList = await loadAssignments();

    setProfile(JSON.parse(JSON.stringify(profileRes.data)) as SerializedProfile);
    setAssignments(assignmentList);
    setError(null);
    setLoading(false);
  }, [volunteerId, loadAssignments]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCheckIn = (status: VolunteerCheckInStatus) => {
    startCheckIn(async () => {
      const res = await volunteerCheckInAction({
        volunteerId,
        status,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      await load();
    });
  };

  if (loading) return <LoadingState label="Loading volunteer…" />;
  if (error || !profile)
    return (
      <ErrorState
        description={error ?? "Unable to load volunteer"}
        onRetry={() => {
          setLoading(true);
          load();
        }}
      />
    );

  const upcoming = assignments.filter(
    (a) => new Date(a.slot?.startsAt ?? a.assignedAt) >= new Date()
  );
  const past = assignments.filter(
    (a) => new Date(a.slot?.startsAt ?? a.assignedAt) < new Date()
  );

  return (
    <div className="space-y-6 lg:space-y-7">
      <FadeIn>
        <div className="relative overflow-hidden rounded-[2rem] glass-strong p-6 sm:p-8">
          <div className="relative space-y-4">
            <Button variant="ghost" size="sm" asChild className="-ml-2">
              <Link href="/volunteers">
                <ArrowLeft className="h-4 w-4" />
                Volunteers
              </Link>
            </Button>
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16 rounded-2xl">
                  {profile.member.avatarUrl && (
                    <AvatarImage src={profile.member.avatarUrl} alt="" />
                  )}
                  <AvatarFallback className="rounded-2xl text-lg">
                    {getInitials(
                      profile.member.firstName,
                      profile.member.lastName
                    )}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                    {profile.member.firstName} {profile.member.lastName}
                  </h1>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={profile.isActive ? "success" : "muted"}>
                      {profile.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <Badge variant={trainingStatusVariant(profile.trainingStatus)}>
                      {TRAINING_STATUS_LABELS[profile.trainingStatus]}
                    </Badge>
                    <Badge variant="outline">
                      <span
                        className={cn(reliabilityTone(profile.reliabilityScore))}
                      >
                        {profile.reliabilityScore}% reliable
                      </span>
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    {profile.member.email && (
                      <span className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5" />
                        {profile.member.email}
                      </span>
                    )}
                    {profile.member.phone && (
                      <span className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5" />
                        {profile.member.phone}
                      </span>
                    )}
                    {profile.member.campus && (
                      <span>{profile.member.campus}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="glow"
                  size="lg"
                  onClick={() => handleCheckIn(VolunteerCheckInStatus.CHECKED_IN)}
                  disabled={checkInPending}
                >
                  {checkInPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  Check in
                </Button>
                <Button
                  variant="glass"
                  size="lg"
                  onClick={() => handleCheckIn(VolunteerCheckInStatus.LATE)}
                  disabled={checkInPending}
                >
                  <Clock className="h-4 w-4" />
                  Mark late
                </Button>
              </div>
            </div>
          </div>
        </div>
      </FadeIn>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="glass rounded-[1.5rem] p-5">
          <p className="text-sm text-muted-foreground">Total hours</p>
          <p className="font-display text-3xl font-semibold">
            {formatNumber(profile.totalHours)}
          </p>
        </div>
        <div className="glass rounded-[1.5rem] p-5">
          <p className="text-sm text-muted-foreground">Experience</p>
          <p className="font-display text-3xl font-semibold">
            {profile.experienceYears ?? 0} yrs
          </p>
        </div>
        <div className="glass rounded-[1.5rem] p-5">
          <p className="text-sm text-muted-foreground">Upcoming</p>
          <p className="font-display text-3xl font-semibold">
            {upcoming.length}
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="glass h-auto flex-wrap gap-1 rounded-2xl p-1">
          <TabsTrigger value="overview" className="rounded-xl px-4 py-2">
            Overview
          </TabsTrigger>
          <TabsTrigger value="schedule" className="rounded-xl px-4 py-2">
            Schedule
          </TabsTrigger>
          <TabsTrigger value="message" className="rounded-xl px-4 py-2">
            Message
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="glass rounded-[1.75rem] p-5 sm:p-6 space-y-4">
              <h2 className="font-display text-lg font-semibold">Skills</h2>
              {profile.skills.length === 0 ? (
                <p className="text-sm text-muted-foreground">No skills listed</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill) => (
                    <Badge key={skill.id} variant="outline">
                      {skill.name}
                      {skill.level ? ` · ${skill.level}` : ""}
                    </Badge>
                  ))}
                </div>
              )}
            </section>

            <section className="glass rounded-[1.75rem] p-5 sm:p-6 space-y-4">
              <h2 className="font-display text-lg font-semibold">Certifications</h2>
              {profile.certifications.length === 0 ? (
                <p className="text-sm text-muted-foreground">No certifications</p>
              ) : (
                <ul className="space-y-3">
                  {profile.certifications.map((cert) => (
                    <li
                      key={cert.id}
                      className="rounded-2xl border border-border/50 bg-background/35 p-3"
                    >
                      <p className="font-medium">{cert.name}</p>
                      {cert.issuer && (
                        <p className="text-sm text-muted-foreground">{cert.issuer}</p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="glass rounded-[1.75rem] p-5 sm:p-6 space-y-4">
              <h2 className="font-display text-lg font-semibold">Availability</h2>
              {profile.availabilities.length === 0 ? (
                <p className="text-sm text-muted-foreground">Not set</p>
              ) : (
                <ul className="space-y-2">
                  {profile.availabilities.map((a) => (
                    <li
                      key={a.id}
                      className="flex justify-between gap-2 text-sm rounded-xl px-3 py-2 bg-background/35"
                    >
                      <span className="font-medium">{WEEKDAY_LABELS[a.weekday]}</span>
                      <span className="text-muted-foreground">
                        {a.startTime} – {a.endTime}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="glass rounded-[1.75rem] p-5 sm:p-6 space-y-4">
              <h2 className="font-display text-lg font-semibold">Ministry preferences</h2>
              {profile.preferences.length === 0 ? (
                <p className="text-sm text-muted-foreground">No preferences</p>
              ) : (
                <ul className="space-y-2">
                  {profile.preferences.map((pref) => (
                    <li
                      key={pref.id}
                      className="flex items-center justify-between rounded-xl px-3 py-2 bg-background/35 text-sm"
                    >
                      <span>{pref.ministryName}</span>
                      <Badge variant="outline">Priority {pref.priority}</Badge>
                    </li>
                  ))}
                </ul>
              )}
              {profile.preferredService && (
                <p className="text-sm text-muted-foreground">
                  Preferred service: {profile.preferredService}
                </p>
              )}
            </section>
          </div>

          {profile.notes && (
            <section className="glass rounded-[1.75rem] p-5 sm:p-6">
              <h2 className="font-display text-lg font-semibold mb-2">Notes</h2>
              <p className="text-sm text-muted-foreground">{profile.notes}</p>
            </section>
          )}
        </TabsContent>

        <TabsContent value="schedule" className="space-y-6">
          <section className="space-y-3">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
              <CalendarClock className="h-4 w-4 text-primary" />
              Upcoming assignments
            </h2>
            {upcoming.length === 0 ? (
              <p className="glass rounded-[1.5rem] p-5 text-sm text-muted-foreground">
                No upcoming assignments
              </p>
            ) : (
              <ul className="space-y-3">
                {upcoming.map((a) => (
                  <li
                    key={a.id}
                    className="glass rounded-[1.5rem] p-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium">
                        {a.slot?.title ?? a.event?.title ?? "Assignment"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatVolunteerDateTime(a.slot?.startsAt ?? a.assignedAt)}
                      </p>
                    </div>
                    <Badge variant="outline">
                      {ASSIGNMENT_STATUS_LABELS[a.status]}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold">History</h2>
            {past.length === 0 ? (
              <p className="text-sm text-muted-foreground">No past assignments</p>
            ) : (
              <ul className="space-y-2">
                {past.slice(0, 10).map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between rounded-xl px-3 py-2 text-sm bg-muted/30"
                  >
                    <span>{a.slot?.title ?? a.event?.title}</span>
                    <span className="text-muted-foreground">
                      {formatVolunteerDateTime(a.slot?.startsAt ?? a.assignedAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </TabsContent>

        <TabsContent value="message">
          <section className="glass rounded-[1.75rem] p-5 sm:p-6 max-w-lg">
            <h2 className="font-display text-lg font-semibold mb-4">Send message</h2>
            <VolunteerMessageForm volunteerId={volunteerId} />
          </section>
        </TabsContent>
      </Tabs>
    </div>
  );
}
