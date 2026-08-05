"use client";

import dynamic from "next/dynamic";
import { useState, useTransition } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  Heart,
  Mail,
  MapPin,
  MessageCircle,
  Printer,
  QrCode,
  UserCog,
  Users,
} from "lucide-react";
import {
  addHouseholdNoteAction,
  householdQuickAction,
  updateHouseholdAction,
  uploadHouseholdDocumentAction,
} from "@/application/households/actions";
import { safeBackgroundImage } from "@/lib/safe-url";
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
import { Textarea } from "@/components/ui/textarea";
import { FamilyTree } from "@/components/households/family-tree";
import {
  EngagementBar,
  HouseholdAttendanceChart,
  HouseholdGivingChart,
  HouseholdGrowthChart,
} from "@/components/households/household-charts";
import { HouseholdMemberManager } from "@/components/households/household-member-manager";
import { HouseholdStatusBadge } from "@/components/households/household-status-badge";
import {
  formatAddress,
  formatHouseholdDate,
  getInitials,
  memberDisplayName,
} from "@/components/households/utils";
import { FadeIn } from "@/components/motion/page-transition";

const HouseholdQrDialog = dynamic(
  () =>
    import("@/components/households/household-qr-dialog").then((m) => ({
      default: m.HouseholdQrDialog,
    })),
  { ssr: false }
);
import type { HouseholdProfile } from "@/domain/entities/household";
import {
  DocumentType,
  HOUSEHOLD_ACTIVITY_LABELS,
  HouseholdActivityType,
  NOTE_VISIBILITY_LABELS,
  NoteVisibility,
} from "@/domain/enums/member";
import { cn, formatCurrency } from "@/lib/utils";

export type SerializedHouseholdProfile = Omit<
  HouseholdProfile,
  | "anniversaryDate"
  | "createdAt"
  | "updatedAt"
  | "memberships"
  | "activities"
  | "notes"
  | "documents"
> & {
  anniversaryDate: string | null;
  createdAt: string;
  updatedAt: string;
  memberships: Array<
    Omit<HouseholdProfile["memberships"][number], "createdAt" | "updatedAt"> & {
      createdAt: string;
      updatedAt: string;
    }
  >;
  activities: Array<
    Omit<HouseholdProfile["activities"][number], "occurredAt"> & {
      occurredAt: string;
    }
  >;
  notes: Array<
    Omit<HouseholdProfile["notes"][number], "createdAt" | "updatedAt"> & {
      createdAt: string;
      updatedAt: string;
    }
  >;
  documents: Array<
    Omit<HouseholdProfile["documents"][number], "createdAt"> & {
      createdAt: string;
    }
  >;
};

const TABS = [
  "overview",
  "familyTree",
  "members",
  "timeline",
  "attendance",
  "giving",
  "prayer",
  "volunteers",
  "notes",
  "documents",
  "analytics",
] as const;

type TabId = (typeof TABS)[number];

const TAB_LABELS: Record<TabId, string> = {
  overview: "Overview",
  familyTree: "Family Tree",
  members: "Members",
  timeline: "Timeline",
  attendance: "Attendance",
  giving: "Giving",
  prayer: "Prayer",
  volunteers: "Volunteers",
  notes: "Notes",
  documents: "Documents",
  analytics: "Analytics",
};

