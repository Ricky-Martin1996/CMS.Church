"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ArrowLeft, Loader2, Send } from "lucide-react";
import {
  listCampaignsAction,
  sendCampaignAction,
} from "@/application/communications/actions";
import {
  audienceLabel,
  channelLabel,
  statusLabel,
  statusVariant,
} from "@/components/communications/utils";
import { FadeIn } from "@/components/motion/page-transition";
import { ErrorState, LoadingState } from "@/components/shared/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CommunicationCampaignEntity } from "@/domain/entities/communication";

type SerializedCampaign = Omit<
  CommunicationCampaignEntity,
  "scheduledFor" | "sentAt" | "createdAt" | "updatedAt"
> & {
  scheduledFor: string | null;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export function CampaignsView() {
  const [campaigns, setCampaigns] = useState<SerializedCampaign[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, startTransition] = useTransition();

  const load = useCallback(async () => {
    const res = await listCampaignsAction();
    if (!res.ok) {
      setError(res.error);
      setLoading(false);
      return;
    }
    setCampaigns(
      JSON.parse(JSON.stringify(res.data)) as SerializedCampaign[]
    );
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <LoadingState label="Loading campaigns…" />;
  if (error && campaigns.length === 0) {
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
        <h1 className="mt-3 font-display text-3xl font-semibold">Campaigns</h1>
        <p className="text-sm text-muted-foreground">
          Delivery analytics per campaign — open, click, and failure rates
        </p>
      </FadeIn>

      <div className="space-y-3">
        {campaigns.map((c) => (
          <article
            key={c.id}
            className="glass flex flex-col gap-4 rounded-[1.5rem] p-5 lg:flex-row lg:items-center lg:justify-between"
          >
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <Badge variant={statusVariant(c.status)}>
                  {statusLabel(c.status)}
                </Badge>
                <Badge variant="outline">{channelLabel(c.channel)}</Badge>
                <Badge variant="secondary">
                  {audienceLabel(c.audienceType)}
                </Badge>
              </div>
              <h2 className="font-display text-xl font-semibold">{c.name}</h2>
              {c.description && (
                <p className="text-sm text-muted-foreground">{c.description}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {c.deliveryCount ?? 0} deliveries · open {c.openRate ?? 0}% ·
                click {c.clickRate ?? 0}% · failures {c.failureCount ?? 0}
                {c.scheduledFor
                  ? ` · scheduled ${format(new Date(c.scheduledFor), "MMM d h:mm a")}`
                  : ""}
                {c.sentAt
                  ? ` · sent ${format(new Date(c.sentAt), "MMM d h:mm a")}`
                  : ""}
              </p>
            </div>
            {(c.status === "DRAFT" || c.status === "SCHEDULED") && (
              <Button
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    const res = await sendCampaignAction(c.id);
                    if (!res.ok) setError(res.error);
                    else await load();
                  })
                }
              >
                {pending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Send campaign
              </Button>
            )}
          </article>
        ))}
      </div>
      {error && (
        <p className="text-sm text-amber-700 dark:text-amber-300">{error}</p>
      )}
    </div>
  );
}
