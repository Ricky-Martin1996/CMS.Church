"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { motion } from "framer-motion";
import {
  Archive,
  Bell,
  CalendarClock,
  Loader2,
  Mail,
  MessageSquare,
  Plus,
  Send,
  Sparkles,
  Workflow,
} from "lucide-react";
import {
  archiveMessageAction,
  createCampaignAction,
  createMessageAction,
  getCommunicationAnalyticsAction,
  listCampaignsAction,
  listMessageCenterAction,
  sendCampaignAction,
  sendMessageAction,
} from "@/application/communications/actions";
import {
  AUDIENCE_OPTIONS,
  CHANNEL_OPTIONS,
  STATUS_FILTERS,
  audienceLabel,
  channelLabel,
  statusLabel,
  statusVariant,
} from "@/components/communications/utils";
import { KpiCard } from "@/components/dashboard/stat-card";
import { FadeIn, StaggerChildren, staggerItem } from "@/components/motion/page-transition";
import { ErrorState, LoadingState } from "@/components/shared/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type {
  CommunicationAnalytics,
  CommunicationCampaignEntity,
  CommunicationMessageEntity,
} from "@/domain/entities/communication";
import {
  HubAudienceType,
  HubChannel,
  HubMessageStatus,
} from "@/domain/enums/communication";
import { formatNumber } from "@/lib/utils";

type SerializedMessage = Omit<
  CommunicationMessageEntity,
  "scheduledFor" | "sentAt" | "failedAt" | "createdAt" | "updatedAt"
