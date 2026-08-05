"use client";

import { Button } from "@/components/ui/button";
import { OrganizationSwitcher } from "@/components/auth/organization-switcher";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { navItems } from "@/lib/data";
import {
  CalendarDays,
  ChevronLeft,
  Church,
  HeartHandshake,
  LayoutDashboard,
  Settings,
  Users,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

const icons: Record<(typeof navItems)[number]["icon"], LucideIcon> = {
  LayoutDashboard,
  Users,
  CalendarDays,
  HeartHandshake,
  UsersRound,
  Settings,
};

export function Sidebar({
  collapsed,
  onToggle,
  onNavigate,
}: {
  collapsed: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 84 : 268 }}
      transition={{ type: "spring", stiffness: 320, damping: 34 }}
      className="relative flex h-full flex-col overflow-hidden glass-strong rounded-[1.75rem]"
    >
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-5",
          collapsed && "justify-center px-2"
        )}
      >
        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[var(--shadow-glow)]">
          <Church className="h-5 w-5" aria-hidden />
          <span className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-white/30 to-transparent" />
        </div>
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2 }}
              className="min-w-0"
            >
              <p className="font-display text-base font-semibold tracking-tight">
                ChurchOS
              </p>
              <p className="truncate text-xs text-muted-foreground">
                Grace Community
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Separator className="opacity-50" />

      <ScrollArea className="flex-1 py-4">
        <TooltipProvider delayDuration={0}>
          <nav
            aria-label="Primary"
            className={cn("space-y-1 px-3", collapsed && "px-2")}
          >
            {navItems.map((item) => {
              const Icon = icons[item.icon];
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);

              const link = (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors",
                    collapsed && "justify-center px-0 py-3",
                    active
                      ? "text-primary"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-0 rounded-2xl bg-primary/12 shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.12)]"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                  <Icon className="relative z-10 h-[18px] w-[18px]" aria-hidden />
                  <AnimatePresence initial={false}>
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        className="relative z-10 overflow-hidden whitespace-nowrap"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              );

              if (collapsed) {
                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>{link}</TooltipTrigger>
                    <TooltipContent side="right">{item.label}</TooltipContent>
                  </Tooltip>
                );
              }
              return link;
            })}
          </nav>
        </TooltipProvider>
      </ScrollArea>

      <div className={cn("p-3", collapsed && "px-2")}>
        <div className="mb-2">
          <OrganizationSwitcher collapsed={collapsed} />
        </div>
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="mb-3 rounded-2xl bg-primary/10 p-4 reflection"
            >
              <p className="text-xs font-medium text-primary">Sunday service</p>
              <p className="mt-1 font-display text-sm font-semibold">
                Aug 9 · 10:00 AM
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                842 expected · Main Sanctuary
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <Button
          variant="ghost"
          size={collapsed ? "icon" : "sm"}
          onClick={onToggle}
          className={cn("w-full", !collapsed && "justify-start")}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <motion.span
            animate={{ rotate: collapsed ? 180 : 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
          >
            <ChevronLeft className="h-4 w-4" />
          </motion.span>
          {!collapsed && <span>Collapse</span>}
        </Button>
      </div>
    </motion.aside>
  );
}