export function HouseholdProfileView({
  profile: initial,
}: {
  profile: SerializedHouseholdProfile;
}) {
  const [profile] = useState(initial);
  const [tab, setTab] = useState<TabId>("overview");
  const [, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const photoBackground = safeBackgroundImage(profile.photoUrl);

  const refresh = () => {
    window.location.reload();
  };

  const allEmails = profile.memberships
    .map((m) => m.member?.email)
    .filter(Boolean) as string[];

  const attendance90d = profile.analytics.attendanceTrend.reduce(
    (sum, d) => sum + d.count,
    0
  );
  const giving90d = profile.analytics.givingTrend.reduce(
    (sum, d) => sum + d.amountCents,
    0
  );

  const logAction = (
    action: "email" | "whatsapp" | "visit" | "prayer" | "homeVisit",
    detail?: string
  ) => {
    startTransition(async () => {
      await householdQuickAction(profile.id, action, detail);
      setMessage(`${action} logged`);
    });
  };

  const statCards = [
    { label: "Members", value: profile.analytics.memberCount, isCount: true },
    {
      label: "Engagement",
      value: profile.analytics.engagementScore,
      isScore: true,
    },
    { label: "Attendance 90d", value: attendance90d, isCount: true },
    { label: "Giving 90d", value: giving90d, isCurrency: true },
    {
      label: "Open prayers",
      value: profile.analytics.openPrayers,
      isCount: true,
    },
    {
      label: "Volunteers",
      value: profile.analytics.volunteerCount,
      isCount: true,
    },
  ];

  const address = formatAddress(profile);
  const recentActivities = profile.activities.slice(0, 5);
  const prayerActivities = profile.activities.filter(
    (a) => a.type === HouseholdActivityType.PRAYER_REQUESTED
  );

  return (
    <div className="space-y-6 pb-12">
      <FadeIn>
        <Link
          href="/households"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Households
        </Link>
      </FadeIn>

      <FadeIn delay={0.04}>
        <div className="relative overflow-hidden rounded-[2rem] glass-strong">
          <div
            className="h-40 sm:h-52"
            style={
              photoBackground
                ? {
                    backgroundImage: photoBackground,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }
                : undefined
            }
          >
            {!photoBackground && (
              <div
                className="h-full w-full opacity-80"
                style={{
                  background:
                    "linear-gradient(135deg, hsl(var(--aurora-1)), hsl(var(--aurora-2)), hsl(var(--aurora-3)))",
                }}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent" />
          </div>
          <div className="relative px-6 pb-6 sm:px-8">
            <div className="-mt-14 flex flex-col gap-4 sm:-mt-16 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-end gap-4">
                <div className="flex -space-x-3">
                  {profile.memberships.slice(0, 4).map((m) => {
                    const name = memberDisplayName(m.member);
                    return (
                      <Avatar
                        key={m.id}
                        className="h-12 w-12 border-2 border-background sm:h-14 sm:w-14"
                      >
                        {m.member?.avatarUrl && (
                          <AvatarImage src={m.member.avatarUrl} alt="" />
                        )}
                        <AvatarFallback className="text-xs">
                          {getInitials(name)}
                        </AvatarFallback>
                      </Avatar>
                    );
                  })}
                  {profile.memberships.length > 4 && (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium sm:h-14 sm:w-14">
                      +{profile.memberships.length - 4}
                    </div>
                  )}
                </div>
                <div className="pb-1">
                  <h1 className="font-display text-2xl font-semibold sm:text-3xl">
                    {profile.familyName}
                  </h1>
                  <p className="font-mono text-sm text-muted-foreground">
                    {profile.householdCode}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <HouseholdStatusBadge status={profile.status} />
                    {profile.cellGroup && (
                      <Badge variant="outline">{profile.cellGroup}</Badge>
                    )}
                  </div>
                  {address && (
                    <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      {address}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {statCards.map((card) => (
                <div
                  key={card.label}
                  className="glass rounded-2xl p-4 shadow-[var(--shadow-soft)]"
                >
                  {"isScore" in card && card.isScore ? (
                    <EngagementBar value={card.value} />
                  ) : (
                    <>
                      <p className="text-xs text-muted-foreground">
                        {card.label}
                      </p>
                      <p className="mt-1 font-display text-xl font-semibold tabular-nums">
                        {"isCurrency" in card && card.isCurrency
                          ? formatCurrency(card.value / 100)
                          : card.value.toLocaleString()}
                      </p>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </FadeIn>

      <FadeIn delay={0.06}>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="glass"
            size="sm"
            onClick={() => logAction("visit")}
          >
            <Calendar className="h-4 w-4" />
            Visit
          </Button>
          {allEmails.length > 0 && (
            <Button
              variant="glass"
              size="sm"
              onClick={() => {
                window.open(`mailto:${allEmails.join(",")}`, "_blank");
                logAction("email", allEmails.join(", "));
              }}
            >
              <Mail className="h-4 w-4" />
              Email
            </Button>
          )}
          <Button
            variant="glass"
            size="sm"
            onClick={() => {
              logAction("whatsapp");
            }}
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </Button>

          <AssignCellLeaderDialog
            householdId={profile.id}
            currentLeaderId={profile.assignedCellLeaderId}
            onDone={refresh}
          />

          <Button
            variant="glass"
            size="sm"
            onClick={() => logAction("homeVisit")}
          >
            <Calendar className="h-4 w-4" />
            Schedule home visit
          </Button>

          <Button
            variant="glass"
            size="sm"
            onClick={() => logAction("prayer")}
          >
            <Heart className="h-4 w-4" />
            Create prayer
          </Button>

          <HouseholdQrDialog
            qrToken={profile.qrToken}
            familyName={profile.familyName}
            trigger={
              <Button variant="glass" size="sm">
                <QrCode className="h-4 w-4" />
                QR code
              </Button>
            }
          />

          <Button
            variant="glass"
            size="sm"
            onClick={() => window.print()}
          >
            <Printer className="h-4 w-4" />
            Print
          </Button>
        </div>
        {message && (
          <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        )}
      </FadeIn>

      <FadeIn delay={0.08}>
        <div className="flex gap-1 overflow-x-auto rounded-2xl glass-strong p-1">
          {TABS.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                "relative shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition-colors",
                tab === id
                  ? "text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab === id && (
                <motion.span
                  layoutId="household-tab"
                  className="absolute inset-0 rounded-xl bg-primary shadow-[var(--shadow-glow)]"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">{TAB_LABELS[id]}</span>
            </button>
          ))}
        </div>
      </FadeIn>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {tab === "overview" && (
            <div className="grid gap-6 lg:grid-cols-2">
              <section className="glass rounded-[1.75rem] p-6">
                <h2 className="font-display text-lg font-semibold">
                  Household details
                </h2>
                <dl className="mt-4 space-y-3 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Address</dt>
                    <dd>{address ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Emergency contact</dt>
                    <dd>
                      {profile.emergencyContact
                        ? `${profile.emergencyContact}${profile.emergencyPhone ? ` · ${profile.emergencyPhone}` : ""}`
                        : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Cell group</dt>
                    <dd>{profile.cellGroup ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Anniversary</dt>
                    <dd>{formatHouseholdDate(profile.anniversaryDate)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Language</dt>
                    <dd>{profile.preferredLanguage ?? "—"}</dd>
                  </div>
                </dl>
              </section>
              <section className="glass rounded-[1.75rem] p-6">
                <h2 className="font-display text-lg font-semibold">
                  Notes summary
                </h2>
                <p className="mt-4 text-sm text-muted-foreground whitespace-pre-wrap">
                  {profile.summaryNotes ?? "No summary notes yet."}
                </p>
              </section>
              <section className="glass rounded-[1.75rem] p-6 lg:col-span-2">
                <h2 className="font-display text-lg font-semibold">
                  Recent activity
                </h2>
                <ul className="mt-4 space-y-3">
                  {recentActivities.length === 0 ? (
                    <li className="text-sm text-muted-foreground">
                      No recent activity
                    </li>
                  ) : (
                    recentActivities.map((a) => (
                      <li
                        key={a.id}
                        className="flex items-start justify-between gap-4 border-b border-border/30 pb-3 last:border-0"
                      >
                        <div>
                          <p className="text-sm font-medium">{a.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {HOUSEHOLD_ACTIVITY_LABELS[a.type]}
                          </p>
                        </div>
                        <time className="shrink-0 text-xs text-muted-foreground">
                          {formatHouseholdDate(a.occurredAt, "MMM d")}
                        </time>
                      </li>
                    ))
                  )}
                </ul>
              </section>
            </div>
          )}

          {tab === "familyTree" && (
            <FamilyTree memberships={profile.memberships} />
          )}

          {tab === "members" && (
            <HouseholdMemberManager
              householdId={profile.id}
              familyName={profile.familyName}
              memberships={profile.memberships}
              onChanged={refresh}
            />
          )}

          {tab === "timeline" && (
            <section className="glass rounded-[1.75rem] p-6">
              <h2 className="font-display text-lg font-semibold">Timeline</h2>
              <ul className="relative mt-6 space-y-6 border-l border-border/50 pl-6">
                {profile.activities.map((a) => (
                  <li key={a.id} className="relative">
                    <span className="absolute -left-[1.6rem] top-1 h-3 w-3 rounded-full bg-primary" />
                    <p className="text-sm font-medium">{a.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {HOUSEHOLD_ACTIVITY_LABELS[a.type]}
                      {a.description ? ` · ${a.description}` : ""}
                    </p>
                    <time className="text-xs text-muted-foreground">
                      {formatHouseholdDate(a.occurredAt, "MMM d, yyyy h:mm a")}
                    </time>
                  </li>
                ))}
                {profile.activities.length === 0 && (
                  <li className="text-sm text-muted-foreground">
                    No activity recorded yet
                  </li>
                )}
              </ul>
            </section>
          )}

          {tab === "attendance" && (
            <section className="glass rounded-[1.75rem] p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="font-display text-lg font-semibold">
                  Attendance trend
                </h2>
                <Link
                  href="/attendance/check-in"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Open Attendance desk →
                </Link>
              </div>
              <HouseholdAttendanceChart
                data={profile.analytics.attendanceTrend}
                className="mt-4 h-[280px]"
              />
            </section>
          )}

          {tab === "giving" && (
            <section className="glass rounded-[1.75rem] p-6">
              <h2 className="font-display text-lg font-semibold">
                Giving trend
              </h2>
              <HouseholdGivingChart
                data={profile.analytics.givingTrend}
                className="mt-4 h-[280px]"
              />
            </section>
          )}

          {tab === "prayer" && (
            <section className="glass rounded-[1.75rem] p-6">
              <h2 className="font-display text-lg font-semibold">
                Prayer requests
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {profile.analytics.openPrayers} open prayer
                {profile.analytics.openPrayers === 1 ? "" : "s"}
              </p>
              <ul className="mt-4 space-y-3">
                {prayerActivities.map((a) => (
                  <li
                    key={a.id}
                    className="rounded-xl bg-background/40 p-4 text-sm"
                  >
                    <p className="font-medium">{a.title}</p>
                    {a.description && (
                      <p className="mt-1 text-muted-foreground">
                        {a.description}
                      </p>
                    )}
                    <time className="mt-2 block text-xs text-muted-foreground">
                      {formatHouseholdDate(a.occurredAt)}
                    </time>
                  </li>
                ))}
                {prayerActivities.length === 0 && (
                  <li className="text-sm text-muted-foreground">
                    No prayer activity recorded
                  </li>
                )}
              </ul>
            </section>
          )}

          {tab === "volunteers" && (
            <section className="glass rounded-[1.75rem] p-6">
              <h2 className="font-display text-lg font-semibold">
                Volunteers
              </h2>
              <p className="mt-4 text-3xl font-semibold tabular-nums">
                {profile.analytics.volunteerCount}
              </p>
              <p className="text-sm text-muted-foreground">
                Active volunteers in this household
              </p>
              <ul className="mt-6 space-y-2">
                {profile.memberships.map((m) => (
                  <li
                    key={m.id}
                    className="flex items-center gap-3 rounded-xl bg-background/40 px-4 py-2"
                  >
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <Link
                      href={`/people/${m.memberId}`}
                      className="text-sm hover:underline"
                    >
                      {memberDisplayName(m.member)}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {tab === "notes" && (
            <section className="space-y-6">
              <AddNoteForm householdId={profile.id} onDone={refresh} />
              <div className="glass rounded-[1.75rem] divide-y divide-border/40">
                {profile.notes.map((n) => (
                  <article key={n.id} className="p-5">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="outline" className="text-[10px]">
                        {NOTE_VISIBILITY_LABELS[n.visibility]}
                      </Badge>
                      <time className="text-xs text-muted-foreground">
                        {formatHouseholdDate(n.createdAt)}
                      </time>
                    </div>
                    <p className="mt-3 text-sm whitespace-pre-wrap">{n.body}</p>
                  </article>
                ))}
                {profile.notes.length === 0 && (
                  <p className="p-8 text-center text-sm text-muted-foreground">
                    No notes yet
                  </p>
                )}
              </div>
            </section>
          )}

          {tab === "documents" && (
            <section className="space-y-6">
              <UploadDocumentForm householdId={profile.id} onDone={refresh} />
              <div className="glass rounded-[1.75rem] divide-y divide-border/40">
                {profile.documents.map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center justify-between gap-4 p-5"
                  >
                    <div>
                      <p className="font-medium">{d.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {d.type} · {(d.sizeBytes / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    {d.url && (
                      <Button variant="glass" size="sm" asChild>
                        <a href={d.url} target="_blank" rel="noopener noreferrer">
                          View
                        </a>
                      </Button>
                    )}
                  </div>
                ))}
                {profile.documents.length === 0 && (
                  <p className="p-8 text-center text-sm text-muted-foreground">
                    No documents uploaded
                  </p>
                )}
              </div>
            </section>
          )}

          {tab === "analytics" && (
            <div className="grid gap-6 lg:grid-cols-2">
              <section className="glass rounded-[1.75rem] p-6">
                <h2 className="font-display text-lg font-semibold">
                  Attendance trends
                </h2>
                <HouseholdAttendanceChart
                  data={profile.analytics.attendanceTrend}
                  className="mt-4 h-[240px]"
                />
              </section>
              <section className="glass rounded-[1.75rem] p-6">
                <h2 className="font-display text-lg font-semibold">
                  Giving trends
                </h2>
                <HouseholdGivingChart
                  data={profile.analytics.givingTrend}
                  className="mt-4 h-[240px]"
                />
              </section>
              <section className="glass rounded-[1.75rem] p-6 lg:col-span-2">
                <h2 className="font-display text-lg font-semibold">
                  Household growth
                </h2>
                <HouseholdGrowthChart
                  data={profile.analytics.growthTimeline}
                  className="mt-4 h-[260px]"
                />
              </section>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function AssignCellLeaderDialog({
  householdId,
  currentLeaderId,
  onDone,
}: {
  householdId: string;
  currentLeaderId: string | null;
  onDone: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [leaderId, setLeaderId] = useState(currentLeaderId ?? "");
  const [pending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="glass" size="sm">
          <UserCog className="h-4 w-4" />
          Assign cell leader
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Assign cell leader</DialogTitle>
        <form
          className="mt-4 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            startTransition(async () => {
              await updateHouseholdAction(householdId, {
                assignedCellLeaderId: leaderId.trim() || null,
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
              value={leaderId}
              onChange={(e) => setLeaderId(e.target.value)}
              placeholder="Leave empty to clear"
            />
          </div>
          <Button type="submit" disabled={pending}>
            Save
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddNoteForm({
  householdId,
  onDone,
}: {
  householdId: string;
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="glass rounded-[1.75rem] p-6"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          await addHouseholdNoteAction(householdId, {
            body: String(fd.get("body") ?? ""),
            visibility: fd.get("visibility") as NoteVisibility,
          });
          e.currentTarget.reset();
          onDone();
        });
      }}
    >
      <h2 className="font-display text-lg font-semibold">Add note</h2>
      <div className="mt-4 space-y-4">
        <Textarea name="body" rows={4} required placeholder="Write a note…" />
        <Select name="visibility" defaultValue={NoteVisibility.PRIVATE}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.values(NoteVisibility).map((v) => (
              <SelectItem key={v} value={v}>
                {NOTE_VISIBILITY_LABELS[v]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="submit" disabled={pending}>
          Save note
        </Button>
      </div>
    </form>
  );
}

function UploadDocumentForm({
  householdId,
  onDone,
}: {
  householdId: string;
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="glass rounded-[1.75rem] p-6"
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const fd = new FormData(form);
        startTransition(async () => {
          await uploadHouseholdDocumentAction(householdId, fd);
          form.reset();
          onDone();
        });
      }}
    >
      <h2 className="font-display text-lg font-semibold">Upload document</h2>
      <div className="mt-4 space-y-4">
        <Input name="file" type="file" required />
        <Select name="type" defaultValue={DocumentType.OTHER}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.values(DocumentType).map((t) => (
              <SelectItem key={t} value={t}>
                {t.replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="submit" disabled={pending}>
          Upload
        </Button>
      </div>
    </form>
  );
}