> & {
  scheduledFor: string | null;
  sentAt: string | null;
  failedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type SerializedCampaign = Omit<
  CommunicationCampaignEntity,
  "scheduledFor" | "sentAt" | "createdAt" | "updatedAt"
> & {
  scheduledFor: string | null;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type SerializedAnalytics = Omit<CommunicationAnalytics, "recentActivity"> & {
  recentActivity: Array<
    Omit<
      CommunicationAnalytics["recentActivity"][number],
      "occurredAt" | "createdAt"
    > & {
      occurredAt: string;
      createdAt: string;
    }
  >;
};

export function CommunicationsView() {
  const [messages, setMessages] = useState<SerializedMessage[]>([]);
  const [campaigns, setCampaigns] = useState<SerializedCampaign[]>([]);
  const [analytics, setAnalytics] = useState<SerializedAnalytics | null>(null);
  const [statusFilter, setStatusFilter] = useState<HubMessageStatus | "ALL">(
    "ALL"
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, startTransition] = useTransition();
  const [showComposer, setShowComposer] = useState(false);
  const [form, setForm] = useState({
    name: "",
    channel: HubChannel.EMAIL,
    audienceType: HubAudienceType.ALL_MEMBERS,
    subject: "",
    body: "Hi {{FirstName}},\n\n",
    scheduledFor: "",
    asCampaign: true,
  });

  const load = useCallback(async () => {
    const [msgRes, campRes, analyticsRes] = await Promise.all([
      listMessageCenterAction({
        status: statusFilter === "ALL" ? undefined : statusFilter,
        limit: 60,
      }),
      listCampaignsAction(),
      getCommunicationAnalyticsAction(),
    ]);

    if (!msgRes.ok) {
      setError(msgRes.error);
      setLoading(false);
      return;
    }
    if (!campRes.ok) {
      setError(campRes.error);
      setLoading(false);
      return;
    }
    if (!analyticsRes.ok) {
      setError(analyticsRes.error);
      setLoading(false);
      return;
    }

    setMessages(JSON.parse(JSON.stringify(msgRes.data)) as SerializedMessage[]);
    setCampaigns(
      JSON.parse(JSON.stringify(campRes.data)) as SerializedCampaign[]
    );
    setAnalytics(
      JSON.parse(JSON.stringify(analyticsRes.data)) as SerializedAnalytics
    );
    setError(null);
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const scheduled = useMemo(
    () =>
      [...messages, ...campaigns.map((c) => ({ ...c, kind: "campaign" as const }))]
        .filter((m) => m.status === "SCHEDULED" && m.scheduledFor)
        .sort(
          (a, b) =>
            new Date(a.scheduledFor!).getTime() -
            new Date(b.scheduledFor!).getTime()
        )
        .slice(0, 6),
    [messages, campaigns]
  );

  const save = (sendNow: boolean) => {
    if (!form.body.trim() || (!form.asCampaign && !form.subject && form.channel === HubChannel.EMAIL)) {
      // allow SMS without subject
    }
    startTransition(async () => {
      if (form.asCampaign) {
        if (!form.name.trim()) {
          setError("Campaign name is required");
          return;
        }
        const res = await createCampaignAction({
          name: form.name.trim(),
          channel: form.channel,
          audienceType: form.audienceType,
          subject: form.subject || undefined,
          body: form.body,
          scheduledFor: form.scheduledFor
            ? new Date(form.scheduledFor).toISOString()
            : null,
        });
        if (!res.ok) {
          setError(res.error);
          return;
        }
        if (sendNow) {
          const sent = await sendCampaignAction(res.data.id);
          if (!sent.ok) {
            setError(sent.error);
            return;
          }
        }
      } else {
        const res = await createMessageAction({
          channel: form.channel,
          audienceType: form.audienceType,
          subject: form.subject || undefined,
          body: form.body,
          scheduledFor: form.scheduledFor
            ? new Date(form.scheduledFor).toISOString()
            : null,
        });
        if (!res.ok) {
          setError(res.error);
          return;
        }
        if (sendNow) {
          const sent = await sendMessageAction(res.data.id);
          if (!sent.ok) {
            setError(sent.error);
            return;
          }
        }
      }
      setShowComposer(false);
      setForm({
        name: "",
        channel: HubChannel.EMAIL,
        audienceType: HubAudienceType.ALL_MEMBERS,
        subject: "",
        body: "Hi {{FirstName}},\n\n",
        scheduledFor: "",
        asCampaign: true,
      });
      await load();
    });
  };

  if (loading && !analytics) {
    return <LoadingState label="Loading communication hub…" />;
  }
  if (error && !analytics) {
    return <ErrorState description={error} onRetry={load} />;
  }

  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-primary">Connected modules</p>
            <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Communications
            </h1>
            <p className="max-w-2xl text-muted-foreground">
              Unified inbox, campaigns, templates, and automations across Email,
              WhatsApp, SMS, Push, and internal notifications.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href="/communications/templates">
                <Sparkles className="h-4 w-4" />
                Templates
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/communications/automations">
                <Workflow className="h-4 w-4" />
                Automations
              </Link>
            </Button>
            <Button variant="glow" onClick={() => setShowComposer((v) => !v)}>
              <Plus className="h-4 w-4" />
              Compose
            </Button>
          </div>
        </div>
      </FadeIn>

      {analytics && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <KpiCard
            label="Sent"
            value={formatNumber(analytics.sentCount)}
            icon={Send}
          />
          <KpiCard
            label="Delivery"
            value={`${analytics.deliveryRate}%`}
            icon={Mail}
          />
          <KpiCard
            label="Open rate"
            value={`${analytics.openRate}%`}
            icon={MessageSquare}
          />
          <KpiCard
            label="Click rate"
            value={`${analytics.clickRate}%`}
            icon={Bell}
          />
          <KpiCard
            label="Failures"
            value={`${analytics.failureRate}%`}
            icon={Archive}
          />
        </div>
      )}

      {showComposer && (
        <FadeIn>
          <div className="glass-strong space-y-4 rounded-[1.75rem] p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-xl font-semibold">
                Campaign builder
              </h2>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.asCampaign}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, asCampaign: e.target.checked }))
                  }
                />
                Save as campaign
              </label>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {form.asCampaign && (
                <label className="space-y-1 text-sm md:col-span-2">
                  <span className="text-muted-foreground">Campaign name</span>
                  <input
                    className="w-full rounded-xl border border-border/60 bg-background/50 px-3 py-2"
                    value={form.name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                    placeholder="Sunday reminder"
                  />
                </label>
              )}
              <label className="space-y-1 text-sm">
                <span className="text-muted-foreground">Channel</span>
                <select
                  className="w-full rounded-xl border border-border/60 bg-background/50 px-3 py-2"
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
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-muted-foreground">Audience</span>
                <select
                  className="w-full rounded-xl border border-border/60 bg-background/50 px-3 py-2"
                  value={form.audienceType}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      audienceType: e.target.value as HubAudienceType,
                    }))
                  }
                >
                  {AUDIENCE_OPTIONS.map((a) => (
                    <option key={a} value={a}>
                      {audienceLabel(a)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1 text-sm md:col-span-2">
                <span className="text-muted-foreground">Subject</span>
                <input
                  className="w-full rounded-xl border border-border/60 bg-background/50 px-3 py-2"
                  value={form.subject}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, subject: e.target.value }))
                  }
                  placeholder="See you Sunday, {{FirstName}}"
                />
              </label>
              <label className="space-y-1 text-sm md:col-span-2">
                <span className="text-muted-foreground">Body</span>
                <textarea
                  className="min-h-[140px] w-full rounded-xl border border-border/60 bg-background/50 px-3 py-2"
                  value={form.body}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, body: e.target.value }))
                  }
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-muted-foreground">Schedule (optional)</span>
                <input
                  type="datetime-local"
                  className="w-full rounded-xl border border-border/60 bg-background/50 px-3 py-2"
                  value={form.scheduledFor}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, scheduledFor: e.target.value }))
                  }
                />
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                disabled={pending || !form.body.trim()}
                onClick={() => save(false)}
              >
                {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                Save draft
              </Button>
              <Button
                disabled={pending || !form.body.trim()}
                onClick={() => save(true)}
              >
                <Send className="h-4 w-4" />
                Send now
              </Button>
            </div>
          </div>
        </FadeIn>
      )}

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((s) => (
              <Button
                key={s}
                size="sm"
                variant={statusFilter === s ? "default" : "outline"}
                onClick={() => setStatusFilter(s)}
              >
                {s === "ALL" ? "All" : statusLabel(s)}
              </Button>
            ))}
          </div>

          <StaggerChildren className="space-y-3">
            {messages.map((msg) => (
              <motion.article
                key={msg.id}
                variants={staggerItem}
                className="glass flex flex-col gap-3 rounded-[1.5rem] p-4 hover-lift sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{channelLabel(msg.channel)}</Badge>
                    <Badge variant={statusVariant(msg.status)}>
                      {statusLabel(msg.status)}
                    </Badge>
                    {msg.direction === "INBOUND" && (
                      <Badge variant="secondary">Inbox</Badge>
                    )}
                  </div>
                  <Link
                    href={`/communications/${msg.id}`}
                    className="block truncate font-medium hover:text-primary"
                  >
                    {msg.subject || msg.body.slice(0, 80)}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {msg.campaignName ? `${msg.campaignName} · ` : ""}
                    {format(new Date(msg.createdAt), "MMM d · h:mm a")}
                    {msg.audienceType
                      ? ` · ${audienceLabel(msg.audienceType)}`
                      : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(msg.status === "DRAFT" ||
                    msg.status === "SCHEDULED" ||
                    msg.status === "QUEUED") && (
                    <Button
                      size="sm"
                      disabled={pending}
                      onClick={() =>
                        startTransition(async () => {
                          const res = await sendMessageAction(msg.id);
                          if (!res.ok) setError(res.error);
                          else await load();
                        })
                      }
                    >
                      Send
                    </Button>
                  )}
                  {msg.status !== "ARCHIVED" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={pending}
                      onClick={() =>
                        startTransition(async () => {
                          const res = await archiveMessageAction(msg.id);
                          if (!res.ok) setError(res.error);
                          else await load();
                        })
                      }
                    >
                      Archive
                    </Button>
                  )}
                </div>
              </motion.article>
            ))}
            {messages.length === 0 && (
              <div className="glass rounded-[1.5rem] p-8 text-center text-sm text-muted-foreground">
                No messages in this view yet
              </div>
            )}
          </StaggerChildren>
        </div>

        <div className="space-y-4">
          <section className="glass rounded-[1.75rem] p-5">
            <div className="mb-3 flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-primary" />
              <h2 className="font-display text-lg font-semibold">
                Scheduling calendar
              </h2>
            </div>
            <ul className="space-y-3">
              {scheduled.map((item) => (
                <li
                  key={item.id}
                  className="rounded-xl border border-border/40 px-3 py-2 text-sm"
                >
                  <p className="font-medium">
                    {"name" in item && item.name
                      ? item.name
                      : "subject" in item
                        ? (item.subject as string) || "Scheduled message"
                        : "Scheduled"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.scheduledFor
                      ? format(new Date(item.scheduledFor), "EEE, MMM d · h:mm a")
                      : ""}
                    {" · "}
                    {channelLabel(item.channel)}
                  </p>
                </li>
              ))}
              {scheduled.length === 0 && (
                <li className="text-sm text-muted-foreground">
                  Nothing scheduled — compose and pick a send time.
                </li>
              )}
            </ul>
          </section>

          <section className="glass rounded-[1.75rem] p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">Campaigns</h2>
              <Button size="sm" variant="outline" asChild>
                <Link href="/communications/campaigns">View all</Link>
              </Button>
            </div>
            <ul className="space-y-2">
              {campaigns.slice(0, 5).map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <div>
                    <p className="font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {channelLabel(c.channel)} · {audienceLabel(c.audienceType)}
                    </p>
                  </div>
                  <Badge variant={statusVariant(c.status)}>
                    {statusLabel(c.status)}
                  </Badge>
                </li>
              ))}
            </ul>
          </section>

          {analytics && (
            <section className="glass rounded-[1.75rem] p-5">
              <h2 className="font-display text-lg font-semibold">Activity</h2>
              <ul className="relative mt-4 space-y-3 before:absolute before:bottom-1 before:left-[7px] before:top-1 before:w-px before:bg-border/60">
                {analytics.recentActivity.map((a) => (
                  <li key={a.id} className="relative pl-6 text-sm">
                    <span className="absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-primary/50 bg-background" />
                    <p className="font-medium">{a.title}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {format(new Date(a.occurredAt), "MMM d · h:mm a")}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>

      {error && (
        <p className="text-sm text-amber-700 dark:text-amber-300">{error}</p>
      )}
    </div>
  );
}
