"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Loader2, QrCode } from "lucide-react";
import { qrCheckInAction } from "@/application/people/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FadeIn } from "@/components/motion/page-transition";
import { ErrorState, SuccessState } from "@/components/shared/states";

export default function CheckInPage() {
  const [token, setToken] = useState("");
  const [eventName, setEventName] = useState("Sunday Service");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [successMemberId, setSuccessMemberId] = useState<string | null>(null);

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <FadeIn>
        <Link
          href="/people"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to People
        </Link>
        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium text-primary">Check-in</p>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            QR Check-in
          </h1>
          <p className="text-muted-foreground">
            Scan or paste a member QR token to record attendance.
          </p>
        </div>
      </FadeIn>

      <FadeIn delay={0.08}>
        <div className="glass-strong space-y-6 rounded-[1.75rem] p-6">
          {successMemberId ? (
            <SuccessState
              title="Checked in!"
              description="Attendance has been recorded for this member."
            />
          ) : error ? (
            <ErrorState
              description={error}
              onRetry={() => setError(null)}
            />
          ) : (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                startTransition(async () => {
                  setError(null);
                  const res = await qrCheckInAction(token.trim(), eventName.trim());
                  if (!res.ok) {
                    setError(res.error);
                    return;
                  }
                  setSuccessMemberId(res.data.memberId);
                  setToken("");
                });
              }}
            >
              <div className="flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <QrCode className="h-8 w-8" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="token">QR token</Label>
                <Input
                  id="token"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Paste or scan token"
                  required
                  autoComplete="off"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="eventName">Event name</Label>
                <Input
                  id="eventName"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  required
                />
              </div>
              <Button
                type="submit"
                variant="glow"
                className="w-full"
                disabled={pending || !token.trim()}
              >
                {pending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                Check in
              </Button>
            </form>
          )}

          {successMemberId && (
            <div className="flex flex-col gap-2">
              <Button variant="glow" asChild>
                <Link href={`/people/${successMemberId}`}>View profile</Link>
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setSuccessMemberId(null);
                  setError(null);
                }}
              >
                Check in another
              </Button>
            </div>
          )}
        </div>
      </FadeIn>
    </div>
  );
}
