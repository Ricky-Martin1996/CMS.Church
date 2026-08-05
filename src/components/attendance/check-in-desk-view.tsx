"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  Home,
  Loader2,
  QrCode,
  Search,
  Undo2,
  UserPlus,
  UserRound,
} from "lucide-react";
import {
  checkInByQrAction,
  checkInHouseholdAction,
  checkInMemberAction,
  getActiveLiveSessionAction,
  getHouseholdPreviewAction,
  getLiveStatsAction,
  listSessionsAction,
  registerVisitorCheckInAction,
  searchHouseholdsAction,
  searchMembersAction,
  undoCheckInAction,
} from "@/application/attendance/actions";
import { HouseholdCheckinPanel } from "@/components/attendance/household-checkin-panel";
import { LiveStatsHeader } from "@/components/attendance/live-stats-header";
import { SessionStatusBadge } from "@/components/attendance/session-status-badge";
import {
  VisitorCheckinForm,
  type VisitorFormData,
} from "@/components/attendance/visitor-checkin-form";
import {
  formatCheckInTime,
  formatMethod,
  getInitials,
} from "@/components/attendance/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ErrorState, LoadingState } from "@/components/shared/states";
import { FadeIn } from "@/components/motion/page-transition";
import type {
  AttendanceSessionEntity,
  HouseholdCheckInPreview,
  HouseholdCheckInSearchResult,
  MemberCheckInSearchResult,
  SessionLiveStats,
} from "@/domain/entities/attendance";
import {
  AttendanceMethod,
  AttendanceSessionStatus,
} from "@/domain/enums/member";
import { cn } from "@/lib/utils";

type CheckInMethod = "qr" | "search" | "household" | "manual" | "visitor";

function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function SuccessFlash({
  name,
  onDone,
}: {
  name: string;
  onDone: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onDone, 900);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-background/40 backdrop-blur-sm"
    >
      <div className="relative glass-strong rounded-[2rem] px-10 py-8 text-center shadow-[var(--shadow-float)]">
        {[...Array(8)].map((_, i) => (
          <motion.span
            key={i}
            className="absolute h-2 w-2 rounded-full bg-primary"
            initial={{ opacity: 1, x: 0, y: 0 }}
            animate={{
              opacity: 0,
              x: Math.cos((i / 8) * Math.PI * 2) * 60,
              y: Math.sin((i / 8) * Math.PI * 2) * 60,
            }}
            transition={{ duration: 0.6 }}
            style={{ left: "50%", top: "50%" }}
          />
        ))}
        <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
        <p className="mt-3 font-display text-2xl font-semibold">Welcome!</p>
        <p className="mt-1 text-muted-foreground">{name}</p>
      </div>
    </motion.div>
  );
}

const METHOD_TABS: {
  id: CheckInMethod;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "qr", label: "QR", icon: QrCode },
  { id: "search", label: "Search", icon: Search },
  { id: "household", label: "Household", icon: Home },
  { id: "manual", label: "Manual", icon: UserRound },
  { id: "visitor", label: "Visitor", icon: UserPlus },
];

