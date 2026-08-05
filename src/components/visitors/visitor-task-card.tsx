"use client";

import Link from "next/link";
import { Check, Loader2 } from "lucide-react";
import { useTransition } from "react";
import { completeFollowUpTaskAction } from "@/application/visitors/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FOLLOW_UP_PRIORITY_LABELS,
  FOLLOW_UP_TASK_TYPE_LABELS,
  FollowUpTaskStatus,
} from "@/domain/enums/visitor";
import type { FollowUpTaskEntity } from "@/domain/entities/visitor-journey";
import { cn } from "@/lib/utils";
import {
  formatRelativeDate,
  formatVisitorDate,
  isTaskOverdue,
  PRIORITY_VARIANT,
} from "@/components/visitors/utils";

type SerializedTask = Omit<
  FollowUpTaskEntity,
  "dueAt" | "completedAt" | "createdAt" | "updatedAt"
> & {
  dueAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  visitorName?: string;
};

export function VisitorTaskCard({
  task,
  showVisitorLink = true,
  onComplete,
}: {
  task: SerializedTask;
  showVisitorLink?: boolean;
  onComplete?: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const overdue =
    task.status !== FollowUpTaskStatus.DONE &&
    isTaskOverdue(task.dueAt);

  const complete = () => {
    startTransition(async () => {
      const res = await completeFollowUpTaskAction(task.id);
      if (res.ok) onComplete?.();
    });
  };

  return (
    <article
      className={cn(
        "group glass rounded-2xl p-4 transition-all hover-lift",
        overdue && "border border-warning/30"
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={PRIORITY_VARIANT[task.priority]}>
              {FOLLOW_UP_PRIORITY_LABELS[task.priority]}
            </Badge>
            <Badge variant="outline">
              {FOLLOW_UP_TASK_TYPE_LABELS[task.type]}
            </Badge>
            {overdue && <Badge variant="warning">Overdue</Badge>}
          </div>
          <h3 className="font-medium leading-snug">{task.title}</h3>
          {task.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {task.description}
            </p>
          )}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {task.dueAt && (
              <span>
                Due {formatVisitorDate(task.dueAt, "MMM d")} ·{" "}
                {formatRelativeDate(task.dueAt)}
              </span>
            )}
            {showVisitorLink && task.visitorName && (
              <Link
                href={`/visitors/${task.visitorId}`}
                className="font-medium text-primary hover:underline"
              >
                {task.visitorName}
              </Link>
            )}
          </div>
        </div>
        {task.status !== FollowUpTaskStatus.DONE && (
          <Button
            variant="glass"
            size="sm"
            className="shrink-0 min-h-10 min-w-10"
            disabled={pending}
            onClick={complete}
            aria-label={`Complete task: ${task.title}`}
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            Complete
          </Button>
        )}
      </div>
    </article>
  );
}
