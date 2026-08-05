"use client";

import { useState, useTransition } from "react";
import { Loader2, Send } from "lucide-react";
import { sendVolunteerMessageAction } from "@/application/ministries/actions";
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
  VolunteerMessageChannel,
} from "@/domain/enums/ministry";

const MESSAGE_CHANNEL_LABELS: Record<VolunteerMessageChannel, string> = {
  [VolunteerMessageChannel.EMAIL]: "Email",
  [VolunteerMessageChannel.WHATSAPP]: "WhatsApp",
  [VolunteerMessageChannel.SMS]: "SMS",
  [VolunteerMessageChannel.IN_APP]: "In-app",
};

export function VolunteerMessageForm({
  volunteerId,
  ministryId,
  onSent,
}: {
  volunteerId?: string;
  ministryId?: string;
  onSent?: () => void;
}) {
  const [channel, setChannel] = useState<VolunteerMessageChannel>(
    VolunteerMessageChannel.IN_APP
  );
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      const res = await sendVolunteerMessageAction({
        volunteerId,
        ministryId,
        channel,
        subject: subject.trim() || null,
        body: body.trim(),
      });

      if (!res.ok) {
        setError(res.error);
        return;
      }

      setBody("");
      setSubject("");
      setSuccess(true);
      onSent?.();
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="message-channel">Channel</Label>
        <Select
          value={channel}
          onValueChange={(v) => setChannel(v as VolunteerMessageChannel)}
        >
          <SelectTrigger id="message-channel" className="rounded-2xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.values(VolunteerMessageChannel).map((c) => (
              <SelectItem key={c} value={c}>
                {MESSAGE_CHANNEL_LABELS[c]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {channel === VolunteerMessageChannel.EMAIL && (
        <div className="space-y-2">
          <Label htmlFor="message-subject">Subject</Label>
          <Input
            id="message-subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Schedule reminder"
            className="rounded-2xl"
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="message-body">Message</Label>
        <Textarea
          id="message-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Thanks for serving this Sunday…"
          rows={4}
          className="rounded-2xl"
          required
        />
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">{error}</p>
      )}
      {success && (
        <p className="text-sm text-success" role="status">Message sent</p>
      )}

      <Button type="submit" variant="glow" disabled={pending || !body.trim()}>
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
        Send message
      </Button>
    </form>
  );
}