export function CheckInDeskView() {
  const searchParams = useSearchParams();
  const sessionIdParam = searchParams.get("sessionId");

  const [sessions, setSessions] = useState<AttendanceSessionEntity[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(sessionIdParam);
  const [liveStats, setLiveStats] = useState<SessionLiveStats | null>(null);
  const [method, setMethod] = useState<CheckInMethod>("qr");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [successName, setSuccessName] = useState<string | null>(null);

  const qrInputRef = useRef<HTMLInputElement>(null);
  const [qrToken, setQrToken] = useState("");
  const [householdPreview, setHouseholdPreview] =
    useState<HouseholdCheckInPreview | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    MemberCheckInSearchResult[]
  >([]);
  const debouncedSearch = useDebounce(searchQuery);

  const [householdQuery, setHouseholdQuery] = useState("");
  const [householdResults, setHouseholdResults] = useState<
    HouseholdCheckInSearchResult[]
  >([]);
  const debouncedHousehold = useDebounce(householdQuery);

  const [manualQuery, setManualQuery] = useState("");
  const [manualResults, setManualResults] = useState<
    MemberCheckInSearchResult[]
  >([]);
  const [manualNotes, setManualNotes] = useState("");
  const debouncedManual = useDebounce(manualQuery);

  const activeSession = useMemo(
    () => sessions.find((s) => s.id === sessionId) ?? null,
    [sessions, sessionId]
  );

  const isLive = activeSession?.status === AttendanceSessionStatus.LIVE;

  const loadSessions = useCallback(async () => {
    const [listRes, liveRes] = await Promise.all([
      listSessionsAction({ limit: 50 }),
      getActiveLiveSessionAction(),
    ]);

    if (!listRes.ok) {
      setError(listRes.error);
      setLoading(false);
      return;
    }

    setSessions(listRes.data);

    if (sessionIdParam && listRes.data.some((s) => s.id === sessionIdParam)) {
      setSessionId(sessionIdParam);
    } else if (liveRes.ok && liveRes.data) {
      setSessionId(liveRes.data.id);
    } else {
      const live = listRes.data.find(
        (s) => s.status === AttendanceSessionStatus.LIVE
      );
      if (live) setSessionId(live.id);
    }

    setLoading(false);
  }, [sessionIdParam]);

  const refreshStats = useCallback(async (sid: string) => {
    const res = await getLiveStatsAction(sid);
    if (res.ok) setLiveStats(res.data);
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    if (!sessionId) return;
    refreshStats(sessionId);
  }, [sessionId, refreshStats]);

  useEffect(() => {
    if (!sessionId || !isLive) return;
    const tick = () => {
      if (typeof document !== "undefined" && document.hidden) return;
      refreshStats(sessionId);
    };
    const interval = setInterval(tick, 5000);
    const onVisibility = () => {
      if (!document.hidden) refreshStats(sessionId);
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [sessionId, isLive, refreshStats]);

  useEffect(() => {
    if (method === "qr") qrInputRef.current?.focus();
  }, [method, householdPreview, successName]);

  useEffect(() => {
    if (debouncedSearch.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    searchMembersAction(debouncedSearch, 12).then((res) => {
      if (res.ok) setSearchResults(res.data);
    });
  }, [debouncedSearch]);

  useEffect(() => {
    if (debouncedHousehold.trim().length < 2) {
      setHouseholdResults([]);
      return;
    }
    searchHouseholdsAction(debouncedHousehold, 10).then((res) => {
      if (res.ok) setHouseholdResults(res.data);
    });
  }, [debouncedHousehold]);

  useEffect(() => {
    if (debouncedManual.trim().length < 2) {
      setManualResults([]);
      return;
    }
    searchMembersAction(debouncedManual, 8).then((res) => {
      if (res.ok) setManualResults(res.data);
    });
  }, [debouncedManual]);

  const showSuccess = (name: string) => {
    setSuccessName(name);
    setQrToken("");
    setHouseholdPreview(null);
    setSearchQuery("");
    setHouseholdQuery("");
    if (sessionId) refreshStats(sessionId);
  };

  const handleQrSubmit = () => {
    if (!sessionId || !qrToken.trim()) return;
    startTransition(async () => {
      const res = await checkInByQrAction(sessionId, qrToken.trim());
      if (!res.ok) {
        setError(res.error);
        return;
      }
      if (res.data.kind === "member") {
        showSuccess(
          `${res.data.member.firstName} ${res.data.member.lastName}`
        );
      } else if (res.data.autoCheckedIn) {
        showSuccess(res.data.autoCheckedIn.familyName);
      } else {
        setHouseholdPreview(res.data.preview);
      }
    });
  };

  const handleMemberCheckIn = (
    member: MemberCheckInSearchResult,
    checkMethod: AttendanceMethod,
    notes?: string
  ) => {
    if (!sessionId) return;
    startTransition(async () => {
      const res = await checkInMemberAction(sessionId, {
        memberId: member.id,
        method: checkMethod,
        householdId: member.householdId,
        notes,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      showSuccess(`${member.firstName} ${member.lastName}`);
    });
  };

  const handleHouseholdSelect = (household: HouseholdCheckInSearchResult) => {
    if (!sessionId) return;
    startTransition(async () => {
      const res = await getHouseholdPreviewAction(sessionId, household.id);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setHouseholdPreview(res.data);
      setHouseholdResults([]);
      setHouseholdQuery(household.familyName);
    });
  };

  const handleHouseholdSubmit = (memberIds: string[]) => {
    if (!sessionId || !householdPreview) return;
    startTransition(async () => {
      const res = await checkInHouseholdAction(sessionId, {
        householdId: householdPreview.householdId,
        memberIds,
        method: AttendanceMethod.HOUSEHOLD,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      showSuccess(householdPreview.familyName);
    });
  };

  const handleVisitorSubmit = (data: VisitorFormData) => {
    if (!sessionId) return;
    startTransition(async () => {
      const res = await registerVisitorCheckInAction(sessionId, data);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      showSuccess(`${data.firstName} ${data.lastName}`);
    });
  };

  const handleUndo = (memberId: string) => {
    if (!sessionId) return;
    startTransition(async () => {
      const res = await undoCheckInAction(sessionId, memberId);
      if (!res.ok) setError(res.error);
      else refreshStats(sessionId);
    });
  };

  if (loading) return <LoadingState label="Loading check-in desk…" />;

  if (!sessionId || !activeSession) {
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <FadeIn>
          <Link
            href="/attendance"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Attendance
          </Link>
          <div className="mt-4 space-y-2">
            <h1 className="font-display text-3xl font-semibold">Check-in desk</h1>
            <p className="text-muted-foreground">
              No active session. Start a session to begin checking people in.
            </p>
          </div>
        </FadeIn>
        <Button variant="glow" size="lg" asChild>
          <Link href="/attendance/sessions">Manage sessions</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <AnimatePresence>
        {successName && (
          <SuccessFlash
            name={successName}
            onDone={() => setSuccessName(null)}
          />
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
        <div className="min-w-0 flex-1 space-y-4">
          <FadeIn>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Link
                href="/attendance"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Attendance
              </Link>
              <div className="flex items-center gap-2">
                <SessionStatusBadge status={activeSession.status} pulse={isLive} />
                <select
                  className="rounded-xl border border-border/60 bg-transparent px-3 py-1.5 text-sm"
                  value={sessionId}
                  onChange={(e) => {
                    setSessionId(e.target.value);
                    setHouseholdPreview(null);
                    setError(null);
                  }}
                  aria-label="Select session"
                >
                  {sessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.serviceName} ({s.status})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </FadeIn>

          {error && (
            <ErrorState
              description={error}
              onRetry={() => setError(null)}
            />
          )}

          {liveStats && (
            <FadeIn delay={0.04}>
              <div className="glass-strong rounded-[2rem] p-5 sm:p-6">
                <LiveStatsHeader
                  stats={liveStats}
                  serviceName={activeSession.serviceName}
                />
              </div>
            </FadeIn>
          )}

          <FadeIn delay={0.06}>
            <div className="glass-strong rounded-[2rem] p-4 sm:p-6">
              <div
                className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-5"
                role="tablist"
                aria-label="Check-in method"
              >
                {METHOD_TABS.map((tab) => {
                  const Icon = tab.icon;
                  const active = method === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => {
                        setMethod(tab.id);
                        setHouseholdPreview(null);
                        setError(null);
                      }}
                      className={cn(
                        "flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-2xl px-2 py-3 text-sm font-medium transition-colors",
                        active
                          ? "bg-primary text-primary-foreground shadow-[var(--shadow-glow)]"
                          : "bg-muted/40 text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {method === "qr" && !householdPreview && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="qr-token" className="text-base">
                      Scan or paste QR token
                    </Label>
                    <Input
                      ref={qrInputRef}
                      id="qr-token"
                      value={qrToken}
                      onChange={(e) => setQrToken(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleQrSubmit();
                        }
                      }}
                      placeholder="QR token…"
                      className="h-14 text-lg"
                      autoComplete="off"
                      autoFocus
                    />
                  </div>
                  <Button
                    variant="glow"
                    size="lg"
                    className="w-full"
                    disabled={pending || !qrToken.trim()}
                    onClick={handleQrSubmit}
                  >
                    {pending ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <QrCode className="h-5 w-5" />
                    )}
                    Check in
                  </Button>
                </div>
              )}

              {method === "qr" && householdPreview && (
                <HouseholdCheckinPanel
                  preview={householdPreview}
                  pending={pending}
                  onSubmit={handleHouseholdSubmit}
                  onCancel={() => setHouseholdPreview(null)}
                />
              )}

              {method === "search" && (
                <div className="space-y-4">
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, email, or phone…"
                    className="h-14 text-lg"
                    autoFocus
                  />
                  <ul className="max-h-[360px] space-y-2 overflow-y-auto">
                    {searchResults.map((member) => (
                      <li key={member.id}>
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() =>
                            handleMemberCheckIn(
                              member,
                              AttendanceMethod.SEARCH
                            )
                          }
                          className="flex w-full items-center gap-3 rounded-2xl border border-border/60 p-4 text-left transition-colors hover:border-primary/30 hover:bg-primary/5 active:scale-[0.99]"
                        >
                          <Avatar className="h-12 w-12 rounded-xl">
                            {member.avatarUrl && (
                              <AvatarImage src={member.avatarUrl} alt="" />
                            )}
                            <AvatarFallback className="rounded-xl">
                              {getInitials(member.firstName, member.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="text-base font-medium">
                              {member.firstName} {member.lastName}
                            </p>
                            <p className="truncate text-sm text-muted-foreground">
                              {member.householdName ?? member.email ?? member.phone}
                            </p>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {method === "household" && !householdPreview && (
                <div className="space-y-4">
                  <Input
                    value={householdQuery}
                    onChange={(e) => setHouseholdQuery(e.target.value)}
                    placeholder="Search household by name or code…"
                    className="h-14 text-lg"
                    autoFocus
                  />
                  <ul className="max-h-[360px] space-y-2 overflow-y-auto">
                    {householdResults.map((hh) => (
                      <li key={hh.id}>
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => handleHouseholdSelect(hh)}
                          className="flex w-full items-center justify-between gap-3 rounded-2xl border border-border/60 p-4 text-left transition-colors hover:border-primary/30 hover:bg-primary/5"
                        >
                          <div>
                            <p className="font-medium">{hh.familyName}</p>
                            <p className="text-sm text-muted-foreground">
                              {hh.householdCode} · {hh.memberCount} members
                            </p>
                          </div>
                          {hh.headName && (
                            <span className="text-sm text-muted-foreground">
                              {hh.headName}
                            </span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {method === "household" && householdPreview && (
                <HouseholdCheckinPanel
                  preview={householdPreview}
                  pending={pending}
                  onSubmit={handleHouseholdSubmit}
                  onCancel={() => setHouseholdPreview(null)}
                />
              )}

              {method === "manual" && (
                <div className="space-y-4">
                  <Input
                    value={manualQuery}
                    onChange={(e) => setManualQuery(e.target.value)}
                    placeholder="Find member…"
                    className="h-12"
                  />
                  <Textarea
                    value={manualNotes}
                    onChange={(e) => setManualNotes(e.target.value)}
                    placeholder="Optional notes"
                    rows={2}
                  />
                  <ul className="space-y-2">
                    {manualResults.map((member) => (
                      <li key={member.id}>
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() =>
                            handleMemberCheckIn(
                              member,
                              AttendanceMethod.MANUAL,
                              manualNotes || undefined
                            )
                          }
                          className="flex w-full items-center gap-3 rounded-2xl border border-border/60 p-3 text-left hover:bg-muted/50"
                        >
                          <span className="font-medium">
                            {member.firstName} {member.lastName}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {method === "visitor" && (
                <VisitorCheckinForm
                  onSubmit={handleVisitorSubmit}
                  pending={pending}
                />
              )}
            </div>
          </FadeIn>
        </div>

        <aside className="w-full shrink-0 lg:w-80">
          <FadeIn delay={0.1}>
            <div className="glass-strong sticky top-4 rounded-[1.75rem] p-4">
              <h2 className="font-display text-sm font-semibold">
                Recent check-ins
              </h2>
              <ul className="mt-3 max-h-[min(70vh,520px)] space-y-2 overflow-y-auto">
                {liveStats?.recentCheckIns.length ? (
                  liveStats.recentCheckIns.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center gap-3 rounded-xl bg-muted/30 p-2.5"
                    >
                      <Avatar className="h-9 w-9 rounded-lg">
                        {item.avatarUrl && (
                          <AvatarImage src={item.avatarUrl} alt="" />
                        )}
                        <AvatarFallback className="rounded-lg text-xs">
                          {getInitials(item.firstName, item.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {item.firstName} {item.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatMethod(item.method)} ·{" "}
                          {formatCheckInTime(item.attendedAt)}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Undo check-in for ${item.firstName}`}
                        disabled={pending}
                        onClick={() => handleUndo(item.memberId)}
                      >
                        <Undo2 className="h-3.5 w-3.5" />
                      </Button>
                    </li>
                  ))
                ) : (
                  <li className="py-8 text-center text-sm text-muted-foreground">
                    No check-ins yet
                  </li>
                )}
              </ul>
            </div>
          </FadeIn>
        </aside>
      </div>
    </>
  );
}
