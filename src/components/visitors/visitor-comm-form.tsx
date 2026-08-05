"use client";

import { Loader2, MessageSquare } from "lucide-react";
import { useState, useTransition } from "react";
import { logVisitorCommunicationAction } from "@/application/visitors/actions";
import { Button } from "@/components/ui/button";
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
  COMMUNICATION_CHANNEL_LABELS,
  CommunicationChannel,
  CommunicationDirection,
} from "@/domain/enums/visitor";

export function VisitorCommForm({
  visitorId,
  onLogged,
}: {
  visitorId: string;
  onLogged?: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [channel, setChannel] = useState<CommunicationChannel>(
    CommunicationChannel.PHONE
  );

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        const fd = new FormData(e.currentTarget);
        const body = String(fd.get("body") ?? "").trim();
        const subject = String(fd.get("subject") ?? "").trim();

        if (!body) {
          setError("Message body is required");
          return;
        }

        startTransition(async () => {
          const res = await logVisitorCommunicationAction(visitorId, {
            channel,
            direction: CommunicationDirection.OUTBOUND,
            subject: subject || undefined,
            body,
          });
          if (!res.ok) {
            setError(res.error);
            return;
          }
          e.currentTarget.reset();
          onLogged?.();
        });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="comm-channel">Channel</Label>
          <Select
            value={channel}
            onValueChange={(v) => setChannel(v as CommunicationChannel)}
          >
            <SelectTrigger id="comm-channel" className="min-h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(CommunicationChannel).map((ch) => (
                <SelectItem key={ch} value={ch}>
                  {COMMUNICATION_CHANNEL_LABELS[ch]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="comm-subject">Subject (optional)</Label>
          <Input
            id="comm-subject"
            name="subject"
            placeholder="Follow-up call"
            className="min-h-11"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="comm-body">Message</Label>
        <Textarea
          id="comm-body"
          name="body"
          rows={4}
          required
          placeholder="What was discussed or sent?"
          className="min-h-[6rem]"
        />
      </div>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" variant="glow" disabled={pending} className="min-h-11">
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <MessageSquare className="h-4 w-4" />
        )}
        Log communication
      </Button>
    </form>
  );
}
