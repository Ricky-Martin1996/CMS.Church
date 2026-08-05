"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  CalendarDays,
  HeartHandshake,
  LayoutDashboard,
  Settings,
  Users,
  UsersRound,
  Plus,
  Search,
  type LucideIcon,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { navItems, people, events } from "@/lib/data";

const icons: Record<(typeof navItems)[number]["icon"], LucideIcon> = {
  LayoutDashboard,
  Users,
  CalendarDays,
  HeartHandshake,
  UsersRound,
  Settings,
};

const actions = [
  { name: "Add person", href: "/people", icon: Plus },
  { name: "Create event", href: "/events", icon: Plus },
  { name: "Record gift", href: "/giving", icon: Plus },
];

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  React.useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const go = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  const peopleHits = people
    .filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 4);
  const eventHits = events
    .filter((e) => e.title.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 3);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="overflow-hidden p-0 sm:max-w-xl"
        showClose={false}
      >
        <DialogTitle className="sr-only">Command palette</DialogTitle>
        <Command className="bg-transparent" label="Command palette">
          <div className="flex items-center gap-3 border-b border-border/60 px-4">
            <Search className="h-4 w-4 text-muted-foreground" aria-hidden />
            <Command.Input
              value={query}
              onValueChange={setQuery}
              placeholder="Search people, events, pages…"
              className="h-14 w-full bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
            />
            <kbd className="hidden rounded-lg border border-border bg-muted/80 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline-block">
              ESC
            </kbd>
          </div>
          <Command.List className="max-h-[min(420px,60vh)] overflow-y-auto p-2">
            <Command.Empty className="py-10 text-center text-sm text-muted-foreground">
              No results{query ? ` for “${query}”` : ""}
            </Command.Empty>

            <Command.Group
              heading="Navigate"
              className="[&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-muted-foreground"
            >
              {navItems.map((page) => {
                const Icon = icons[page.icon];
                return (
                  <Command.Item
                    key={page.href}
                    value={`${page.label} ${page.href}`}
                    onSelect={() => go(page.href)}
                    className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm aria-selected:bg-accent data-[selected=true]:bg-accent"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="font-medium">{page.label}</span>
                  </Command.Item>
                );
              })}
            </Command.Group>

            {(peopleHits.length > 0 || !query) && query && peopleHits.length > 0 && (
              <Command.Group
                heading="People"
                className="mt-2 [&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-muted-foreground"
              >
                {peopleHits.map((person) => (
                  <Command.Item
                    key={person.id}
                    value={`person ${person.name} ${person.email}`}
                    onSelect={() => go("/people")}
                    className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm data-[selected=true]:bg-accent"
                  >
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="truncate font-medium">{person.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {person.role}
                      </p>
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {query && eventHits.length > 0 && (
              <Command.Group
                heading="Events"
                className="mt-2 [&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-muted-foreground"
              >
                {eventHits.map((event) => (
                  <Command.Item
                    key={event.id}
                    value={`event ${event.title}`}
                    onSelect={() => go("/events")}
                    className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm data-[selected=true]:bg-accent"
                  >
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{event.title}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            <Command.Group
              heading="Quick actions"
              className="mt-2 [&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-muted-foreground"
            >
              {actions.map((action) => (
                <Command.Item
                  key={action.name}
                  value={action.name}
                  onSelect={() => go(action.href)}
                  className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm data-[selected=true]:bg-accent"
                >
                  <action.icon className="h-4 w-4 text-muted-foreground" />
                  {action.name}
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
