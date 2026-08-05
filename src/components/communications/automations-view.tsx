"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ArrowLeft, Loader2, Plus, Zap } from "lucide-react";
import {
  createAutomationAction,
  fireAutomationAction,
  listAutomationsAction,
  updateAutomationAction,
} from "@/application/communications/actions";
import {
  CHANNEL_OPTIONS,
  channelLabel,
} from "@/components/communications/utils";
import { FadeIn } from "@/components/motion/page-transition";
import { ErrorState, LoadingState } from "@/components/shared/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CommunicationAutomationEntity } from "@/domain/entities/communication";
import {
  HubAutomationTrigger,
  HubChannel,
  HUB_TRIGGER_LABELS,
} from "@/domain/enums/communication";

type SerializedAutomation = Omit<
  CommunicationAutomationEntity,
  "lastFiredAt" | "createdAt" | "updatedAt"
> & {
  lastFiredAt: string | null;
  createdAt: string;
  updatedAt: string;
};

const TRIGGERS = Object.values(HubAutomationTrigger);

export function AutomationsView() {
  const [automations, setAutomations] = useState<SerializedAutomation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    trigger: HubAutomationTrigger.NEW_VISITOR,
    channel: HubChannel.EMAIL,
    subject: "Welcome, {{FirstName}}!",
    body: "We're glad you visited {{ChurchName}}. Reply anytime — we're here for you.",
  });

  const load = useCallback(async () => {
    const res = await listAutomationsAction();
    if (!res.ok) {
      setError(res.error);
      setLoading(false);
      return;
    }
    setAutomations(
      JSON.parse(JSON.stringify(res.data)) as SerializedAutomation[]
    );
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <LoadingState label="Loading automations…" />;
  if (error && automations.length === 0) {
    return <ErrorState description={error} onRetry={load} />;
  }

  return (
    <div className="space-y-6">
      <FadeIn>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/communications">
            <ArrowLeft className="h-4 w-4" />
            Hub
          </Link>
        </Button>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-semibold">Automations</h1>
            <p className="text-sm text-muted-foreground">
              Triggers across visitors, events, volunteers, attendance, and more
            </p>
          </div>
          <Button onClick={() => setShowForm((v) => !v)}>
            <Plus className="h-4 w-4" />
            New automation
          </Button>
        </div>
      </FadeIn>

      {showForm && (
        <div className="glass-strong space-y-3 rounded-[1.75rem] p-5">
          <div className="grid gap-3 md:grid-cols-2">
            <input
              className="rounded-xl border border-border/60 bg-background/50 px-3 py-2 text-sm md:col-span-2"
              placeholder="Automation name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            <select
              className="rounded-xl border border-border/60 bg-background/50 px-3 py-2 text-sm"
              value={form.trigger}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  trigger: e.target.value as HubAutomationTrigger,
                }))
              }
            >
              {TRIGGERS.map((t) => (
                <option key={t} value={t}>
                  {HUB_TRIGGER_LABELS[t]}
                </option>
              ))}
            </select>
            <select
              className="rounded-xl border border-border/60 bg-background/50 px-3 py-2 text-sm"
              value={form.channel}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  channel: e.target.value as HubChannel,
                }))
              }
            >
              {CHANNEL_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {channelLabel(c)}
                </option>
              ))}
            </select>
            <input
              className="rounded-xl border border-border/60 bg-background/50 px-3 py-2 text-sm md:col-span-2"
              value={form.subject}
              onChange={(e) =>
                setForm((f) => ({ ...f, subject: e.target.value }))
              }
            />
            <textarea
              className="min-h-[100px] rounded-xl border border-border/60 bg-background/50 px-3 py-2 text-sm md:col-span-2"
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
            />
          </div>
          <Button
            disabled={pending || !form.name.trim()}
            onClick={() =>
              startTransition(async () => {
                const res = await createAutomationAction({
                  name: form.name.trim(),
                  trigger: form.trigger,
                  channel: form.channel,
                  subject: form.subject,
                  body: form.body,
                });
                if (!res.ok) {
                  setError(res.error);
                  return;
                }
                setShowForm(false);
                await load();
              })
            }
          >
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            Save automation
          </Button>
        </div>
      )}

      <div className="space-y-3">
        {automations.map((a) => (
          <article
            key={a.id}
            className="glass flex flex-col gap-3 rounded-[1.5rem] p-5 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="space-y-1">
              <div className="flex flex-wrap gap-2">
                <Badge variant={a.isActive ? "success" : "muted"}>
                  {a.isActive ? "Active" : "Paused"}
                </Badge>
                <Badge variant="outline">{channelLabel(a.channel)}</Badge>
                <Badge variant="secondary">
                  {HUB_TRIGGER_LABELS[a.trigger]}
                </Badge>
              </div>
              <h2 className="font-display text-lg font-semibold">{a.name}</h2>
              <p className="text-xs text-muted-foreground">
                {a.lastFiredAt
                  ? `Last fired ${format(new Date(a.lastFiredAt), "MMM d · h:mm a")}`
                  : "Never fired"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    const res = await updateAutomationAction({
                      automationId: a.id,
                      isActive: !a.isActive,
                    });
                    if (!res.ok) setError(res.error);
                    else await load();
                  })
                }
              >
                {a.isActive ? "Pause" : "Activate"}
              </Button>
              <Button
                size="sm"
                disabled={pending || !a.isActive}
                onClick={() =>
                  startTransition(async () => {
                    const res = await fireAutomationAction({
                      automationId: a.id,
                      FirstName: "Demo",
                      LastName: "Guest",
                    });
                    if (!res.ok) setError(res.error);
                    else await load();
                  })
                }
              >
                <Zap className="h-3.5 w-3.5" />
                Test fire
              </Button>
            </div>
          </article>
        ))}
      </div>
      {error && (
        <p className="text-sm text-amber-700 dark:text-amber-300">{error}</p>
      )}
    </div>
  );
}
