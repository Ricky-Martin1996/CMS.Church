"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  delta,
  icon: Icon,
  delay = 0,
}: {
  label: string;
  value: string;
  delta?: string;
  icon: LucideIcon;
  delay?: number;
}) {
  const positive = delta?.startsWith("+");

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card className="overflow-hidden">
        <CardContent className="flex items-start justify-between gap-4 p-5 sm:p-6">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              {value}
            </p>
            {delta && (
              <p
                className={cn(
                  "text-xs font-medium",
                  positive ? "text-success" : "text-muted-foreground"
                )}
              >
                {delta} vs last month
              </p>
            )}
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Icon className="h-5 w-5" aria-hidden />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
