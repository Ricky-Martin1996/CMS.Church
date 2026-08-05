"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  delta,
  icon: Icon,
  delay = 0,
  spark,
}: {
  label: string;
  value: string;
  delta?: string;
  icon: LucideIcon;
  delay?: number;
  spark?: number[];
}) {
  const positive = delta?.startsWith("+");

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      className="group relative overflow-hidden glass rounded-[1.75rem] hover-lift"
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/10 blur-2xl transition-opacity group-hover:opacity-100" />
      <div className="relative flex items-start justify-between gap-4 p-5 sm:p-6">
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            {value}
          </p>
          {delta && (
            <p
              className={cn(
                "inline-flex items-center rounded-xl px-2 py-0.5 text-xs font-medium",
                positive
                  ? "bg-success/12 text-success"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {delta} vs last month
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/12 text-primary shadow-[var(--shadow-glow)]">
            <Icon className="h-5 w-5" aria-hidden />
          </div>
          {spark && (
            <svg
              width="72"
              height="28"
              viewBox="0 0 72 28"
              className="text-primary"
              aria-hidden
            >
              <polyline
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={spark
                  .map((v, i) => {
                    const x = (i / (spark.length - 1)) * 72;
                    const y = 26 - (v / Math.max(...spark)) * 22;
                    return `${x},${y}`;
                  })
                  .join(" ")}
              />
            </svg>
          )}
        </div>
      </div>
    </motion.div>
  );
}
