"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Heart,
  Home,
  Loader2,
  Mail,
  Phone,
  UserPlus,
  Users,
} from "lucide-react";
import {
  advanceVisitorStageAction,
  assignVisitorLeaderAction,
  convertVisitorToMemberAction,
  createFollowUpTaskAction,
  setVisitorStageAction,
} from "@/application/visitors/actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VisitorCommForm } from "@/components/visitors/visitor-comm-form";
import { VisitorStatusBadge } from "@/components/visitors/visitor-status-badge";
import { VisitorTaskCard } from "@/components/visitors/visitor-task-card";
import {
  daysInStage,
  formatRelativeDate,
  formatVisitorDate,
  getInitials,
} from "@/components/visitors/utils";
import { FadeIn } from "@/components/motion/page-transition";
import type {
  VisitorJourneyEntity,
  VisitorProfile,
} from "@/domain/entities/visitor-journey";
import {
  COMMUNICATION_CHANNEL_LABELS,
  FOLLOW_UP_PRIORITY_LABELS,
  FOLLOW_UP_TASK_TYPE_LABELS,
  FollowUpPriority,
  FollowUpTaskStatus,
  FollowUpTaskType,
  VISITOR_PIPELINE_LABELS,
  VISITOR_PIPELINE_ORDER,
  VisitorActivityType,
  VisitorPipelineStage,
} from "@/domain/enums/visitor";
import { cn } from "@/lib/utils";

export type SerializedVisitorProfile = Omit<
  VisitorProfile,
  | "stageEnteredAt"
  | "createdAt"
  | "updatedAt"
  | "journey"
  | "attendances"
  | "tasks"
  | "communications"
  | "statusHistory"
  | "activities"
> & {
  stageEnteredAt: string;
  createdAt: string;
  updatedAt: string;
  journey: (Omit<
    VisitorJourneyEntity,
    "startedAt" | "completedAt" | "convertedAt" | "createdAt" | "updatedAt"
  > & {
    startedAt: string;
    completedAt: string | null;
    convertedAt: string | null;
    createdAt: string;
    updatedAt: string;
  }) | null;
  attendances: Array<
    Omit<VisitorProfile["attendances"][number], "checkedInAt" | "createdAt"> & {
      checkedInAt: string;
      createdAt: string;
    }
  >;
  tasks: Array<
    Omit<
      VisitorProfile["tasks"][number],
      "dueAt" | "completedAt" | "createdAt" | "updatedAt"
    > & {
      dueAt: string | null;
      completedAt: string | null;
      createdAt: string;
      updatedAt: string;
    }
  >;
  communications: Array<
    Omit<
      VisitorProfile["communications"][number],
      "occurredAt" | "createdAt"
    > & {
      occurredAt: string;
      createdAt: string;
    }
  >;
  statusHistory: Array<
    Omit<VisitorProfile["statusHistory"][number], "occurredAt"> & {
      occurredAt: string;
    }
  >;
  activities: Array<
    Omit<VisitorProfile["activities"][number], "occurredAt" | "createdAt"> & {
      occurredAt: string;
      createdAt: string;
    }
  >;
};

const PROFILE_TABS = [
  "overview",
  "timeline",
  "attendance",
  "tasks",
  "communications",
  "notes",
] as const;

type ProfileTab = (typeof PROFILE_TABS)[number];

const TAB_LABELS: Record<ProfileTab, string> = {
  overview: "Overview",
  timeline: "Timeline",
  attendance: "Attendance",
  tasks: "Tasks",
  communications: "Communications",
  notes: "Notes",
};

const ACTIVITY_LABELS: Partial<Record<VisitorActivityType, string>> = {
  [VisitorActivityType.CREATED]: "Created",
  [VisitorActivityType.STAGE_CHANGED]: "Stage changed",
  [VisitorActivityType.LEADER_ASSIGNED]: "Leader assigned",
  [VisitorActivityType.TASK_CREATED]: "Task created",
  [VisitorActivityType.TASK_COMPLETED]: "Task completed",
  [VisitorActivityType.COMMUNICATION]: "Communication",
  [VisitorActivityType.ATTENDED]: "Attended service",
  [VisitorActivityType.NOTE_ADDED]: "Note added",
  [VisitorActivityType.CONVERTED]: "Converted to member",
  [VisitorActivityType.AUTOMATION]: "Automation",
};

