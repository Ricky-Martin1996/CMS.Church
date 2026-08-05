"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Plus } from "lucide-react";
import {
  createTemplateAction,
  listTemplatesAction,
} from "@/application/communications/actions";
import {
  CHANNEL_OPTIONS,
  channelLabel,
} from "@/components/communications/utils";
import { FadeIn } from "@/components/motion/page-transition";
import { ErrorState, LoadingState } from "@/components/shared/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CommunicationTemplateEntity } from "@/domain/entities/communication";
import {
  HubChannel,
  TEMPLATE_VARIABLES,
} from "@/domain/enums/communication";

type SerializedTemplate = Omit<
  CommunicationTemplateEntity,
  "createdAt" | "updatedAt"
> & {
  createdAt: string;
  updatedAt: string;
};

export function TemplatesView() {
  const [templates, setTemplates] = useState<SerializedTemplate[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    channel: HubChannel.EMAIL,
    subject: "",
    body: "Hi {{FirstName}},\n\nBlessings from {{ChurchName}}.",
  });

  const load = useCallback(async () => {
    const res = await listTemplatesAction();
    if (!res.ok) {
      setError(res.error);
      setLoading(false);
      return;
    }
    setTemplates(
      JSON.parse(JSON.stringify(res.data)) as SerializedTemplate[]
    );
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <LoadingState label="Loading templates…" />;
  if (error && templates.length === 0) {
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
            <h1 className="font-display text-3xl font-semibold">Templates</h1>
            <p className="text-sm text-muted-foreground">
              Reusable Email / WhatsApp / SMS copy with merge variables
            </p>
          </div>
          <Button onClick={() => setShowForm((v) => !v)}>
            <Plus className="h-4 w-4" />
            New template
          </Button>
        </div>
      </FadeIn>

      <div className="flex flex-wrap gap-2">
        {TEMPLATE_VARIABLES.map((v) => (
          <Badge key={v} variant="outline">
            {`{{${v}}}`}
          </Badge>
        ))}
      </div>

      {showForm && (
        <div className="glass-strong space-y-3 rounded-[1.75rem] p-5">
          <div className="grid gap-3 md:grid-cols-2">
            <input
              className="rounded-xl border border-border/60 bg-background/50 px-3 py-2 text-sm"
              placeholder="Template name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
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
              placeholder="Subject"
              value={form.subject}
              onChange={(e) =>
                setForm((f) => ({ ...f, subject: e.target.value }))
              }
            />
            <textarea
              className="min-h-[120px] rounded-xl border border-border/60 bg-background/50 px-3 py-2 text-sm md:col-span-2"
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
            />
          </div>
          <Button
            disabled={pending || !form.name.trim() || !form.body.trim()}
            onClick={() =>
              startTransition(async () => {
                const res = await createTemplateAction({
                  name: form.name.trim(),
                  channel: form.channel,
                  subject: form.subject || undefined,
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
            Save template
          </Button>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {templates.map((t) => (
          <article key={t.id} className="glass rounded-[1.5rem] p-5">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h2 className="font-display text-lg font-semibold">{t.name}</h2>
              <Badge variant="outline">{channelLabel(t.channel)}</Badge>
            </div>
            {t.subject && (
              <p className="mb-2 text-sm text-muted-foreground">{t.subject}</p>
            )}
            <pre className="whitespace-pre-wrap rounded-xl bg-background/40 p-3 text-xs">
              {t.body}
            </pre>
            <div className="mt-3 flex flex-wrap gap-1">
              {t.variables.map((v) => (
                <Badge key={v} variant="secondary">
                  {`{{${v}}}`}
                </Badge>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
