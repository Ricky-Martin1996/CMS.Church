"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Kanban, Search } from "lucide-react";
import { getPipelineBoardAction } from "@/application/visitors/actions";
import { PipelineColumn } from "@/components/visitors/pipeline-column";
import { ErrorState, LoadingState } from "@/components/shared/states";
import { FadeIn } from "@/components/motion/page-transition";
import type { PipelineBoardColumn } from "@/domain/entities/visitor-journey";
import type { VisitorListItem } from "@/domain/entities/visitor-journey";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type SerializedColumn = Omit<PipelineBoardColumn, "visitors"> & {
  visitors: Array<
    Omit<
      VisitorListItem,
      "stageEnteredAt" | "lastCommunicationAt" | "createdAt" | "updatedAt"
    > & {
      stageEnteredAt: string;
      lastCommunicationAt: string | null;
      createdAt: string;
      updatedAt: string;
    }
  >;
};

export function VisitorPipelineView() {
  const [columns, setColumns] = useState<SerializedColumn[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await getPipelineBoardAction();
    if (!res.ok) {
      setError(res.error);
      setLoading(false);
      return;
    }
    setColumns(JSON.parse(JSON.stringify(res.data)) as SerializedColumn[]);
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filteredColumns = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return columns;
    return columns.map((col) => ({
      ...col,
      visitors: col.visitors.filter(
        (v) =>
          v.displayName.toLowerCase().includes(q) ||
          v.email?.toLowerCase().includes(q) ||
          v.phone?.includes(q) ||
          v.assignedLeaderName?.toLowerCase().includes(q)
      ),
    }));
  }, [columns, query]);

  if (loading) return <LoadingState label="Loading pipeline…" />;
  if (error)
    return (
      <ErrorState
        description={error}
        onRetry={() => {
          setLoading(true);
          load();
        }}
      />
    );

  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="relative overflow-hidden rounded-[2rem] glass-strong p-6 sm:p-8">
          <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-chart-2/15 blur-3xl" />
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-primary">Pipeline</p>
              <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                Visitor journey board
              </h1>
              <p className="max-w-xl text-sm text-muted-foreground">
                Move guests through each stage with Advance or Move — click a
                card for the full profile.
              </p>
            </div>
            <Button variant="glass" asChild>
              <Link href="/visitors">Back to dashboard</Link>
            </Button>
          </div>
        </div>
      </FadeIn>

      <FadeIn delay={0.05}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, email, phone, or leader…"
              className="min-h-11 pl-10"
              aria-label="Search pipeline"
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Kanban className="h-4 w-4" aria-hidden />
            {filteredColumns.reduce((n, c) => n + c.visitors.length, 0)} visitors
          </div>
        </div>
      </FadeIn>

      <div className="overflow-x-auto pb-2">
        <div className="flex min-w-min gap-3">
          {filteredColumns.map((col) => (
            <PipelineColumn
              key={col.stage}
              stage={col.stage}
              label={col.label}
              visitors={col.visitors}
              onUpdated={load}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
