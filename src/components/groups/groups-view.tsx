"use client";

import { motion } from "framer-motion";
import { Plus, UsersRound } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
          <div className="space-y-1">
            <h1 className="font-display text-3xl font-semibold tracking-tight">
              Groups
            </h1>
            <p className="text-muted-foreground">
              Life groups and communities that make belonging tangible.
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4" />
            New group
          </Button>
        </div>
      </FadeIn>

      <StaggerChildren className="grid gap-4 sm:grid-cols-2">
        {groups.map((group) => {
          const initials = group.leader
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2);
          return (
            <motion.div key={group.id} variants={staggerItem}>
              <Card className="h-full transition-shadow hover:shadow-[var(--shadow-float)]">
                <CardContent className="flex flex-col gap-5 p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <UsersRound className="h-5 w-5" aria-hidden />
                      </div>
                      <div>
                        <h2 className="font-display text-lg font-semibold">
                          {group.name}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          Meets {group.day}s
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">{group.campus}</Badge>
                  </div>

                  <div className="flex items-center justify-between border-t border-border/60 pt-4">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-xs text-muted-foreground">Leader</p>
                        <p className="text-sm font-medium">{group.leader}</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {group.members}
                      </span>{" "}
                      members
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </StaggerChildren>
    </div>
  );
}
