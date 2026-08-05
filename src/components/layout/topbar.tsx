"use client";

import { Bell, Menu, Search } from "lucide-react";
import { motion } from "framer-motion";
import { UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { AccentPicker } from "@/components/layout/accent-picker";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function Topbar({
  onMenuClick,
  onCommandOpen,
  onNotificationsOpen,
  unreadCount,
}: {
  onMenuClick: () => void;
  onCommandOpen: () => void;
  onNotificationsOpen: () => void;
  unreadCount: number;
}) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="glass-strong sticky top-0 z-30 flex h-[68px] items-center gap-3 rounded-[1.75rem] px-3 sm:px-4"
    >
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
        className="group relative flex h-11 flex-1 items-center gap-3 overflow-hidden rounded-2xl border border-border/50 bg-background/35 px-3.5 text-left text-sm text-muted-foreground transition-all hover:border-primary/25 hover:bg-background/55 hover:shadow-[var(--shadow-glow)] sm:max-w-xl"
        aria-label="Open spotlight search"
      >
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
        <Search className="relative h-4 w-4 shrink-0" aria-hidden />
        <span className="relative flex-1 truncate">
          Spotlight search — people, events, giving…
        </span>
        <kbd className="relative hidden rounded-lg border border-border bg-muted/80 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline-block">
          ⌘K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        <div className="hidden md:block">
          <AccentPicker />
        </div>

        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="relative"
                onClick={onNotificationsOpen}
                aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary))]" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Notifications</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <ThemeToggle />

        <div className="ml-1 flex items-center">
          <UserButton
            appearance={{
              elements: {
                avatarBox: "h-8 w-8 rounded-xl",
              },
            }}
          />
        </div>
      </div>
    </motion.header>
  );
}
