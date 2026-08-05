"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  Check,
  Loader2,
  Plus,
  UserMinus,
  X,
} from "lucide-react";
import {
  assignVolunteerAction,
  createScheduleEventAction,
  getSchedulerBoardAction,
  listMinistriesAction,
  updateAssignmentStatusAction,
} from "@/application/ministries/actions";
import { ErrorState, LoadingState } from "@/components/shared/states";
import {
  assignmentStatusVariant,
  formatScheduleDateTime,
  formatSlotTime,
  parseSlotDropId,
  parseVolunteerDragId,
  slotDropId,
  toIsoDateTimeInput,
  volunteerDragId,
} from "@/components/schedule/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  ConflictInfo,
  MinistryEntity,
  SchedulerBoard,
  VolunteerListItem,
} from "@/domain/entities/ministry";
import {
  ASSIGNMENT_STATUS_LABELS,
  ScheduleAssignmentStatus,
  ScheduleEventType,
  SCHEDULE_EVENT_TYPE_LABELS,
} from "@/domain/enums/ministry";
import { cn } from "@/lib/utils";
import { getInitials } from "@/components/volunteers/utils";

type SerializedBoard = Omit<SchedulerBoard, "event" | "slots" | "availableVolunteers" | "conflicts"> & {
  event: Omit<SchedulerBoard["event"], "startsAt" | "endsAt" | "createdAt" | "updatedAt"> & {
    startsAt: string;
    endsAt: string | null;
    createdAt: string;
    updatedAt: string;
  };
  slots: Array<
    Omit<SchedulerBoard["slots"][number], "startsAt" | "endsAt" | "createdAt" | "updatedAt" | "assignments"> & {
      startsAt: string;
      endsAt: string | null;
      createdAt: string;
      updatedAt: string;
      assignments: Array<
        Omit<SchedulerBoard["slots"][number]["assignments"][number], "assignedAt" | "respondedAt" | "createdAt" | "updatedAt"> & {
          assignedAt: string;
          respondedAt: string | null;
          createdAt: string;
          updatedAt: string;
        }
      >;
    }
  >;
  availableVolunteers: Array<
    Omit<VolunteerListItem, "createdAt" | "updatedAt"> & {
      createdAt: string;
      updatedAt: string;
    }
  >;
  conflicts: Array<
    Omit<ConflictInfo, "startsAt" | "endsAt"> & {
      startsAt: string;
      endsAt: string | null;
    }
  >;
};

type SerializedMinistry = Omit<MinistryEntity, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};

function DraggableVolunteerChip({
  volunteer,
}: {
  volunteer: SerializedBoard["availableVolunteers"][number];
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: volunteerDragId(volunteer.id),
      data: { volunteerId: volunteer.id },
    });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  return (
    <button
      ref={setNodeRef}
      type="button"
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "flex items-center gap-2 rounded-2xl border border-border/60 bg-background/60 px-3 py-2.5 text-left text-sm shadow-sm transition-all touch-manipulation",
        "hover:border-primary/40 hover:shadow-[var(--shadow-soft)] active:scale-[0.98]",
        isDragging && "opacity-40"
      )}
    >
      <Avatar className="h-8 w-8 rounded-xl">
        {volunteer.member.avatarUrl && (
          <AvatarImage src={volunteer.member.avatarUrl} alt="" />
        )}
        <AvatarFallback className="rounded-xl text-[10px]">
          {getInitials(volunteer.member.firstName, volunteer.member.lastName)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate font-medium">{volunteer.displayName}</p>
        <p className="text-xs text-muted-foreground">
          {volunteer.reliabilityScore}% · {volunteer.primaryMinistry ?? "—"}
        </p>
      </div>
    </button>
  );
}

