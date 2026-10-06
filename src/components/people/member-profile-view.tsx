"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  Heart,
  Loader2,
  Mail,
  MessageCircle,
  Phone,
  Printer,
  QrCode,
  RefreshCw,
  UserPlus,
  Users,
} from "lucide-react";
import {
  addNoteAction,
  addVolunteerAction,
  createPrayerAction,
  linkFamilyAction,
  quickActionLog,
  recordAttendanceAction,
  regenerateInsightsAction,
  updateMemberAction,
  uploadDocumentAction,
} from "@/application/people/actions";
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
import {
  AttendanceTrendChart,
  GivingTrendChart,
  ScoreBar,
} from "@/components/people/member-charts";
import {
  MemberLifecycleBadge,
  MemberStatusBadge,
} from "@/components/people/member-status-badge";
import { formatMemberDate, getInitials } from "@/components/people/utils";
import { FadeIn } from "@/components/motion/page-transition";

const MemberQrDialog = dynamic(
  () =>
    import("@/components/people/member-qr-dialog").then((m) => ({
      default: m.MemberQrDialog,
    })),
  { ssr: false }
);
import type { MemberProfile } from "@/domain/entities/member";
import {
  ACTIVITY_TYPE_LABELS,
  ActivityType,
  AttendanceMethod,
  DocumentType,
  FamilyRelation,
  FAMILY_RELATION_LABELS,
  NOTE_VISIBILITY_LABELS,
  NoteVisibility,
} from "@/domain/enums/member";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";

type SerializedProfile = Omit<
  MemberProfile,
  | "dateOfBirth"
  | "baptismDate"
  | "joinedAt"
  | "createdAt"
  | "updatedAt"
  | "activities"
  | "notes"
  | "documents"
  | "attendance"
  | "giving"
  | "prayers"
  | "volunteers"
> & {
  dateOfBirth: string | null;
  baptismDate: string | null;
  joinedAt: string | null;
  createdAt: string;
  updatedAt: string;
  activities: Array<
    Omit<MemberProfile["activities"][number], "occurredAt"> & {
      occurredAt: string;
    }
  >;
  notes: Array<
    Omit<MemberProfile["notes"][number], "createdAt" | "updatedAt"> & {
      createdAt: string;
      updatedAt: string;
    }
  >;
  documents: Array<
    Omit<MemberProfile["documents"][number], "createdAt"> & {
      createdAt: string;
    }
  >;
  attendance: Array<
    Omit<MemberProfile["attendance"][number], "attendedAt"> & {
      attendedAt: string;
    }
  >;
  giving: Array<
    Omit<MemberProfile["giving"][number], "givenAt"> & {
      givenAt: string;
    }
  >;
  prayers: Array<
    Omit<MemberProfile["prayers"][number], "createdAt" | "answeredAt"> & {
      createdAt: string;
      answeredAt: string | null;
    }
  >;
  volunteers: Array<
    Omit<MemberProfile["volunteers"][number], "startedAt" | "endedAt"> & {
      startedAt: string;
      endedAt: string | null;
    }
  >;
};

const TABS = [
  "overview",
  "timeline",
  "family",
  "documents",
  "notes",
  "attendance",
  "giving",
  "volunteers",
  "prayer",
  "insights",
  "analytics",
  "communication",
] as const;

type TabId = (typeof TABS)[number];

const TAB_LABELS: Record<TabId, string> = {
  overview: "Overview",
  timeline: "Timeline",
  family: "Family",
  documents: "Documents",
  notes: "Notes",
  attendance: "Attendance",
  giving: "Giving",
  volunteers: "Volunteers",
  prayer: "Prayer",
  insights: "AI Insights",
  analytics: "Analytics",
  communication: "Communication",
};

const COMM_TYPES = [
  ActivityType.EMAIL_SENT,
  ActivityType.CALL_LOGGED,
  ActivityType.WHATSAPP_SENT,
];

