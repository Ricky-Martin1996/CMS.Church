"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  Loader2,
  Play,
  Plus,
  QrCode,
  Square,
} from "lucide-react";
import {
  closeSessionAction,
  createSessionAction,
  exportSessionCsvAction,
  listSessionsAction,
  startSessionAction,
} from "@/application/attendance/actions";
import { SessionStatusBadge } from "@/components/attendance/session-status-badge";
import {
  downloadCsv,
  formatSessionDate,
  formatSessionDateTime,
  formatSessionType,
  toIsoDateInput,
} from "@/components/attendance/utils";
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
import { ErrorState, LoadingState } from "@/components/shared/states";
import { FadeIn } from "@/components/motion/page-transition";
import type { AttendanceSessionEntity } from "@/domain/entities/attendance";
import {
  AttendanceSessionStatus,
  AttendanceSessionType,
  ATTENDANCE_SESSION_TYPE_LABELS,
} from "@/domain/enums/member";

export function SessionsView() {
  const [sessions, setSessions] = useState<AttendanceSessionEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);

  const load = useCallback(async () => {
    const res = await listSessionsAction({ limit: 100 });
    if (!res.ok) {
      setError(res.error);
    } else {
      setSessions(res.data);
      setError(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleStart = (sessionId: string) => {
    startTransition(async () => {
      const res = await startSessionAction(sessionId);
      if (!res.ok) setError(res.error);
      else load();
    });
  };

  const handleClose = (sessionId: string) => {
    startTransition(async () => {
      const res = await closeSessionAction(sessionId);
      if (!res.ok) setError(res.error);
      else load();
    });
  };

  const handleExport = (session: AttendanceSessionEntity) => {
    startTransition(async () => {
      const res = await exportSessionCsvAction(session.id);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      const filename = `${session.serviceName.replace(/\s+/g, "-")}-${formatSessionDate(session.date)}.csv`;
      downloadCsv(filename, res.data);
    });
  };

  if (loading) return <LoadingState label="Loading sessions…" />;

  return (
    <div className="space-y-6">
      <FadeIn>
        <Link
          href="/attendance"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Attendance
        </Link>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-primary">Sessions</p>
            <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Manage sessions
            </h1>
            <p className="text-muted-foreground">
              Create, start, and close attendance sessions.
            </p>
          </div>
          <CreateSessionDialog
            open={createOpen}
            onOpenChange={setCreateOpen}
            onCreated={() => {
              setCreateOpen(false);
              load();
            }}
          />
        </div>
      </FadeIn>

      {error && (
        <ErrorState description={error} onRetry={() => setError(null)} />
      )}

      <FadeIn delay={0.06}>
        <div className="glass-strong overflow-hidden rounded-[1.75rem]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-border/60 text-left text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Service</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Campus</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Expected</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sessions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-12 text-center text-muted-foreground"
                    >
                      No sessions yet. Create your first session.
                    </td>
                  </tr>
                ) : (
                  sessions.map((session) => (
                    <tr
                      key={session.id}
                      className="border-b border-border/40 transition-colors hover:bg-muted/30"
                    >
                      <td className="px-4 py-3 font-medium">
                        {session.serviceName}
                        {session.ministry && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            {session.ministry}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatSessionDateTime(session.date)}
                      </td>
                      <td className="px-4 py-3">
                        {formatSessionType(session.attendanceType)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {session.campus ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <SessionStatusBadge
                          status={session.status}
                          pulse={session.status === AttendanceSessionStatus.LIVE}
                        />
                      </td>
                      <td className="px-4 py-3 tabular-nums">
                        {session.expectedCount ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          {session.status === AttendanceSessionStatus.SCHEDULED && (
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={pending}
                              onClick={() => handleStart(session.id)}
                            >
                              <Play className="h-3.5 w-3.5" />
                              Start
                            </Button>
                          )}
                          {session.status === AttendanceSessionStatus.LIVE && (
                            <>
                              <Button variant="ghost" size="sm" asChild>
                                <Link
                                  href={`/attendance/check-in?sessionId=${session.id}`}
                                >
                                  <QrCode className="h-3.5 w-3.5" />
                                  Check-in
                                </Link>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={pending}
                                onClick={() => handleClose(session.id)}
                              >
                                <Square className="h-3.5 w-3.5" />
                                Close
                              </Button>
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={pending}
                            onClick={() => handleExport(session)}
                          >
                            <Download className="h-3.5 w-3.5" />
                            Export
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </FadeIn>
    </div>
  );
}

function CreateSessionDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [serviceName, setServiceName] = useState("Sunday Service");
  const [campus, setCampus] = useState("");
  const [ministry, setMinistry] = useState("");
  const [attendanceType, setAttendanceType] = useState<AttendanceSessionType>(
    AttendanceSessionType.SUNDAY
  );
  const [date, setDate] = useState(toIsoDateInput());
  const [expectedCount, setExpectedCount] = useState("");

  const reset = () => {
    setServiceName("Sunday Service");
    setCampus("");
    setMinistry("");
    setAttendanceType(AttendanceSessionType.SUNDAY);
    setDate(toIsoDateInput());
    setExpectedCount("");
    setError(null);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="glow" size="lg">
          <Plus className="h-4 w-4" />
          New session
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Create session</DialogTitle>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            startTransition(async () => {
              const res = await createSessionAction({
                serviceName: serviceName.trim(),
                campus: campus.trim() || undefined,
                ministry: ministry.trim() || undefined,
                date: new Date(date).toISOString(),
                attendanceType,
                expectedCount: expectedCount
                  ? Number(expectedCount)
                  : null,
              });
              if (!res.ok) {
                setError(res.error);
                return;
              }
              onCreated();
              reset();
            });
          }}
        >
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="session-name">Service name</Label>
            <Input
              id="session-name"
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="session-campus">Campus</Label>
              <Input
                id="session-campus"
                value={campus}
                onChange={(e) => setCampus(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="session-ministry">Ministry</Label>
              <Input
                id="session-ministry"
                value={ministry}
                onChange={(e) => setMinistry(e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="session-type">Type</Label>
              <Select
                value={attendanceType}
                onValueChange={(v) =>
                  setAttendanceType(v as AttendanceSessionType)
                }
              >
                <SelectTrigger id="session-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(AttendanceSessionType).map((type) => (
                    <SelectItem key={type} value={type}>
                      {ATTENDANCE_SESSION_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="session-expected">Expected count</Label>
              <Input
                id="session-expected"
                type="number"
                min={0}
                value={expectedCount}
                onChange={(e) => setExpectedCount(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="session-date">Date & time</Label>
            <Input
              id="session-date"
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <Button type="submit" variant="glow" className="w-full" disabled={pending}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            Create session
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
