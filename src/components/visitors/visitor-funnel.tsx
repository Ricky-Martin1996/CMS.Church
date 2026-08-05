"use client";

import { motion } from "framer-motion";
import type { VisitorFunnelStage } from "@/domain/entities/visitor-journey";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/utils";

export function VisitorFunnel({
  stages,
  className,
}: {
  stages: VisitorFunnelStage[];
  className?: string;
}) {
  const sorted = [...stages].sort((a, b) => a.sortOrder - b.sortOrder);
  const maxCount = Math.max(...sorted.map((s) => s.count), 1);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch">
        {sorted.map((stage, index) => {
          const widthPct = Math.max(12, (stage.count / maxCount) * 100);
          const isLast = index === sorted.length - 1;

          return (
            <div key={stage.stage} className="flex min-w-0 flex-1 items-center gap-2">
              <motion.div
                initial={{ opacity: 0, scaleX: 0.6 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.06,
                  ease: [0.22, 1, 0.36, 1],
                }}
                style={{ flexBasis: `${widthPct}%` }}
                className="group relative min-h-[5.5rem] flex-1 overflow-hidden rounded-2xl border border-border/50 bg-background/40 p-4 transition-colors hover:border-primary/30"
              >
                <div
                  className="pointer-events-none absolute inset-y-0 left-0 bg-primary/10 transition-all group-hover:bg-primary/15"
                  style={{ width: `${widthPct}%` }}
                />
                <div className="relative space-y-1">
                  <p className="truncate text-xs font-medium text-muted-foreground">
                    {stage.label}
                  </p>
                  <p className="font-display text-2xl font-semibold tracking-tight">
                    {formatNumber(stage.count)}
                  </p>
                </div>
              </motion.div>
              {!isLast && (
                <span
                  className="hidden shrink-0 text-muted-foreground/40 lg:inline"
                  aria-hidden
                >
                  →
                </span>
              )}
            </div>
          );
        })}
      </div>
      <ol className="flex flex-wrap gap-2 lg:hidden" aria-label="Visitor funnel">
        {sorted.map((stage) => (
          <li
            key={stage.stage}
            className="rounded-xl border border-border/50 bg-background/35 px-3 py-1.5 text-xs"
          >
            <span className="text-muted-foreground">{stage.label}</span>
            <span className="ml-2 font-medium">{formatNumber(stage.count)}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