export function MemberProfileView({
  profile: initial,
  justCreated = false,
}: {
  profile: SerializedProfile;
  justCreated?: boolean;
}) {
  const [profile, setProfile] = useState(initial);
  const [tab, setTab] = useState<TabId>("overview");
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [createToast, setCreateToast] = useState(
    justCreated ? "Member created successfully." : null
  );
  const coverBackground = safeBackgroundImage(profile.coverUrl);

  useEffect(() => {
    if (!justCreated || typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (url.searchParams.has("created")) {
      url.searchParams.delete("created");
      window.history.replaceState({}, "", url.pathname + url.search);
    }
  }, [justCreated]);

  useEffect(() => {
    if (!createToast) return;
    const t = window.setTimeout(() => setCreateToast(null), 6_000);
    return () => window.clearTimeout(t);
  }, [createToast]);

  const refresh = () => {
    window.location.reload();
  };

  const logAction = (
    action: "email" | "call" | "whatsapp" | "visit",
    detail?: string
  ) => {
    startTransition(async () => {
      await quickActionLog(profile.id, action, detail);
      setMessage(`${action} logged`);
    });
  };

  const statCards = [
    {
      label: "Engagement",
      value: profile.analytics.engagementScore,
      variant: "default" as const,
    },
    {
      label: "Growth",
      value: profile.analytics.growthScore,
      variant: "default" as const,
    },
    {
      label: "Risk",
      value: profile.analytics.riskScore,
      variant: "risk" as const,
    },
    {
      label: "Attendance 90d",
      value: profile.analytics.attendanceCount90d,
      isCount: true,
    },
    {
      label: "Giving 90d",
      value: profile.analytics.givingTotalCents90d,
      isCurrency: true,
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {createToast && (
        <div
          className="rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-foreground"
          role="status"
          data-testid="member-create-toast"
          aria-live="polite"
        >
          {createToast}
        </div>
      )}

      <FadeIn>
        <Link
          href="/people"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to People
        </Link>
      </FadeIn>

      <FadeIn delay={0.04}>
        <div className="relative overflow-hidden rounded-[2rem] glass-strong">
          <div
            className="h-40 sm:h-52"
            style={
              coverBackground
                ? {
                    backgroundImage: coverBackground,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }
                : undefined
            }
          >
            {!coverBackground && (
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
                <Avatar className="h-24 w-24 border-4 border-background sm:h-28 sm:w-28">
                  {profile.avatarUrl && (
                    <AvatarImage src={profile.avatarUrl} alt="" />
                  )}
                  <AvatarFallback className="text-2xl">
                    {getInitials(profile.displayName)}
                  </AvatarFallback>
                </Avatar>
                <div className="pb-1">
                  <h1 className="font-display text-2xl font-semibold sm:text-3xl">
                    {profile.displayName}
                  </h1>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <MemberStatusBadge status={profile.status} />
                    <MemberLifecycleBadge lifecycle={profile.lifecycle} />
                    {profile.campus && (
                      <Badge variant="outline">{profile.campus}</Badge>
                    )}
                    {profile.ministryRole && (
                      <Badge variant="outline">{profile.ministryRole}</Badge>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {profile.tags.map((t) => (
                      <Badge
                        key={t.id}
                        variant="outline"
                        style={{ borderColor: t.color, color: t.color }}
                      >
                        {t.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {statCards.map((card) => (
                <div
                  key={card.label}
                  className="glass rounded-2xl p-4 shadow-[var(--shadow-soft)]"
                >
                  {"variant" in card && card.variant ? (
                    <ScoreBar
                      label={card.label}
                      value={card.value}
                      variant={card.variant}
                    />
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

      <FadeIn delay={0.08}>
        <div className="flex flex-wrap gap-2">
          {profile.email && (
            <Button
              variant="glass"
              size="sm"
              onClick={() => {
                window.open(`mailto:${profile.email}`, "_blank");
                logAction("email", profile.email!);
              }}
            >
              <Mail className="h-4 w-4" />
              Email
            </Button>
          )}
          {profile.phone && (
            <Button
              variant="glass"
              size="sm"
              onClick={() => {
                window.open(`tel:${profile.phone}`, "_blank");
                logAction("call", profile.phone!);
              }}
            >
              <Phone className="h-4 w-4" />
              Call
            </Button>
          )}
          {(profile.whatsapp || profile.phone) && (
            <Button
              variant="glass"
              size="sm"
              onClick={() => {
                const num = (profile.whatsapp ?? profile.phone)!.replace(
                  /\D/g,
                  ""
                );
                window.open(`https://wa.me/${num}`, "_blank");
                logAction("whatsapp");
              }}
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </Button>
          )}

          <AssignLeaderDialog
            memberId={profile.id}
            currentLeaderId={profile.assignedLeaderId}
            onDone={refresh}
          />

          <PrayerDialog memberId={profile.id} onDone={refresh} />

          <Button
            variant="glass"
            size="sm"
            onClick={() => logAction("visit")}
          >
            <Calendar className="h-4 w-4" />
            Schedule visit
          </Button>

          <RecordAttendanceDialog memberId={profile.id} onDone={refresh} />

          <MemberQrDialog
            qrToken={profile.qrToken}
            displayName={profile.displayName}
            trigger={
              <Button variant="glass" size="sm">
                <QrCode className="h-4 w-4" />
                QR Code
              </Button>
            }
          />

          <Button
            variant="glass"
            size="sm"
            onClick={() => window.print()}
          >
            <Printer className="h-4 w-4" />
            Print card
          </Button>
        </div>
        {message && (
          <p className="mt-2 text-xs text-muted-foreground">{message}</p>
        )}
      </FadeIn>

      <FadeIn delay={0.12}>
        <div className="relative">
          <div className="flex gap-1 overflow-x-auto rounded-2xl glass p-1 scrollbar-none">
            {TABS.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={cn(
                  "relative shrink-0 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                  tab === id
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab === id && (
                  <motion.span
                    layoutId="member-tab-indicator"
                    className="absolute inset-0 rounded-xl bg-primary/10"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative">{TAB_LABELS[id]}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6">
          {tab === "overview" && (
            <OverviewTab profile={profile} />
          )}
          {tab === "timeline" && (
            <TimelineTab activities={profile.activities} />
          )}
          {tab === "family" && (
            <FamilyTab profile={profile} onDone={refresh} />
          )}
          {tab === "documents" && (
            <DocumentsTab profile={profile} onDone={refresh} />
          )}
          {tab === "notes" && (
            <NotesTab profile={profile} onDone={refresh} />
          )}
          {tab === "attendance" && (
            <AttendanceTab profile={profile} onDone={refresh} />
          )}
          {tab === "giving" && <GivingTab profile={profile} />}
          {tab === "volunteers" && (
            <VolunteersTab profile={profile} onDone={refresh} />
          )}
          {tab === "prayer" && (
            <PrayerTab profile={profile} onDone={refresh} />
          )}
          {tab === "insights" && (
            <InsightsTab
              profile={profile}
              pending={pending}
              onRegenerate={() => {
                startTransition(async () => {
                  const res = await regenerateInsightsAction(profile.id);
                  if (!res.ok || !res.data) return;
                  const insights = res.data;
                  setProfile((p) => ({
                    ...p,
                    aiInsights: insights,
                    aiSummary: insights.summary,
                  }));
                });
              }}
            />
          )}
          {tab === "analytics" && <AnalyticsTab profile={profile} />}
          {tab === "communication" && (
            <TimelineTab
              activities={profile.activities.filter((a) =>
                COMM_TYPES.includes(a.type)
              )}
              emptyMessage="No communication history yet"
            />
          )}
        </div>
      </FadeIn>
    </div>
  );
}

function OverviewTab({ profile }: { profile: SerializedProfile }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="glass rounded-[1.75rem] p-6">
        <h2 className="font-display text-lg font-semibold">Contact</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Email</dt>
            <dd>{profile.email ?? "—"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Phone</dt>
            <dd>{profile.phone ?? "—"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">WhatsApp</dt>
            <dd>{profile.whatsapp ?? "—"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Address</dt>
            <dd className="text-right">
              {[profile.addressLine1, profile.city, profile.state]
                .filter(Boolean)
                .join(", ") || "—"}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Joined</dt>
            <dd>{formatMemberDate(profile.joinedAt)}</dd>
          </div>
        </dl>
      </section>
      <section className="glass rounded-[1.75rem] p-6">
        <h2 className="font-display text-lg font-semibold">
          Emergency contact
        </h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Name</dt>
            <dd>{profile.emergencyName ?? "—"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Phone</dt>
            <dd>{profile.emergencyPhone ?? "—"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Relation</dt>
            <dd>{profile.emergencyRelation ?? "—"}</dd>
          </div>
        </dl>
      </section>
      {profile.aiSummary && (
        <section className="glass rounded-[1.75rem] p-6 lg:col-span-2">
          <h2 className="font-display text-lg font-semibold">AI summary</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {profile.aiSummary}
          </p>
        </section>
      )}
    </div>
  );
}

function TimelineTab({
  activities,
  emptyMessage = "No activity yet",
}: {
  activities: SerializedProfile["activities"];
  emptyMessage?: string;
}) {
  if (!activities.length) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {activities.map((a, i) => (
        <motion.li
          key={a.id}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: Math.min(i * 0.03, 0.3) }}
          className="glass flex gap-4 rounded-2xl p-4"
        >
          <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium">{a.title}</p>
              <Badge variant="muted" className="text-[10px]">
                {ACTIVITY_TYPE_LABELS[a.type]}
              </Badge>
            </div>
            {a.description && (
              <p className="mt-1 text-sm text-muted-foreground">
                {a.description}
              </p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              {formatMemberDate(a.occurredAt, "MMM d, yyyy · h:mm a")}
            </p>
          </div>
        </motion.li>
      ))}
    </ul>
  );
}

function FamilyTab({
  profile,
  onDone,
}: {
  profile: SerializedProfile;
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-6">
      {profile.family.household ? (
        <section className="glass rounded-[1.75rem] p-6">
          <h2 className="font-display text-lg font-semibold">
            {profile.family.household.name}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {[
              profile.family.household.addressLine1,
              profile.family.household.city,
            ]
              .filter(Boolean)
              .join(", ")}
          </p>
          <ul className="mt-4 space-y-2">
            {profile.family.members.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between rounded-xl bg-background/40 px-3 py-2 text-sm"
              >
                <span>
                  {m.member
                    ? `${m.member.firstName} ${m.member.lastName}`
                    : "Linked member"}
                </span>
                <Badge variant="outline">
                  {FAMILY_RELATION_LABELS[m.relation]}
                </Badge>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <p className="text-sm text-muted-foreground">No household linked yet.</p>
      )}

      <section className="glass rounded-[1.75rem] p-6">
        <h2 className="font-display text-lg font-semibold">Link family</h2>
        <form
          className="mt-4 grid gap-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            startTransition(async () => {
              await linkFamilyAction(profile.id, {
                name: String(fd.get("name")),
                relation: fd.get("relation") as FamilyRelation,
                addressLine1: String(fd.get("addressLine1") || "") || undefined,
                city: String(fd.get("city") || "") || undefined,
                relatedMemberId:
                  String(fd.get("relatedMemberId") || "") || undefined,
              });
              onDone();
            });
          }}
        >
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="householdName">Household name</Label>
            <Input id="householdName" name="name" required />
          </div>
          <div className="space-y-2">
            <Label>Relation</Label>
            <Select name="relation" defaultValue={FamilyRelation.HEAD}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(FamilyRelation).map((r) => (
                  <SelectItem key={r} value={r}>
                    {FAMILY_RELATION_LABELS[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="relatedMemberId">Related member ID</Label>
            <Input id="relatedMemberId" name="relatedMemberId" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="addressLine1">Address</Label>
            <Input id="addressLine1" name="addressLine1" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input id="city" name="city" />
          </div>
          <Button type="submit" disabled={pending} className="sm:col-span-2">
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            Link family
          </Button>
        </form>
      </section>
    </div>
  );
}

function DocumentsTab({
  profile,
  onDone,
}: {
  profile: SerializedProfile;
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-6">
      <ul className="space-y-2">
        {profile.documents.length === 0 ? (
          <p className="text-sm text-muted-foreground">No documents uploaded.</p>
        ) : (
          profile.documents.map((doc) => (
            <li
              key={doc.id}
              className="glass flex items-center justify-between rounded-2xl px-4 py-3 text-sm"
            >
              <div>
                <p className="font-medium">{doc.name}</p>
                <p className="text-xs text-muted-foreground">
                  {doc.type} · {formatMemberDate(doc.createdAt)}
                </p>
              </div>
              {doc.url && (
                <Button variant="ghost" size="sm" asChild>
                  <a href={doc.url} target="_blank" rel="noopener noreferrer">
                    View
                  </a>
                </Button>
              )}
            </li>
          ))
        )}
      </ul>

      <form
        className="glass space-y-4 rounded-[1.75rem] p-6"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          startTransition(async () => {
            await uploadDocumentAction(profile.id, fd);
            onDone();
          });
        }}
      >
        <h2 className="font-display text-lg font-semibold">Upload document</h2>
        <div className="space-y-2">
          <Label htmlFor="file">File</Label>
          <Input id="file" name="file" type="file" required />
        </div>
        <div className="space-y-2">
          <Label>Type</Label>
          <Select name="type" defaultValue={DocumentType.OTHER}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(DocumentType).map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Upload
        </Button>
      </form>
    </div>
  );
}

function NotesTab({
  profile,
  onDone,
}: {
  profile: SerializedProfile;
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-6">
      <ul className="space-y-3">
        {profile.notes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No notes yet.</p>
        ) : (
          profile.notes.map((note) => (
            <li key={note.id} className="glass rounded-2xl p-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {NOTE_VISIBILITY_LABELS[note.visibility]}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatMemberDate(note.createdAt, "MMM d, yyyy")}
                </span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm">{note.body}</p>
            </li>
          ))
        )}
      </ul>

      <form
        className="glass space-y-4 rounded-[1.75rem] p-6"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          startTransition(async () => {
            await addNoteAction(profile.id, {
              body: String(fd.get("body")),
              visibility: fd.get("visibility") as NoteVisibility,
            });
            onDone();
          });
        }}
      >
        <h2 className="font-display text-lg font-semibold">Add note</h2>
        <Textarea name="body" required rows={4} placeholder="Write a note…" />
        <div className="space-y-2">
          <Label>Visibility</Label>
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
        </div>
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Save note
        </Button>
      </form>
    </div>
  );
}

function AttendanceTab({
  profile,
  onDone,
}: {
  profile: SerializedProfile;
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Link
          href="/attendance/check-in"
          className="text-sm font-medium text-primary hover:underline"
        >
          Open Attendance desk →
        </Link>
      </div>
      <section className="glass rounded-[1.75rem] p-6">
        <h2 className="font-display text-lg font-semibold">Trend</h2>
        <AttendanceTrendChart
          data={profile.analytics.attendanceTrend}
          className="mt-4 h-[240px]"
        />
      </section>

      <section className="glass rounded-[1.75rem] p-6">
        <h2 className="font-display text-lg font-semibold">Recent</h2>
        <ul className="mt-4 space-y-2">
          {profile.attendance.slice(0, 10).map((a) => (
            <li
              key={a.id}
              className="flex justify-between text-sm"
            >
              <span>{a.eventName}</span>
              <span className="text-muted-foreground">
                {formatMemberDate(a.attendedAt)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <form
        className="glass space-y-4 rounded-[1.75rem] p-6"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          startTransition(async () => {
            await recordAttendanceAction(profile.id, {
              eventName: String(fd.get("eventName")),
              method: AttendanceMethod.MANUAL,
            });
            onDone();
          });
        }}
      >
        <h2 className="font-display text-lg font-semibold">Record attendance</h2>
        <Input name="eventName" placeholder="Event name" required />
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Record
        </Button>
      </form>
    </div>
  );
}

function GivingTab({ profile }: { profile: SerializedProfile }) {
  return (
    <div className="space-y-6">
      <section className="glass rounded-[1.75rem] p-6">
        <h2 className="font-display text-lg font-semibold">Giving trend</h2>
        <GivingTrendChart
          data={profile.analytics.givingTrend}
          className="mt-4 h-[240px]"
        />
      </section>
      {profile.giving.length > 0 && (
        <section className="glass rounded-[1.75rem] p-6">
          <h2 className="font-display text-lg font-semibold">Recent gifts</h2>
          <ul className="mt-4 space-y-2">
            {profile.giving.slice(0, 10).map((g) => (
              <li
                key={g.id}
                className="flex justify-between text-sm"
              >
                <span>
                  {g.fund} · {formatMemberDate(g.givenAt)}
                </span>
                <span className="font-medium tabular-nums">
                  {formatCurrency(g.amountCents / 100)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function VolunteersTab({
  profile,
  onDone,
}: {
  profile: SerializedProfile;
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-6">
      <ul className="space-y-2">
        {profile.volunteers.length === 0 ? (
          <p className="text-sm text-muted-foreground">No volunteer roles.</p>
        ) : (
          profile.volunteers.map((v) => (
            <li
              key={v.id}
              className="glass flex justify-between rounded-2xl px-4 py-3 text-sm"
            >
              <div>
                <p className="font-medium">{v.roleName}</p>
                {v.team && (
                  <p className="text-xs text-muted-foreground">{v.team}</p>
                )}
              </div>
              <Badge variant="outline">{v.status}</Badge>
            </li>
          ))
        )}
      </ul>

      <form
        className="glass space-y-4 rounded-[1.75rem] p-6"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          startTransition(async () => {
            await addVolunteerAction(profile.id, {
              roleName: String(fd.get("roleName")),
              team: String(fd.get("team") || "") || undefined,
            });
            onDone();
          });
        }}
      >
        <h2 className="font-display text-lg font-semibold">Add volunteer role</h2>
        <Input name="roleName" placeholder="Role name" required />
        <Input name="team" placeholder="Team (optional)" />
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Add role
        </Button>
      </form>
    </div>
  );
}

function PrayerTab({
  profile,
  onDone,
}: {
  profile: SerializedProfile;
  onDone: () => void;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-6">
      <ul className="space-y-3">
        {profile.prayers.length === 0 ? (
          <p className="text-sm text-muted-foreground">No prayer requests.</p>
        ) : (
          profile.prayers.map((p) => (
            <li key={p.id} className="glass rounded-2xl p-4">
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-primary" />
                <Badge variant="outline">{p.status}</Badge>
                <span className="text-xs text-muted-foreground">
                  {formatMemberDate(p.createdAt)}
                </span>
              </div>
              <p className="mt-2 text-sm">{p.request}</p>
            </li>
          ))
        )}
      </ul>

      <form
        className="glass space-y-4 rounded-[1.75rem] p-6"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          startTransition(async () => {
            await createPrayerAction(
              profile.id,
              String(fd.get("request"))
            );
            onDone();
          });
        }}
      >
        <h2 className="font-display text-lg font-semibold">Create prayer request</h2>
        <Textarea name="request" required rows={3} />
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Submit
        </Button>
      </form>
    </div>
  );
}

function InsightsTab({
  profile,
  pending,
  onRegenerate,
}: {
  profile: SerializedProfile;
  pending: boolean;
  onRegenerate: () => void;
}) {
  const insights = profile.aiInsights;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button variant="glass" size="sm" onClick={onRegenerate} disabled={pending}>
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Regenerate
        </Button>
      </div>

      {!insights ? (
        <p className="text-sm text-muted-foreground">
          No AI insights yet. Click regenerate to generate.
        </p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <InsightCard title="Summary" body={insights.summary} />
          <InsightCard title="Engagement" body={insights.engagementAnalysis} />
          <InsightCard
            title="Risk"
            body={`Score: ${insights.riskScore} — ${insights.riskReason}`}
          />
          <section className="glass rounded-[1.75rem] p-6">
            <h3 className="font-display font-semibold">Follow-ups</h3>
            <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-muted-foreground">
              {insights.followUps.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          </section>
          <section className="glass rounded-[1.75rem] p-6">
            <h3 className="font-display font-semibold">Next actions</h3>
            <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-muted-foreground">
              {insights.nextActions.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}

function InsightCard({ title, body }: { title: string; body: string }) {
  return (
    <section className="glass rounded-[1.75rem] p-6">
      <h3 className="font-display font-semibold">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </section>
  );
}

function AnalyticsTab({ profile }: { profile: SerializedProfile }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="glass rounded-2xl p-4">
          <ScoreBar
            label="Engagement"
            value={profile.analytics.engagementScore}
          />
        </div>
        <div className="glass rounded-2xl p-4">
          <ScoreBar label="Growth" value={profile.analytics.growthScore} />
        </div>
        <div className="glass rounded-2xl p-4">
          <ScoreBar
            label="Risk"
            value={profile.analytics.riskScore}
            variant="risk"
          />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="glass rounded-[1.75rem] p-6">
          <h2 className="font-display text-lg font-semibold">Attendance</h2>
          <AttendanceTrendChart
            data={profile.analytics.attendanceTrend}
            className="mt-4 h-[220px]"
          />
        </section>
        <section className="glass rounded-[1.75rem] p-6">
          <h2 className="font-display text-lg font-semibold">Giving</h2>
          <GivingTrendChart
            data={profile.analytics.givingTrend}
            className="mt-4 h-[220px]"
          />
        </section>
      </div>
    </div>
  );
}

function AssignLeaderDialog({
  memberId,
  currentLeaderId,
  onDone,
}: {
  memberId: string;
  currentLeaderId: string | null;
  onDone: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="glass" size="sm">
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
              await updateMemberAction(memberId, { assignedLeaderId: leaderId });
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
            />
          </div>
          <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            Save
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PrayerDialog({
  memberId,
  onDone,
}: {
  memberId: string;
  onDone: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="glass" size="sm">
          <Heart className="h-4 w-4" />
          Create prayer
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Create prayer request</DialogTitle>
        <form
          className="mt-4 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const request = String(new FormData(e.currentTarget).get("request"));
            startTransition(async () => {
              await createPrayerAction(memberId, request);
              setOpen(false);
              onDone();
            });
          }}
        >
          <Textarea name="request" required rows={4} />
          <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            Submit
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RecordAttendanceDialog({
  memberId,
  onDone,
}: {
  memberId: string;
  onDone: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="glass" size="sm">
          <Users className="h-4 w-4" />
          Record attendance
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Record attendance</DialogTitle>
        <form
          className="mt-4 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const eventName = String(
              new FormData(e.currentTarget).get("eventName")
            );
            startTransition(async () => {
              await recordAttendanceAction(memberId, {
                eventName,
                method: AttendanceMethod.MANUAL,
              });
              setOpen(false);
              onDone();
            });
          }}
        >
          <Input name="eventName" placeholder="Event name" required />
          <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            Record
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export type { SerializedProfile };
