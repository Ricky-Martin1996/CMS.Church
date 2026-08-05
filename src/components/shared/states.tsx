"use client";

import { useReducedMotion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle2,
  Inbox,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { duration, easeOut } from "@/lib/motion";

export function LoadingState({
  label = "Loading…",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex flex-col items-center justify-center gap-4 px-6 py-16 text-muted-foreground",
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
        <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden />
      </div>
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn("glass overflow-hidden rounded-[1.5rem] p-6", className)}
      aria-hidden
    >
      <div className="skeleton-shimmer mb-4 h-3 w-1/3" />
      <div className="skeleton-shimmer mb-3 h-7 w-1/2" />
      <div className="skeleton-shimmer h-3 w-2/3" />
    </div>
  );
}

export function SkeletonRows({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3 p-4" aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="skeleton-shimmer h-10 w-10 rounded-2xl" />
          <div className="flex-1 space-y-2">
            <div className="skeleton-shimmer h-3 w-1/3" />
            <div className="skeleton-shimmer h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

function StateShell({
  children,
  className,
  role,
}: {
  children: React.ReactNode;
  className?: string;
  role?: React.AriaRole;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      role={role}
      initial={reduce ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: duration.base, ease: easeOut }}
      className={cn(
        "flex flex-col items-center justify-center gap-4 px-6 py-16 text-center",
        className
      )}
    >
      {children}
    </motion.div>
  );
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <StateShell>
      <div className="flex h-14 w-14 items-center justify-center rounded-[1.25rem] bg-muted text-muted-foreground ring-1 ring-border/60">
        <Icon className="h-6 w-6" aria-hidden />
      </div>
      <div className="space-y-1.5">
        <h3 className="font-display text-lg font-semibold tracking-tight">
          {title}
        </h3>
        <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
      {action && (
        <Button onClick={action.onClick} variant="secondary" className="mt-1">
          {action.label}
        </Button>
      )}
    </StateShell>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description = "We couldn’t load this section. Please try again.",
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <StateShell role="alert">
      <div className="flex h-14 w-14 items-center justify-center rounded-[1.25rem] bg-destructive/10 text-destructive ring-1 ring-destructive/20">
        <AlertCircle className="h-6 w-6" aria-hidden />
      </div>
      <div className="space-y-1.5">
        <h3 className="font-display text-lg font-semibold tracking-tight">
          {title}
        </h3>
        <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" className="mt-1">
          Try again
        </Button>
      )}
    </StateShell>
  );
}

export function SuccessState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <StateShell role="status">
      <div className="flex h-14 w-14 items-center justify-center rounded-[1.25rem] bg-success/12 text-success ring-1 ring-success/20">
        <CheckCircle2 className="h-6 w-6" aria-hidden />
      </div>
      <div className="space-y-1.5">
        <h3 className="font-display text-lg font-semibold tracking-tight">
          {title}
        </h3>
        <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
    </StateShell>
  );
}
