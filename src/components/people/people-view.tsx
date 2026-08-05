"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EmptyState } from "@/components/shared/states";
import { FadeIn } from "@/components/motion/page-transition";
import { people } from "@/lib/data";
import { cn } from "@/lib/utils";

const statusVariant = {
  active: "success",
  visitor: "default",
  inactive: "muted",
} as const;

const filters = ["All", "Active", "Visitor", "Inactive"] as const;

export function PeopleView() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return people.filter((p) => {
      const matchesFilter =
        filter === "All" || p.status === filter.toLowerCase();
      const matchesQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        p.role.toLowerCase().includes(q) ||
        p.campus.toLowerCase().includes(q);
      return matchesFilter && matchesQuery;
    });
  }, [query, filter]);

  const featured = filtered.slice(0, 3);
  const rest = filtered.slice(3);

  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-primary">Directory</p>
            <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              People
            </h1>
            <p className="max-w-lg text-muted-foreground">
              Members, visitors, and ministry leaders — a calm map of belonging.
            </p>
          </div>
          <Button variant="glow">
            <Plus className="h-4 w-4" />
            Add person
          </Button>
        </div>
      </FadeIn>

      <FadeIn delay={0.08}>
        <div className="glass-strong flex flex-col gap-4 rounded-[1.75rem] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, role, campus…"
              className="h-11 border-border/50 bg-background/40 pl-9"
              aria-label="Search people"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded-xl px-3 py-1.5 text-xs font-medium transition-all",
                  filter === f
                    ? "bg-primary text-primary-foreground shadow-[var(--shadow-glow)]"
                    : "bg-background/40 text-muted-foreground hover:bg-accent"
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </FadeIn>

      {filtered.length === 0 ? (
        <div className="glass rounded-[1.75rem]">
          <EmptyState
            icon={Users}
            title="No people found"
            description="Try a different name, role, campus, or status filter."
            action={{
              label: "Clear filters",
              onClick: () => {
                setQuery("");
                setFilter("All");
              },
            }}
          />
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            {featured.map((person, i) => {
              const initials = person.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2);
              return (
                <motion.article
                  key={person.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                  className="group relative overflow-hidden glass rounded-[1.75rem] p-5 hover-lift"
                >
                  <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/15 blur-2xl transition-opacity group-hover:opacity-100" />
                  <div className="relative flex flex-col gap-4">
                    <Avatar className="h-14 w-14 rounded-[1.25rem]">
                      <AvatarFallback className="rounded-[1.25rem] text-base">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="font-display text-lg font-semibold">
                        {person.name}
                      </h2>
                      <p className="text-sm text-muted-foreground">{person.role}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{person.campus}</Badge>
                      <Badge variant={statusVariant[person.status]}>
                        {person.status}
                      </Badge>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {person.email}
                    </p>
                  </div>
                </motion.article>
              );
            })}
          </div>

          {rest.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass overflow-hidden rounded-[1.75rem]"
            >
              <ul className="divide-y divide-border/50" aria-label="People list">
                {rest.map((person) => {
                  const initials = person.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2);
                  return (
                    <li
                      key={person.id}
                      className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-accent/30 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar>
                          <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{person.name}</p>
                          <p className="truncate text-sm text-muted-foreground">
                            {person.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                        <span className="text-sm text-muted-foreground">
                          {person.role}
                        </span>
                        <Badge variant="outline">{person.campus}</Badge>
                        <Badge variant={statusVariant[person.status]}>
                          {person.status}
                        </Badge>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
