"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function OnboardingForm() {
  const router = useRouter();
  const [churchName, setChurchName] = useState("");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/organizations/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          churchName,
          slug: slug || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message ?? "Unable to create organization");
      }

      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-lg items-center px-4 py-10">
      <Card className="w-full" elevate={false}>
        <CardHeader>
          <CardTitle>Create your church</CardTitle>
          <CardDescription>
            Set up your ChurchOS organization. You can invite your team later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="churchName">Church name</Label>
              <Input
                id="churchName"
                value={churchName}
                onChange={(e) => setChurchName(e.target.value)}
                placeholder="Grace Community Church"
                required
                minLength={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">URL slug (optional)</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="grace-community"
              />
            </div>
            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
            <Button
              type="submit"
              variant="glow"
              className="w-full"
              disabled={loading}
            >
              {loading ? "Creating…" : "Continue to ChurchOS"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