function SlotColumn({
  slot,
  onStatusChange,
  statusPending,
}: {
  slot: SerializedBoard["slots"][number];
  onStatusChange: (assignmentId: string, status: ScheduleAssignmentStatus) => void;
  statusPending: boolean;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: slotDropId(slot.id),
    data: { slotId: slot.id },
  });

  const filled = slot.assignments.filter(
    (a) =>
      a.status === ScheduleAssignmentStatus.ASSIGNED ||
      a.status === ScheduleAssignmentStatus.CONFIRMED
  ).length;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-h-[220px] flex-col rounded-[1.5rem] border border-border/50 bg-background/30 p-4 transition-colors",
        isOver && "border-primary/50 bg-primary/5 ring-2 ring-primary/20"
      )}
    >
      <div className="mb-3 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <p className="font-medium leading-tight">{slot.title}</p>
          <Badge variant={filled >= slot.needed ? "success" : "warning"}>
            {filled}/{slot.needed}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          {formatSlotTime(slot.startsAt)}
          {slot.endsAt ? ` – ${formatSlotTime(slot.endsAt)}` : ""}
        </p>
        {slot.roleName && (
          <Badge variant="outline" className="text-[10px]">{slot.roleName}</Badge>
        )}
      </div>

      <div className="flex-1 space-y-2">
        {slot.assignments.map((assignment) => (
          <div
            key={assignment.id}
            className="rounded-xl border border-border/40 bg-background/50 p-3"
          >
            <div className="flex items-center gap-2">
              <Avatar className="h-7 w-7 rounded-lg">
                {assignment.volunteer.avatarUrl && (
                  <AvatarImage src={assignment.volunteer.avatarUrl} alt="" />
                )}
                <AvatarFallback className="rounded-lg text-[9px]">
                  {getInitials(
                    assignment.volunteer.firstName,
                    assignment.volunteer.lastName
                  )}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {assignment.volunteer.firstName} {assignment.volunteer.lastName}
                </p>
                <Badge
                  variant={assignmentStatusVariant(assignment.status)}
                  className="mt-0.5 text-[10px]"
                >
                  {ASSIGNMENT_STATUS_LABELS[assignment.status]}
                </Badge>
              </div>
            </div>
            {assignment.status === ScheduleAssignmentStatus.ASSIGNED && (
              <div className="mt-2 flex gap-1">
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-8 flex-1 rounded-xl text-xs"
                  disabled={statusPending}
                  onClick={() =>
                    onStatusChange(
                      assignment.id,
                      ScheduleAssignmentStatus.CONFIRMED
                    )
                  }
                >
                  <Check className="h-3 w-3" />
                  Confirm
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 flex-1 rounded-xl text-xs"
                  disabled={statusPending}
                  onClick={() =>
                    onStatusChange(
                      assignment.id,
                      ScheduleAssignmentStatus.DECLINED
                    )
                  }
                >
                  <X className="h-3 w-3" />
                  Decline
                </Button>
              </div>
            )}
          </div>
        ))}

        {slot.openSpots > 0 && (
          <div
            className={cn(
              "flex items-center justify-center rounded-xl border border-dashed border-border/60 py-6 text-xs text-muted-foreground",
              isOver && "border-primary text-primary"
            )}
          >
            Drop volunteer here
          </div>
        )}
      </div>
    </div>
  );
}

