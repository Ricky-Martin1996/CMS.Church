"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, ListTodo } from "lucide-react";
import { listOpenFollowUpTasksAction } from "@/application/visitors/actions";
import { VisitorTaskCard } from "@/components/visitors/visitor-task-card";
import { ErrorState, LoadingState } from "@/components/shared/states";
import { FadeIn } from "@/components/motion/page-transition";
import type { FollowUpTaskEntity } from "@/domain/entities/visitor-journey";
import { FollowUpTaskStatus } from "@/domain/enums/visitor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { isTaskOverdue } from "@/components/visitors/utils";

type SerializedTask = Omit<
  FollowUpTaskEntity,
  "dueAt" | "completedAt" | "createdAt" | "updatedAt"
> & {
  dueAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  visitorName?: string;
};

export function VisitorTasksView() {
  const [tasks, setTasks] = useState<SerializedTask[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"open" | "overdue">("open");

  const load = useCallback(async () => {
    const res = await listOpenFollowUpTasksAction({ limit: 200 });
    if (!res.ok) {
      setError(res.error);
      setLoading(false);
      return;
    }
    setTasks(JSON.parse(JSON.stringify(res.data)) as SerializedTask[]);
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openTasks = useMemo(
    () => tasks.filter((t) => t.status !== FollowUpTaskStatus.DONE),
    [tasks]
  );

  const overdueTasks = useMemo(
    () => openTasks.filter((t) => isTaskOverdue(t.dueAt)),
    [openTasks]
  );

  if (loading) return <LoadingState label="Loading follow-up tasks…" />;
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
          <div className="pointer-events-none absolute -left-16 -top-20 h-56 w-56 rounded-full bg-primary/15 blur-3xl" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-primary">Follow-up</p>
              <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                Task queue
              </h1>
              <p className="max-w-xl text-sm text-muted-foreground">
                Open and overdue tasks across your visitor pipeline — complete
                them here or from a visitor profile.
              </p>
            </div>
            <Button variant="glass" asChild>
              <Link href="/visitors">Back to dashboard</Link>
            </Button>
          </div>
        </div>
      </FadeIn>

      <FadeIn delay={0.05}>
        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as "open" | "overdue")}
        >
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="open" className="min-h-10 gap-2 px-4">
              <ListTodo className="h-4 w-4" aria-hidden />
              Open
              <Badge variant="secondary">{openTasks.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="overdue" className="min-h-10 gap-2 px-4">
              <AlertCircle className="h-4 w-4" aria-hidden />
              Overdue
              <Badge variant={overdueTasks.length ? "warning" : "outline"}>
                {overdueTasks.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="open" className="space-y-3">
            {openTasks.length === 0 ? (
              <p className="glass rounded-2xl p-8 text-center text-sm text-muted-foreground">
                No open tasks — your follow-up queue is clear.
              </p>
            ) : (
              openTasks.map((task) => (
                <VisitorTaskCard
                  key={task.id}
                  task={task}
                  onComplete={load}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="overdue" className="space-y-3">
            {overdueTasks.length === 0 ? (
              <p className="glass rounded-2xl p-8 text-center text-sm text-muted-foreground">
                No overdue tasks — great work staying on top of follow-ups.
              </p>
            ) : (
              overdueTasks.map((task) => (
                <VisitorTaskCard
                  key={task.id}
                  task={task}
                  onComplete={load}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </FadeIn>
    </div>
  );
}
