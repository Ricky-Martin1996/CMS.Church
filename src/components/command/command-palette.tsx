"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  CalendarDays,
  HeartHandshake,
  Home,
  LayoutDashboard,
  Settings,
  Users,
  UsersRound,
  Plus,
  Search,
  type LucideIcon,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { navItems } from "@/lib/data";

const icons: Record<(typeof navItems)[number]["icon"], LucideIcon> = {
  LayoutDashboard,
  Users,
  Home,
  CalendarDays,
  HeartHandshake,
  UsersRound,
  Settings,
};

const actions = [
  { name: "Add person", href: "/people", icon: Plus },
  { name: "Add household", href: "/households", icon: Home },
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 sm:max-w-lg" showClose={false}>
        <DialogTitle className="sr-only">Command palette</DialogTitle>
        <Command
          className="bg-transparent"
          label="Command palette"
          shouldFilter
        >
          <div className="flex items-center gap-2 border-b border-border px-4">
            <Search className="h-4 w-4 text-muted-foreground" aria-hidden />
            <Command.Input
              value={query}
              onValueChange={setQuery}
              placeholder="Jump to anything…"
              className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <kbd className="rounded-lg border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
              ESC
            </kbd>
          </div>
          <Command.List className="max-h-80 overflow-y-auto p-2">
            <Command.Empty className="py-8 text-center text-sm text-muted-foreground">
              No results for “{query}”
            </Command.Empty>
            <Command.Group
              heading="Navigate"
              className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground"
            >
              {navItems.map((page) => {
                const Icon = icons[page.icon];
                return (
                  <Command.Item
                    key={page.href}
                    value={page.label}
                    onSelect={() => go(page.href)}
                    className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm data-[selected=true]:bg-accent"
                  >
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    {page.label}
                  </Command.Item>
                );
              })}
            </Command.Group>
            <Command.Group
              heading="Quick actions"
              className="mt-2 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground"
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
