"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  CalendarDays,
  HeartHandshake,
  LayoutDashboard,
  Settings,
  Users,
  UsersRound,
  Church,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { navItems } from "@/lib/data";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

const icons: Record<(typeof navItems)[number]["icon"], LucideIcon> = {
  LayoutDashboard,
  Users,
  CalendarDays,
  HeartHandshake,
  UsersRound,
  Settings,
};

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 flex-col glass-strong rounded-3xl">
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
          <Church className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <p className="font-display text-base font-semibold tracking-tight">
            ChurchOS
          </p>
          <p className="text-xs text-muted-foreground">Grace Community</p>
        </div>
      </div>

      <Separator className="opacity-60" />

      <ScrollArea className="flex-1 px-3 py-4">
        <nav aria-label="Primary" className="space-y-1">
          {navItems.map((item) => {
            const Icon = icons[item.icon];
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                )}
              >
                {active && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-0 rounded-2xl bg-primary/10"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                <Icon className="relative z-10 h-4 w-4" aria-hidden />
                <span className="relative z-10">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      <div className="m-3 rounded-2xl bg-primary/8 p-4 dark:bg-primary/15">
        <p className="text-xs font-medium text-primary">Sunday service</p>
        <p className="mt-1 text-sm font-display font-semibold">
          Aug 9 · 10:00 AM
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          842 expected · Main Sanctuary
        </p>
      </div>
    </aside>
  );
}
