"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Users, UserPlus, Home, HeartHandshake } from "lucide-react";
import type { SessionLiveStats } from "@/domain/entities/attendance";
import { formatNumber } from "@/lib/utils";
import { cn } from "@/lib/utils";

function AnimatedCounter({ value }: { value: number }) {
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    if (reduce) {
      setDisplay(value);
      return;
    }
    const start = display;
    const diff = value - start;
    if (diff === 0) return;
    const duration = 400;
    const startTime = performance.now();
    let frame: number;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + diff * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, reduce]);

  return (
    <motion.span
      key={value}
      initial={reduce ? false : { scale: 1.05 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.2 }}
      className="tabular-nums"
    >
      {formatNumber(display)}
    </motion.span>
  );
}

function StatPill({
  label,
  value,
  icon: Icon,
  highlight,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1 rounded-2xl px-4 py-3",
        highlight ? "bg-primary/12" : "bg-muted/40"
      )}
    >
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" aria-hidden />
        {label}
      </div>
      <p
        className={cn(
          "font-display text-2xl font-semibold tracking-tight sm:text-3xl",
          highlight && "text-primary"
        )}
      >
        <AnimatedCounter value={value} />
      </p>
    </div>
  );
}

export function LiveStatsHeader({
  stats,
  serviceName,
  className,
}: {
  stats: SessionLiveStats;
  serviceName?: string;
  className?: string;
}) {
  const presentTotal = stats.presentCount + stats.visitorCount;
  const expected = stats.expectedCount;

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          {serviceName && (
            <p className="text-sm font-medium text-primary">{serviceName}</p>
          )}
          <p className="font-display text-5xl font-semibold tracking-tight sm:text-6xl">
            <AnimatedCounter value={presentTotal} />
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            checked in
            {expected != null && (
              <>
                {" "}
                ·{" "}
                <span className="text-foreground">
                  {Math.round((presentTotal / Math.max(expected, 1)) * 100)}%
                </span>{" "}
                of {formatNumber(expected)} expected
              </>
            )}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <StatPill
          label="Members"
          value={stats.presentCount}
          icon={Users}
          highlight
        />
        <StatPill label="Visitors" value={stats.visitorCount} icon={UserPlus} />
        <StatPill
          label="First-time"
          value={stats.firstTimeVisitors}
          icon={UserPlus}
        />
        <StatPill
          label="Returning"
          value={stats.returningVisitors}
          icon={Users}
        />
        <StatPill
          label="Families"
          value={stats.householdCount}
          icon={Home}
        />
        <StatPill
          label="Volunteers"
          value={stats.volunteerCount}
          icon={HeartHandshake}
        />
      </div>
    </div>
  );
}
