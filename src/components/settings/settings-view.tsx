"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
        <div className="space-y-1">
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            Settings
          </h1>
          <p className="text-muted-foreground">
            Church profile, preferences, and system states.
          </p>
        </div>
      </FadeIn>

      <div className="grid gap-4 lg:grid-cols-2">
        <FadeIn delay={0.06}>
          <Card>
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
              <Button className="w-full sm:w-auto">Save changes</Button>
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={0.1}>
          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>Appearance and notifications</CardDescription>
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
          </Card>
        </FadeIn>

        <FadeIn delay={0.14} className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>System states</CardTitle>
              <CardDescription>
                Premium loading, success, and error patterns used across ChurchOS
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
              <div className="rounded-3xl border border-border/60 bg-background/40">
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
          </Card>
        </FadeIn>
      </div>
    </div>
  );
}
