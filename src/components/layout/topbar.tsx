"use client";

import { Bell, Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function Topbar({
  onMenuClick,
  onCommandOpen,
}: {
  onMenuClick: () => void;
  onCommandOpen: () => void;
}) {
  return (
    <header className="glass sticky top-0 z-30 flex h-16 items-center gap-3 rounded-3xl px-3 sm:px-4">
      <Button
        variant="ghost"
        size="icon-sm"
        className="lg:hidden"
        onClick={onMenuClick}
        aria-label="Open navigation"
      >
        <Menu className="h-4 w-4" />
      </Button>

      <button
        type="button"
        onClick={onCommandOpen}
        className="flex h-10 flex-1 items-center gap-3 rounded-2xl border border-border/70 bg-background/40 px-3 text-left text-sm text-muted-foreground transition-colors hover:bg-background/70 sm:max-w-md"
        aria-label="Open command palette"
      >
        <Search className="h-4 w-4 shrink-0" aria-hidden />
        <span className="flex-1 truncate">Search people, events, giving…</span>
        <kbd className="hidden rounded-lg border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline-block">
          ⌘K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-1">
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Notifications">
                <Bell className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Notifications</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <ThemeToggle />
        <Avatar className="ml-1 h-9 w-9">
          <AvatarFallback>AP</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
