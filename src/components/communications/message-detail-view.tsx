"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ArrowLeft, Loader2, Send } from "lucide-react";
import {
  getMessageAction,
  sendMessageAction,
  updateDeliveryStatusAction,
} from "@/application/communications/actions";
import {
  channelLabel,
  statusLabel,
  statusVariant,
} from "@/components/communications/utils";
import { FadeIn } from "@/components/motion/page-transition";
import { ErrorState, LoadingState } from "@/components/shared/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type {
  CommunicationDeliveryEntity,
  CommunicationMessageEntity,
} from "@/domain/entities/communication";
import {
  HubDeliveryStatus,
  HUB_DELIVERY_LABELS,
} from "@/domain/enums/communication";

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

type SerializedDelivery = Omit<
  CommunicationDeliveryEntity,
  | "sentAt"
  | "deliveredAt"
  | "openedAt"
  | "clickedAt"
  | "failedAt"
  | "createdAt"
  | "updatedAt"
> & {
  sentAt: string | null;
  deliveredAt: string | null;
  openedAt: string | null;
  clickedAt: string | null;
  failedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export function MessageDetailView({ messageId }: { messageId: string }) {
  const [message, setMessage] = useState<SerializedMessage | null>(null);
  const [deliveries, setDeliveries] = useState<SerializedDelivery[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, startTransition] = useTransition();

  const load = useCallback(async () => {
    const res = await getMessageAction(messageId);
    if (!res.ok) {
      setError(res.error);
      setLoading(false);
      return;
    }
    setMessage(
      JSON.parse(JSON.stringify(res.data.message)) as SerializedMessage
    );
    setDeliveries(
      JSON.parse(JSON.stringify(res.data.deliveries)) as SerializedDelivery[]
    );
    setError(null);
    setLoading(false);
  }, [messageId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <LoadingState label="Loading message…" />;
  if (error || !message) {
    return (
      <ErrorState description={error ?? "Message not found"} onRetry={load} />
    );
  }

  return (
    <div className="space-y-6">
      <FadeIn>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/communications">
            <ArrowLeft className="h-4 w-4" />
            Inbox
          </Link>
        </Button>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge variant="outline">{channelLabel(message.channel)}</Badge>
          <Badge variant={statusVariant(message.status)}>
            {statusLabel(message.status)}
          </Badge>
          <Badge variant="secondary">{message.direction}</Badge>
        </div>
        <h1 className="mt-3 font-display text-3xl font-semibold">
          {message.subject || "Untitled message"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {format(new Date(message.createdAt), "PPpp")}
          {message.campaignName ? ` · ${message.campaignName}` : ""}
        </p>
      </FadeIn>

      <div className="glass-strong rounded-[1.75rem] p-6">
        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
          {message.body}
        </pre>
        {message.metadata && (
          <p className="mt-4 text-xs text-muted-foreground">
            Provider metadata: {JSON.stringify(message.metadata)}
          </p>
        )}
        {(message.status === "DRAFT" ||
          message.status === "SCHEDULED" ||
          message.status === "QUEUED") && (
          <Button
            className="mt-4"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const res = await sendMessageAction(messageId);
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
            Send message
          </Button>
        )}
      </div>

      <section className="glass rounded-[1.75rem] p-5">
        <h2 className="font-display text-lg font-semibold">Deliveries</h2>
        <ul className="mt-3 divide-y divide-border/40">
          {deliveries.map((d) => (
            <li
              key={d.id}
              className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"
            >
              <div>
                <p className="font-medium">
                  {d.recipientName ?? d.recipientEmail ?? d.recipientPhone ?? "Recipient"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {d.provider} · {HUB_DELIVERY_LABELS[d.status]}
                  {d.sentAt
                    ? ` · ${format(new Date(d.sentAt), "MMM d h:mm a")}`
                    : ""}
                </p>
              </div>
              <div className="flex gap-2">
                {d.status === "SENT" || d.status === "DELIVERED" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        const res = await updateDeliveryStatusAction({
                          deliveryId: d.id,
                          status: HubDeliveryStatus.OPENED,
                        });
                        if (!res.ok) setError(res.error);
                        else await load();
                      })
                    }
                  >
                    Mark opened
                  </Button>
                ) : null}
                {(d.status === "OPENED" || d.status === "DELIVERED") && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        const res = await updateDeliveryStatusAction({
                          deliveryId: d.id,
                          status: HubDeliveryStatus.CLICKED,
                        });
                        if (!res.ok) setError(res.error);
                        else await load();
                      })
                    }
                  >
                    Mark clicked
                  </Button>
                )}
              </div>
            </li>
          ))}
          {deliveries.length === 0 && (
            <li className="py-4 text-sm text-muted-foreground">
              No deliveries yet — send to generate recipient rows.
            </li>
          )}
        </ul>
      </section>
      {error && (
        <p className="text-sm text-amber-700 dark:text-amber-300">{error}</p>
      )}
    </div>
  );
}
