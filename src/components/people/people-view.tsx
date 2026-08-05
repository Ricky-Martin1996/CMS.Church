"use client";

import { useMemo, useState } from "react";
import { Plus, Search, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EmptyState } from "@/components/shared/states";
import { FadeIn } from "@/components/motion/page-transition";
import { people } from "@/lib/data";

const statusVariant = {
  active: "success",
  visitor: "default",
  inactive: "muted",
} as const;

export function PeopleView() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return people;
    return people.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        p.role.toLowerCase().includes(q) ||
        p.campus.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <h1 className="font-display text-3xl font-semibold tracking-tight">
              People
            </h1>
            <p className="text-muted-foreground">
              Members, visitors, and ministry leaders across campuses.
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4" />
            Add person
          </Button>
        </div>
      </FadeIn>

      <FadeIn delay={0.08}>
        <Card>
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">Directory</CardTitle>
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search people…"
                className="pl-9"
                aria-label="Search people"
              />
            </div>
          </CardHeader>
          <CardContent>
            {filtered.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No people found"
                description="Try a different name, role, or campus."
                action={{ label: "Clear search", onClick: () => setQuery("") }}
              />
            ) : (
              <ul className="divide-y divide-border/60" aria-label="People directory">
                {filtered.map((person) => {
                  const initials = person.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2);
                  return (
                    <li
                      key={person.id}
                      className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
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
            )}
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}
