"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  ChevronRight,
  Mail,
  Phone,
  User,
} from "lucide-react";
import { useState, useTransition } from "react";
import {
  advanceVisitorStageAction,
  setVisitorStageAction,
} from "@/application/visitors/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { VisitorStatusBadge } from "@/components/visitors/visitor-status-badge";
import {
  daysInStage,
  formatRelativeDate,
  getInitials,
} from "@/components/visitors/utils";
import type { VisitorListItem } from "@/domain/entities/visitor-journey";
import {
  VISITOR_PIPELINE_LABELS,
  VISITOR_PIPELINE_ORDER,
  VisitorPipelineStage,
} from "@/domain/enums/visitor";
import { cn } from "@/lib/utils";

type SerializedVisitor = Omit<
  VisitorListItem,
  "stageEnteredAt" | "lastCommunicationAt" | "createdAt" | "updatedAt"
> & {
  stageEnteredAt: string;
  lastCommunicationAt: string | null;
  createdAt: string;
  updatedAt: string;
};

function PipelineCardActions({
  visitor,
  onUpdated,
}: {
  visitor: SerializedVisitor;
  onUpdated: () => void;
}) {
  const [moveOpen, setMoveOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const currentIndex = VISITOR_PIPELINE_ORDER.indexOf(visitor.status);
  const canAdvance =
    currentIndex >= 0 && currentIndex < VISITOR_PIPELINE_ORDER.length - 1;

  const advance = () => {
    startTransition(async () => {
      const res = await advanceVisitorStageAction(visitor.id);
      if (res.ok) onUpdated();
    });
  };

  return (
    <div
      className="flex flex-wrap gap-1.5 pt-2"
      onClick={(e) => e.stopPropagation()}
    >
      {canAdvance && (
        <Button
          variant="glass"
          size="sm"
          className="h-9 min-h-9 text-xs"
          disabled={pending}
          onClick={advance}
        >
          <ArrowRight className="h-3.5 w-3.5" />
          Advance
        </Button>
      )}
      <Dialog open={moveOpen} onOpenChange={setMoveOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="h-9 min-h-9 text-xs">
            Move
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>Move to stage</DialogTitle>
          <form
            className="mt-4 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const stage = fd.get("stage") as VisitorPipelineStage;
              const note = String(fd.get("note") ?? "").trim();
              startTransition(async () => {
                const res = await setVisitorStageAction(visitor.id, {
                  stage,
                  note: note || undefined,
                });
                if (res.ok) {
                  setMoveOpen(false);
                  onUpdated();
                }
              });
            }}
          >
            <div className="space-y-2">
              <Label htmlFor={`stage-${visitor.id}`}>Stage</Label>
              <Select name="stage" defaultValue={visitor.status}>
                <SelectTrigger id={`stage-${visitor.id}`} className="min-h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VISITOR_PIPELINE_ORDER.map((s) => (
                    <SelectItem key={s} value={s}>
                      {VISITOR_PIPELINE_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`note-${visitor.id}`}>Note (optional)</Label>
              <Textarea
                id={`note-${visitor.id}`}
                name="note"
                rows={3}
                placeholder="Reason for stage change"
              />
            </div>
            <Button type="submit" disabled={pending} className="min-h-11">
              Update stage
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PipelineCard({
  visitor,
  index,
  onUpdated,
}: {
  visitor: SerializedVisitor;
  index: number;
  onUpdated: () => void;
}) {
  const days = daysInStage(visitor.stageEnteredAt);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.35,
        delay: index * 0.04,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <Link
        href={`/visitors/${visitor.id}`}
        className="block rounded-2xl border border-border/50 bg-background/45 p-4 transition-all hover:border-primary/25 hover:shadow-[var(--shadow-glow)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-medium">{visitor.displayName}</p>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              {visitor.phone && (
                <span className="inline-flex items-center gap-1">
                  <Phone className="h-3 w-3" aria-hidden />
                  {visitor.phone}
                </span>
              )}
              {visitor.email && (
                <span className="inline-flex items-center gap-1 truncate">
                  <Mail className="h-3 w-3 shrink-0" aria-hidden />
                  <span className="truncate">{visitor.email}</span>
                </span>
              )}
            </div>
          </div>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xs font-semibold text-primary">
            {getInitials(visitor.displayName)}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {visitor.openTaskCount > 0 && (
            <Badge variant="secondary">
              {visitor.openTaskCount} task
              {visitor.openTaskCount !== 1 ? "s" : ""}
            </Badge>
          )}
          {visitor.overdueTaskCount > 0 && (
            <Badge variant="warning">
              <AlertCircle className="mr-1 h-3 w-3" aria-hidden />
              {visitor.overdueTaskCount} overdue
            </Badge>
          )}
        </div>

        <div className="mt-3 space-y-1 text-xs text-muted-foreground">
          {visitor.assignedLeaderName && (
            <p className="inline-flex items-center gap-1">
              <User className="h-3 w-3" aria-hidden />
              {visitor.assignedLeaderName}
            </p>
          )}
          <p>
            {days} day{days !== 1 ? "s" : ""} in stage
            {visitor.lastCommunicationAt &&
              ` · last contact ${formatRelativeDate(visitor.lastCommunicationAt)}`}
          </p>
        </div>

        <PipelineCardActions visitor={visitor} onUpdated={onUpdated} />
      </Link>
    </motion.div>
  );
}

export function PipelineColumn({
  stage,
  label,
  visitors,
  onUpdated,
}: {
  stage: VisitorPipelineStage;
  label: string;
  visitors: SerializedVisitor[];
  onUpdated: () => void;
}) {
  return (
    <section
      className="flex min-w-[17rem] max-w-[20rem] flex-1 flex-col rounded-[1.75rem] glass p-3 sm:min-w-[18rem]"
      aria-label={`${label} column`}
    >
      <header className="mb-3 flex items-center justify-between gap-2 px-1">
        <div className="min-w-0">
          <VisitorStatusBadge stage={stage} className="mb-1.5" />
          <h2 className="truncate font-display text-sm font-semibold">{label}</h2>
        </div>
        <Badge variant="outline" className="shrink-0 tabular-nums">
          {visitors.length}
        </Badge>
      </header>

      <div
        className={cn(
          "flex flex-1 flex-col gap-2.5 overflow-y-auto rounded-2xl p-1",
          "max-h-[calc(100vh-18rem)] min-h-[12rem]"
        )}
      >
        {visitors.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-background/25 px-4 py-10 text-center">
            <ChevronRight
              className="mb-2 h-5 w-5 text-muted-foreground/50"
              aria-hidden
            />
            <p className="text-sm font-medium text-muted-foreground">
              No visitors here
            </p>
            <p className="mt-1 text-xs text-muted-foreground/80">
              Advance guests from earlier stages
            </p>
          </div>
        ) : (
          visitors.map((visitor, index) => (
            <PipelineCard
              key={visitor.id}
              visitor={visitor}
              index={index}
              onUpdated={onUpdated}
            />
          ))
        )}
      </div>
    </section>
  );
}