function StageStepper({ currentStage }: { currentStage: VisitorPipelineStage }) {
  const currentIndex = VISITOR_PIPELINE_ORDER.indexOf(currentStage);

  return (
    <ol
      className="flex flex-wrap gap-1 sm:gap-0"
      aria-label="Conversion progress"
    >
      {VISITOR_PIPELINE_ORDER.map((stage, index) => {
        const done = index < currentIndex;
        const active = index === currentIndex;
        return (
          <li
            key={stage}
            className="flex min-w-[4.5rem] flex-1 flex-col items-center gap-1.5 sm:min-w-0"
          >
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors",
                done && "border-success bg-success/15 text-success",
                active &&
                  "border-primary bg-primary/15 text-primary shadow-[var(--shadow-glow)]",
                !done && !active && "border-border/60 bg-muted/30 text-muted-foreground"
              )}
            >
              {done ? <Check className="h-3.5 w-3.5" /> : index + 1}
            </div>
            <span
              className={cn(
                "hidden text-center text-[10px] leading-tight sm:block",
                active ? "font-medium text-foreground" : "text-muted-foreground"
              )}
            >
              {VISITOR_PIPELINE_LABELS[stage]}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function VisitorProfileView({
  profile: initial,
}: {
  profile: SerializedVisitorProfile;
}) {
  const [profile] = useState(initial);
  const [tab, setTab] = useState<ProfileTab>("overview");
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const refresh = () => window.location.reload();

  const openTasks = profile.tasks.filter(
    (t) => t.status !== FollowUpTaskStatus.DONE
  );

  const advanceStage = () => {
    startTransition(async () => {
      const res = await advanceVisitorStageAction(profile.id);
      if (res.ok) {
        setMessage("Stage advanced");
        refresh();
      }
    });
  };

  const currentIndex = VISITOR_PIPELINE_ORDER.indexOf(profile.status);
  const canAdvance =
    currentIndex >= 0 && currentIndex < VISITOR_PIPELINE_ORDER.length - 1;
  const isMember = profile.status === VisitorPipelineStage.MEMBER;

  return (
    <div className="space-y-6">
      <FadeIn>
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-2">
          <Link href="/visitors/pipeline">
            <ArrowLeft className="h-4 w-4" />
            Back to pipeline
          </Link>
        </Button>

        <div className="relative overflow-hidden rounded-[2rem] glass-strong p-6 sm:p-8">
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-primary/15 blur-3xl" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex gap-4">
              <Avatar className="h-16 w-16 rounded-2xl">
                <AvatarFallback className="rounded-2xl text-lg">
                  {getInitials(profile.displayName)}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-display text-2xl font-semibold sm:text-3xl">
                    {profile.displayName}
                  </h1>
                  <VisitorStatusBadge stage={profile.status} />
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  {profile.phone && (
                    <span className="inline-flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" />
                      {profile.phone}
                    </span>
                  )}
                  {profile.email && (
                    <span className="inline-flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5" />
                      {profile.email}
                    </span>
                  )}
                  {profile.assignedLeaderName && (
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {profile.assignedLeaderName}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {daysInStage(profile.stageEnteredAt)} days in current stage ·{" "}
                  {profile.visitCount} visit{profile.visitCount !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {canAdvance && (
                <Button
                  variant="glow"
                  disabled={pending}
                  onClick={advanceStage}
                  className="min-h-11"
                >
                  <ArrowRight className="h-4 w-4" />
                  Advance stage
                </Button>
              )}
              <MoveStageDialog
                visitorId={profile.id}
                currentStage={profile.status}
                onDone={refresh}
              />
              <AssignLeaderDialog
                visitorId={profile.id}
                currentLeaderId={profile.assignedLeaderId}
                onDone={refresh}
              />
              {!isMember && (
                <ConvertDialog visitorId={profile.id} onDone={refresh} />
              )}
            </div>
          </div>

          <div className="relative mt-8 overflow-x-auto pb-2">
            <StageStepper currentStage={profile.status} />
          </div>
        </div>
      </FadeIn>

      {message && (
        <p className="text-sm text-success" role="status">
          {message}
        </p>
      )}

      <Tabs value={tab} onValueChange={(v) => setTab(v as ProfileTab)}>
        <TabsList className="h-auto flex-wrap">
          {PROFILE_TABS.map((t) => (
            <TabsTrigger key={t} value={t} className="min-h-10 px-4">
              {TAB_LABELS[t]}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <InfoCard title="Contact & context">
              <dl className="space-y-2 text-sm">
                {profile.familyName && (
                  <>
                    <dt className="text-muted-foreground">Family</dt>
                    <dd>{profile.familyName}</dd>
                  </>
                )}
                {profile.childrenCount > 0 && (
                  <>
                    <dt className="text-muted-foreground">Children</dt>
                    <dd>{profile.childrenCount}</dd>
                  </>
                )}
                {profile.source && (
                  <>
                    <dt className="text-muted-foreground">Source</dt>
                    <dd>{profile.source}</dd>
                  </>
                )}
                {profile.household && (
                  <>
                    <dt className="text-muted-foreground">Household</dt>
                    <dd>
                      <Link
                        href={`/households/${profile.household.id}`}
                        className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                      >
                        <Home className="h-3.5 w-3.5" />
                        {profile.household.familyName} (
                        {profile.household.householdCode})
                      </Link>
                    </dd>
                  </>
                )}
                {profile.prayerRequest && (
                  <>
                    <dt className="text-muted-foreground">Prayer request</dt>
                    <dd className="rounded-xl bg-primary/8 p-3">
                      <Heart
                        className="mb-1 inline h-3.5 w-3.5 text-primary"
                        aria-hidden
                      />{" "}
                      {profile.prayerRequest}
                    </dd>
                  </>
                )}
              </dl>
            </InfoCard>

            <InfoCard title="Quick stats">
              <ul className="space-y-3 text-sm">
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Open tasks</span>
                  <Badge variant="secondary">{openTasks.length}</Badge>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Communications</span>
                  <span>{profile.communications.length}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted-foreground">First seen</span>
                  <span>{formatVisitorDate(profile.createdAt)}</span>
                </li>
              </ul>
              <CreateTaskDialog visitorId={profile.id} onDone={refresh} />
            </InfoCard>
          </div>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-3">
          {[...profile.activities]
            .sort(
              (a, b) =>
                new Date(b.occurredAt).getTime() -
                new Date(a.occurredAt).getTime()
            )
            .map((activity) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass rounded-2xl p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{activity.title}</p>
                    {activity.description && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {activity.description}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {ACTIVITY_LABELS[activity.type] ?? activity.type}
                    </p>
                  </div>
                  <time className="shrink-0 text-xs text-muted-foreground">
                    {formatRelativeDate(activity.occurredAt)}
                  </time>
                </div>
              </motion.div>
            ))}
          {profile.activities.length === 0 && (
            <EmptyTab message="No activity recorded yet." />
          )}
        </TabsContent>

        <TabsContent value="attendance" className="space-y-3">
          {profile.attendances.map((att) => (
            <div
              key={att.id}
              className="glass rounded-2xl p-4 flex flex-wrap items-center justify-between gap-2"
            >
              <div>
                <p className="font-medium">
                  {formatVisitorDate(att.checkedInAt, "EEE, MMM d · h:mm a")}
                </p>
                <div className="mt-1 flex flex-wrap gap-2">
                  {att.isFirstVisit && (
                    <Badge variant="secondary">First visit</Badge>
                  )}
                  {att.isSecondVisit && (
                    <Badge variant="outline">Second visit</Badge>
                  )}
                </div>
              </div>
              {att.notes && (
                <p className="text-sm text-muted-foreground">{att.notes}</p>
              )}
            </div>
          ))}
          {profile.attendances.length === 0 && (
            <EmptyTab message="No attendance records yet." />
          )}
        </TabsContent>

        <TabsContent value="tasks" className="space-y-3">
          <div className="flex justify-end">
            <CreateTaskDialog visitorId={profile.id} onDone={refresh} />
          </div>
          {profile.tasks.map((task) => (
            <VisitorTaskCard
              key={task.id}
              task={{ ...task, visitorName: profile.displayName }}
              showVisitorLink={false}
              onComplete={refresh}
            />
          ))}
          {profile.tasks.length === 0 && (
            <EmptyTab message="No follow-up tasks yet." />
          )}
        </TabsContent>

        <TabsContent value="communications" className="space-y-4">
          <div className="glass rounded-2xl p-5 sm:p-6">
            <h3 className="mb-4 font-medium">Log communication</h3>
            <VisitorCommForm visitorId={profile.id} onLogged={refresh} />
          </div>
          <ul className="space-y-2">
            {profile.communications.map((comm) => (
              <li
                key={comm.id}
                className="glass rounded-2xl p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">
                    {COMMUNICATION_CHANNEL_LABELS[comm.channel]}
                  </Badge>
                  <time className="text-xs text-muted-foreground">
                    {formatVisitorDate(comm.occurredAt, "MMM d, yyyy · h:mm a")}
                  </time>
                </div>
                {comm.subject && (
                  <p className="mt-2 font-medium">{comm.subject}</p>
                )}
                <p className="mt-1 text-sm text-muted-foreground">{comm.body}</p>
              </li>
            ))}
          </ul>
          {profile.communications.length === 0 && (
            <EmptyTab message="No communications logged yet." />
          )}
        </TabsContent>

        <TabsContent value="notes">
          <div className="glass rounded-2xl p-5 sm:p-6">
            {profile.notes ? (
              <p className="whitespace-pre-wrap text-sm">{profile.notes}</p>
            ) : (
              <EmptyTab message="No notes on file." />
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function InfoCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="glass rounded-2xl p-5 sm:p-6">
      <h3 className="mb-4 font-display text-lg font-semibold">{title}</h3>
      {children}
    </div>
  );
}

function EmptyTab({ message }: { message: string }) {
  return (
    <p className="glass rounded-2xl p-8 text-center text-sm text-muted-foreground">
      {message}
    </p>
  );
}

function AssignLeaderDialog({
  visitorId,
  currentLeaderId,
  onDone,
}: {
  visitorId: string;
  currentLeaderId: string | null;
  onDone: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="glass" className="min-h-11">
          <UserPlus className="h-4 w-4" />
          Assign leader
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Assign leader</DialogTitle>
        <form
          className="mt-4 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const leaderId =
              (new FormData(e.currentTarget).get("leaderId") as string) ||
              null;
            startTransition(async () => {
              await assignVisitorLeaderAction(visitorId, {
                leaderId: leaderId || null,
              });
              setOpen(false);
              onDone();
            });
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="leaderId">Leader member ID</Label>
            <Input
              id="leaderId"
              name="leaderId"
              defaultValue={currentLeaderId ?? ""}
              placeholder="Member ID"
              className="min-h-11"
            />
          </div>
          <Button type="submit" disabled={pending} className="min-h-11">
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            Save
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function MoveStageDialog({
  visitorId,
  currentStage,
  onDone,
}: {
  visitorId: string;
  currentStage: VisitorPipelineStage;
  onDone: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="glass" className="min-h-11">
          Set stage
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Set pipeline stage</DialogTitle>
        <form
          className="mt-4 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const stage = fd.get("stage") as VisitorPipelineStage;
            const note = String(fd.get("note") ?? "").trim();
            startTransition(async () => {
              await setVisitorStageAction(visitorId, {
                stage,
                note: note || undefined,
              });
              setOpen(false);
              onDone();
            });
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="stage">Stage</Label>
            <Select name="stage" defaultValue={currentStage}>
              <SelectTrigger id="stage" className="min-h-11">
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
            <Label htmlFor="stage-note">Note (optional)</Label>
            <Textarea id="stage-note" name="note" rows={3} />
          </div>
          <Button type="submit" disabled={pending} className="min-h-11">
            Update
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CreateTaskDialog({
  visitorId,
  onDone,
}: {
  visitorId: string;
  onDone: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="glass" size="sm" className="mt-4 min-h-10">
          Create task
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Create follow-up task</DialogTitle>
        <form
          className="mt-4 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const type = fd.get("type") as FollowUpTaskType;
            const title = String(fd.get("title") ?? "").trim();
            const priority = fd.get("priority") as FollowUpPriority;
            startTransition(async () => {
              await createFollowUpTaskAction(visitorId, {
                type,
                title: title || undefined,
                priority,
              });
              setOpen(false);
              onDone();
            });
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="task-type">Type</Label>
            <Select name="type" defaultValue={FollowUpTaskType.CALL}>
              <SelectTrigger id="task-type" className="min-h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(FollowUpTaskType).map((t) => (
                  <SelectItem key={t} value={t}>
                    {FOLLOW_UP_TASK_TYPE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="task-title">Title (optional)</Label>
            <Input id="task-title" name="title" className="min-h-11" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="task-priority">Priority</Label>
            <Select name="priority" defaultValue={FollowUpPriority.MEDIUM}>
              <SelectTrigger id="task-priority" className="min-h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(FollowUpPriority).map((p) => (
                  <SelectItem key={p} value={p}>
                    {FOLLOW_UP_PRIORITY_LABELS[p]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={pending} className="min-h-11">
            Create
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ConvertDialog({
  visitorId,
  onDone,
}: {
  visitorId: string;
  onDone: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v) setError(null);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="glow" className="min-h-11">
          Convert to member
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Convert to member</DialogTitle>
        <p className="mt-2 text-sm text-muted-foreground">
          This will create a member record from this visitor profile and mark
          their journey as complete. This action cannot be undone.
        </p>
        {error && (
          <p className="mt-3 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        <div className="mt-6 flex gap-2">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="min-h-11"
            disabled={pending}
          >
            Cancel
          </Button>
          <Button
            disabled={pending}
            className="min-h-11"
            onClick={() => {
              startTransition(async () => {
                setError(null);
                const res = await convertVisitorToMemberAction(visitorId);
                if (!res.ok) {
                  setError(res.error);
                  return;
                }
                setOpen(false);
                onDone();
              });
            }}
          >
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            Confirm conversion
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
