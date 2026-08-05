"use client";

import { useState } from "react";
import { MotionCard } from "@/components/ui/motion-card";
import {
  CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  SuccessState,
  ErrorState,
  LoadingState,
  SkeletonCard,
} from "@/components/shared/states";
import { FadeIn } from "@/components/motion/page-transition";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { AccentPicker } from "@/components/layout/accent-picker";

export function SettingsView() {
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [demoState, setDemoState] = useState<
    "idle" | "loading" | "success" | "error" | "skeleton"
  >("idle");

  const runDemo = async (result: "success" | "error") => {
    setDemoState("loading");
    await new Promise((r) => setTimeout(r, 900));
    setDemoState(result);
  };

  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="relative overflow-hidden rounded-[2rem] glass-strong p-6 sm:p-8">
          <div className="pointer-events-none absolute right-0 top-0 h-48 w-48 rounded-full bg-primary/15 blur-3xl" />
          <div className="relative space-y-2">
            <p className="text-sm font-medium text-primary">Control center</p>
            <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Settings
            </h1>
            <p className="max-w-lg text-muted-foreground">
              Profile, appearance, accents, and system feedback — tuned with care.
            </p>
          </div>
        </div>
      </FadeIn>

      <div className="grid gap-4 lg:grid-cols-2">
        <MotionCard delay={0.06}>
          <CardHeader>
            <CardTitle>Church profile</CardTitle>
            <CardDescription>Public-facing church details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="church-name">Church name</Label>
              <Input id="church-name" defaultValue="Grace Community Church" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="campus">Primary campus</Label>
              <Input id="campus" defaultValue="Main Campus · 120 Faith Ave" />
            </div>
            <Button variant="glow" className="w-full sm:w-auto">
              Save changes
            </Button>
          </CardContent>
        </MotionCard>

        <MotionCard delay={0.1}>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Theme and accent color</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Theme</p>
                <p className="text-sm text-muted-foreground">
                  Light, dark, or system
                </p>
              </div>
              <ThemeToggle />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium">Accent</p>
                <p className="text-sm text-muted-foreground">
                  Soft color identity for your church
                </p>
              </div>
              <AccentPicker />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Email alerts</p>
                <p className="text-sm text-muted-foreground">
                  Visitor follow-ups and capacity warnings
                </p>
              </div>
              <Switch
                checked={emailAlerts}
                onCheckedChange={setEmailAlerts}
                aria-label="Toggle email alerts"
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Weekly digest</p>
                <p className="text-sm text-muted-foreground">
                  Sunday summary every Monday morning
                </p>
              </div>
              <Switch
                checked={weeklyDigest}
                onCheckedChange={setWeeklyDigest}
                aria-label="Toggle weekly digest"
              />
            </div>
          </CardContent>
        </MotionCard>

        <MotionCard delay={0.14} className="lg:col-span-2" elevate={false}>
          <CardHeader>
            <CardTitle>System states</CardTitle>
            <CardDescription>
              Premium loading, skeleton, success, and error patterns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => runDemo("success")}>
                Demo success
              </Button>
              <Button variant="outline" onClick={() => runDemo("error")}>
                Demo error
              </Button>
              <Button variant="ghost" onClick={() => setDemoState("skeleton")}>
                Demo skeleton
              </Button>
              <Button variant="ghost" onClick={() => setDemoState("idle")}>
                Reset
              </Button>
            </div>
            <div className="rounded-[1.75rem] border border-border/50 bg-background/35">
              {demoState === "idle" && (
                <p className="px-6 py-12 text-center text-sm text-muted-foreground">
                  Trigger a demo to preview feedback states.
                </p>
              )}
              {demoState === "loading" && (
                <LoadingState label="Saving preferences…" />
              )}
              {demoState === "skeleton" && (
                <div className="grid gap-4 p-6 sm:grid-cols-2">
                  <SkeletonCard />
                  <SkeletonCard />
                </div>
              )}
              {demoState === "success" && (
                <SuccessState
                  title="Preferences saved"
                  description="Your notification settings are up to date."
                />
              )}
              {demoState === "error" && (
                <ErrorState
                  title="Couldn’t save"
                  description="Check your connection and try again."
                  onRetry={() => runDemo("success")}
                />
              )}
            </div>
          </CardContent>
        </MotionCard>
      </div>
    </div>
  );
}
