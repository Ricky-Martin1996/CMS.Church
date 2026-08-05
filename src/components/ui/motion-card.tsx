"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Motion-only card — isolated so static Card exports don't pull framer-motion
 * into every consumer of `@/components/ui/card`.
 */
export function MotionCard({
  children,
  className,
  delay = 0,
  elevate = true,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  elevate?: boolean;
}) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return (
      <div
        className={cn(
          "glass rounded-[1.75rem] text-card-foreground",
          elevate && "hover-lift",
          className
        )}
      >
        {children}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "glass rounded-[1.75rem] text-card-foreground",
        elevate && "hover-lift",
        className
      )}
    >
      {children}
    </motion.div>
  );
}
