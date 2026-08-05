"use client";

import { Bell, LogOut, Menu, Search, Settings, Sparkles, User } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { AccentPicker } from "@/components/layout/accent-picker";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { duration, easeOut } from "@/lib/motion";

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
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: duration.slow, ease: easeOut }}
      className="glass-strong sticky top-0 z-30 flex h-16 items-center gap-2 rounded-[1.5rem] px-2 sm:h-[68px] sm:gap-3 sm:px-4"
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
        className="group relative flex h-10 flex-1 items-center gap-2.5 overflow-hidden rounded-2xl border border-border/50 bg-background/35 px-3 text-left text-sm text-muted-foreground transition-all duration-200 hover:border-primary/20 hover:bg-background/55 hover:shadow-[var(--shadow-glow)] sm:h-11 sm:max-w-xl sm:gap-3 sm:px-3.5"
        aria-label="Open spotlight search"
      >
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
        <Search className="relative h-4 w-4 shrink-0" aria-hidden />
        <span className="relative flex-1 truncate">
          <span className="sm:hidden">Search…</span>
          <span className="hidden sm:inline">
            Spotlight search — people, events, giving…
          </span>
        </span>
        <kbd className="relative hidden rounded-lg border border-border bg-muted/80 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground md:inline-block">
          ⌘K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-1 sm:gap-1.5">
        <div className="hidden lg:block">
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

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="ml-0.5 flex items-center gap-2 rounded-2xl border border-border/50 bg-background/30 py-1 pl-1 pr-1 transition-colors hover:bg-background/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:pr-2.5"
              aria-label="Account menu"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">AP</AvatarFallback>
              </Avatar>
              <div className="hidden text-left sm:block">
                <p className="text-xs font-medium leading-none">Pastor Alex</p>
                <p className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Sparkles className="h-2.5 w-2.5 text-primary" aria-hidden />
                  Admin
                </p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>My account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <User className="h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <Settings className="h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive">
              <LogOut className="h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.header>
  );
}
