"use client";

import { motion } from "framer-motion";
import { Plus, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { FadeIn, StaggerChildren, staggerItem } from "@/components/motion/page-transition";
import { groups } from "@/lib/data";

export function GroupsView() {
  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-primary">Community</p>
            <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Groups
            </h1>
            <p className="max-w-lg text-muted-foreground">
              Life groups that make belonging tangible — woven across campuses.
            </p>
          </div>
          <Button variant="glow">
            <Plus className="h-4 w-4" />
            New group
          </Button>
        </div>
      </FadeIn>

      <FadeIn delay={0.08}>
        <div className="relative overflow-hidden rounded-[2rem] glass-strong p-6 sm:p-8">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,hsl(var(--primary)/0.18),transparent_45%),radial-gradient(circle_at_80%_60%,hsl(var(--chart-2)/0.15),transparent_40%)]" />
          <div className="relative grid gap-6 sm:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Active groups</p>
              <p className="mt-1 font-display text-4xl font-semibold">{groups.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">People in groups</p>
              <p className="mt-1 font-display text-4xl font-semibold">
                {groups.reduce((sum, g) => sum + g.members, 0)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg. size</p>
              <p className="mt-1 font-display text-4xl font-semibold">
                {Math.round(
                  groups.reduce((sum, g) => sum + g.members, 0) / groups.length
                )}
              </p>
            </div>
          </div>
        </div>
      </FadeIn>

      <StaggerChildren className="grid gap-4 sm:grid-cols-2">
        {groups.map((group, index) => {
          const initials = group.leader
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2);
          return (
            <motion.article
              key={group.id}
              variants={staggerItem}
              className={`relative overflow-hidden glass rounded-[1.75rem] p-6 hover-lift ${
                index === 0 ? "sm:col-span-2 sm:grid sm:grid-cols-[1.2fr_1fr] sm:gap-8" : ""
              }`}
            >
              <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
              <div className="relative flex flex-col gap-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/12 text-primary shadow-[var(--shadow-glow)]">
                      <UsersRound className="h-5 w-5" aria-hidden />
                    </div>
                    <div>
                      <h2 className="font-display text-xl font-semibold">
                        {group.name}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Meets {group.day}s
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">{group.campus}</Badge>
                </div>

                <div className="flex items-center justify-between border-t border-border/50 pt-4">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-xs text-muted-foreground">Leader</p>
                      <p className="text-sm font-medium">{group.leader}</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-display text-lg font-semibold text-foreground">
                      {group.members}
                    </span>{" "}
                    members
                  </p>
                </div>
              </div>

              {index === 0 && (
                <div className="relative mt-4 hidden rounded-[1.5rem] border border-border/50 bg-background/35 p-5 sm:mt-0 sm:block">
                  <p className="text-xs font-medium text-primary">Spotlight</p>
                  <p className="mt-2 font-display text-lg font-semibold">
                    Highest engagement this month
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    92% attendance across the last four gatherings — a quiet
                    model for healthy community.
                  </p>
                </div>
              )}
            </motion.article>
          );
        })}
      </StaggerChildren>
    </div>
  );
}