function CreateEventDialog({
  ministries,
  onCreated,
}: {
  ministries: SerializedMinistry[];
  onCreated: (eventId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("Sunday Service");
  const [ministryId, setMinistryId] = useState<string>("__none__");
  const [eventType, setEventType] = useState<ScheduleEventType>(
    ScheduleEventType.SUNDAY_SERVICE
  );
  const [startsAt, setStartsAt] = useState(toIsoDateTimeInput());
  const [slotTitle, setSlotTitle] = useState("General volunteer");
  const [needed, setNeeded] = useState(2);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const handleCreate = () => {
    setError(null);
    const start = new Date(startsAt);
    startTransition(async () => {
      const res = await createScheduleEventAction({
        ministryId: ministryId === "__none__" ? null : ministryId,
        title,
        eventType,
        startsAt: start.toISOString(),
        slots: [
          {
            title: slotTitle,
            needed,
            startsAt: start.toISOString(),
          },
        ],
      });

      if (!res.ok) {
        setError(res.error);
        return;
      }

      setOpen(false);
      onCreated(res.data.id);
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="glow" size="lg">
          <Plus className="h-4 w-4" />
          Create event
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogTitle>Create schedule event</DialogTitle>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="event-title">Title</Label>
            <Input
              id="event-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-2xl"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Ministry</Label>
              <Select value={ministryId} onValueChange={setMinistryId}>
                <SelectTrigger className="rounded-2xl">
                  <SelectValue placeholder="Optional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {ministries.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={eventType}
                onValueChange={(v) => setEventType(v as ScheduleEventType)}
              >
                <SelectTrigger className="rounded-2xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(ScheduleEventType).map((t) => (
                    <SelectItem key={t} value={t}>
                      {SCHEDULE_EVENT_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="event-starts">Starts</Label>
            <Input
              id="event-starts"
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              className="rounded-2xl"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="slot-title">First slot</Label>
              <Input
                id="slot-title"
                value={slotTitle}
                onChange={(e) => setSlotTitle(e.target.value)}
                className="rounded-2xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slot-needed">Needed</Label>
              <Input
                id="slot-needed"
                type="number"
                min={1}
                value={needed}
                onChange={(e) => setNeeded(Number(e.target.value))}
                className="rounded-2xl"
              />
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button
            variant="glow"
            className="w-full"
            onClick={handleCreate}
            disabled={pending}
          >
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            Create & open board
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function SchedulerBoard({
  eventId,
  date,
  onEventCreated,
}: {
  eventId?: string;
  date?: string;
  onEventCreated?: (eventId: string) => void;
}) {
  const [board, setBoard] = useState<SerializedBoard | null>(null);
  const [ministries, setMinistries] = useState<SerializedMinistry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [conflictBanner, setConflictBanner] = useState<string | null>(null);
  const [activeVolunteer, setActiveVolunteer] =
    useState<SerializedBoard["availableVolunteers"][number] | null>(null);
  const [assignPending, startAssign] = useTransition();
  const [statusPending, startStatus] = useTransition();

  const loadBoard = useCallback(async () => {
    if (!eventId && !date) {
      setLoading(false);
      return;
    }

    const res = await getSchedulerBoardAction(
      eventId ? { eventId } : { date: date! }
    );

    if (!res.ok) {
      setError(res.error);
      setLoading(false);
      return;
    }

    setBoard(JSON.parse(JSON.stringify(res.data)) as SerializedBoard);
    setError(null);
    setLoading(false);
  }, [eventId, date]);

  useEffect(() => {
    setLoading(true);
    loadBoard();
  }, [loadBoard]);

  useEffect(() => {
    listMinistriesAction().then((res) => {
      if (res.ok) {
        setMinistries(
          JSON.parse(JSON.stringify(res.data)) as SerializedMinistry[]
        );
      }
    });
  }, []);

  const handleDragStart = (event: DragStartEvent) => {
    const volunteerId = parseVolunteerDragId(String(event.active.id));
    if (!volunteerId || !board) return;
    const volunteer = board.availableVolunteers.find((v) => v.id === volunteerId);
    setActiveVolunteer(volunteer ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveVolunteer(null);
    const volunteerId = parseVolunteerDragId(String(event.active.id));
    const slotId = event.over ? parseSlotDropId(String(event.over.id)) : null;

    if (!volunteerId || !slotId) return;

    startAssign(async () => {
      const res = await assignVolunteerAction({
        slotId,
        volunteerId,
      });

      if (!res.ok) {
        setConflictBanner(res.error);
        return;
      }

      if (res.data.conflicts.length > 0) {
        const names = res.data.conflicts
          .map((c) => c.eventTitle)
          .join(", ");
        setConflictBanner(
          `Assigned with scheduling conflicts: ${names}`
        );
      } else {
        setConflictBanner(null);
      }

      await loadBoard();
    });
  };

  const handleStatusChange = (
    assignmentId: string,
    status: ScheduleAssignmentStatus
  ) => {
    startStatus(async () => {
      const res = await updateAssignmentStatusAction({
        assignmentId,
        status,
      });
      if (!res.ok) {
        setConflictBanner(res.error);
        return;
      }
      await loadBoard();
    });
  };

  if (!eventId && !date) {
    return (
      <div className="glass rounded-[1.75rem] p-10 text-center text-muted-foreground">
        Select an event or day to open the scheduler board.
      </div>
    );
  }

  if (loading) return <LoadingState label="Loading scheduler board…" />;
  if (error || !board)
    return (
      <ErrorState
        description={error ?? "Unable to load board"}
        onRetry={() => {
          setLoading(true);
          loadBoard();
        }}
      />
    );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-semibold">{board.event.title}</h2>
          <p className="text-sm text-muted-foreground">
            {formatScheduleDateTime(board.event.startsAt)}
            {board.event.ministryName ? ` · ${board.event.ministryName}` : ""}
          </p>
        </div>
        <CreateEventDialog
          ministries={ministries}
          onCreated={(id) => {
            onEventCreated?.(id);
            loadBoard();
          }}
        />
      </div>

      <AnimatePresence>
        {(conflictBanner || board.conflicts.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            role="alert"
            className="flex items-start gap-3 rounded-2xl border border-warning/40 bg-warning/10 p-4 text-sm"
          >
            <AlertTriangle className="h-5 w-5 shrink-0 text-warning" />
            <div>
              <p className="font-medium">Scheduling conflicts</p>
              <p className="mt-1 text-muted-foreground">
                {conflictBanner ??
                  board.conflicts
                    .map((c) => `${c.eventTitle} (${c.slotTitle})`)
                    .join(" · ")}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              className="shrink-0"
              onClick={() => setConflictBanner(null)}
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {(assignPending || statusPending) && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Updating schedule…
        </div>
      )}

      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">
              Slots · drag volunteers into open positions
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {board.slots.map((slot) => (
                <SlotColumn
                  key={slot.id}
                  slot={slot}
                  onStatusChange={handleStatusChange}
                  statusPending={statusPending}
                />
              ))}
            </div>
          </div>

          <aside className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-medium">
              <UserMinus className="h-4 w-4 text-primary" />
              Available ({board.availableVolunteers.length})
            </h3>
            <div className="glass max-h-[520px] space-y-2 overflow-y-auto rounded-[1.5rem] p-3">
              {board.availableVolunteers.length === 0 ? (
                <p className="p-3 text-sm text-muted-foreground">
                  No available volunteers for this event
                </p>
              ) : (
                board.availableVolunteers.map((volunteer) => (
                  <DraggableVolunteerChip key={volunteer.id} volunteer={volunteer} />
                ))
              )}
            </div>
          </aside>
        </div>

        <DragOverlay>
          {activeVolunteer ? (
            <div className="flex items-center gap-2 rounded-2xl border border-primary/40 bg-background px-3 py-2 shadow-[var(--shadow-elevated)]">
              <span className="text-sm font-medium">{activeVolunteer.displayName}</span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
