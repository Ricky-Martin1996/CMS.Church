"use client";

import {
  CalendarDays,
  HeartHandshake,
  MessageSquare,
  UserPlus,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { activities, type ActivityItem } from "@/lib/data";
import { FadeIn } from "@/components/motion/page-transition";

const iconMap = {
  person: UserPlus,
  giving: HeartHandshake,
  event: CalendarDays,
  message: MessageSquare,
};

function ActivityRow({ item }: { item: ActivityItem }) {
  const Icon = iconMap[item.type];
  return (
    <li className="flex gap-3 rounded-2xl px-2 py-2.5 transition-colors hover:bg-accent/50">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <Icon className="h-4 w-4" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{item.title}</p>
        <p className="truncate text-sm text-muted-foreground">{item.description}</p>
      </div>
      <time className="shrink-0 text-xs text-muted-foreground">{item.time}</time>
    </li>
  );
}

export function ActivityFeed() {
  return (
    <FadeIn delay={0.18}>
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
          <CardDescription>What happened across your campuses</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1" aria-label="Recent activity">
            {activities.map((item) => (
              <ActivityRow key={item.id} item={item} />
            ))}
          </ul>
        </CardContent>
      </Card>
    </FadeIn>
  );
}
