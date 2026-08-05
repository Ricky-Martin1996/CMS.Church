"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { listVolunteersAction } from "@/application/ministries/actions";
import { FadeIn } from "@/components/motion/page-transition";
import { ErrorState, LoadingState } from "@/components/shared/states";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  getInitials,
  reliabilityTone,
  trainingStatusVariant,
} from "@/components/volunteers/utils";
import type { VolunteerListItem } from "@/domain/entities/ministry";
import { TRAINING_STATUS_LABELS } from "@/domain/enums/ministry";
import { cn, formatNumber } from "@/lib/utils";

type SerializedVolunteer = Omit<
  VolunteerListItem,
  "createdAt" | "updatedAt"
> & {
  createdAt: string;
  updatedAt: string;
};

function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function VolunteersView() {
  const [volunteers, setVolunteers] = useState<SerializedVolunteer[]>([]);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (search?: string) => {
    const res = await listVolunteersAction({
      query: search?.trim() || undefined,
      limit: 200,
    });

    if (!res.ok) {
      setError(res.error);
      setLoading(false);
      return;
    }

    setVolunteers(
      JSON.parse(JSON.stringify(res.data)) as SerializedVolunteer[]
    );
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    setLoading(true);
    load(debouncedQuery);
  }, [debouncedQuery, load]);

  if (loading && volunteers.length === 0)
    return <LoadingState label="Loading volunteers…" />;
  if (error)
    return (
      <ErrorState
        description={error}
        onRetry={() => {
          setLoading(true);
          load(debouncedQuery);
        }}
      />
    );

  const activeCount = volunteers.filter((v) => v.isActive).length;
  const avgReliability =
    volunteers.length > 0
      ? volunteers.reduce((s, v) => s + v.reliabilityScore, 0) / volunteers.length
      : 0;

  return (
    <div className="space-y-6 lg:space-y-7">
      <FadeIn>
        <div className="relative overflow-hidden rounded-[2rem] glass-strong p-6 sm:p-8">
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-2">
              <p className="text-sm font-medium text-primary">Volunteer roster</p>
              <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-5xl">
                Volunteers
              </h1>
              <p className="max-w-xl text-muted-foreground text-balance">
                Searchable roster with training status, reliability scores, and
                upcoming assignments.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-sm">
              <div className="glass rounded-2xl px-4 py-3">
                <p className="text-muted-foreground">Active</p>
                <p className="font-display text-2xl font-semibold">
                  {formatNumber(activeCount)}
                </p>
              </div>
              <div className="glass rounded-2xl px-4 py-3">
                <p className="text-muted-foreground">Avg reliability</p>
                <p className="font-display text-2xl font-semibold">
                  {Math.round(avgReliability)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </FadeIn>

      <div className="relative">
        <Search
          className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or email…"
          className="h-12 rounded-2xl pl-11"
          aria-label="Search volunteers"
        />
      </div>

      {volunteers.length === 0 ? (
        <div className="glass rounded-[1.75rem] p-10 text-center text-muted-foreground">
          {debouncedQuery
            ? "No volunteers match your search."
            : "No volunteer profiles yet. Add profiles from People or ministry setup."}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {volunteers.map((volunteer, i) => (
            <motion.div
              key={volunteer.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
            >
              <Link
                href={`/volunteers/${volunteer.id}`}
                className="group flex gap-4 rounded-[1.75rem] glass p-5 transition-all hover-lift"
              >
                <Avatar className="h-12 w-12 shrink-0 rounded-2xl">
                  {volunteer.member.avatarUrl && (
                    <AvatarImage src={volunteer.member.avatarUrl} alt="" />
                  )}
                  <AvatarFallback className="rounded-2xl text-sm">
                    {getInitials(
                      volunteer.member.firstName,
                      volunteer.member.lastName
                    )}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate font-medium group-hover:text-primary">
                      {volunteer.displayName}
                    </p>
                    <Badge variant={volunteer.isActive ? "success" : "muted"}>
                      {volunteer.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  {volunteer.member.email && (
                    <p className="truncate text-sm text-muted-foreground">
                      {volunteer.member.email}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={trainingStatusVariant(volunteer.trainingStatus)}>
                      {TRAINING_STATUS_LABELS[volunteer.trainingStatus]}
                    </Badge>
                    {volunteer.primaryMinistry && (
                      <Badge variant="outline">{volunteer.primaryMinistry}</Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span
                      className={cn(
                        "font-medium",
                        reliabilityTone(volunteer.reliabilityScore)
                      )}
                    >
                      {volunteer.reliabilityScore}% reliable
                    </span>
                    <span className="text-muted-foreground">
                      {volunteer.upcomingAssignmentCount} upcoming
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
