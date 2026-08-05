"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  CalendarDays,
  Check,
  HeartHandshake,
  Settings2,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { notifications, type NotificationItem } from "@/lib/data";
import { cn } from "@/lib/utils";

const typeIcon = {
  system: Settings2,
  people: Users,
  giving: HeartHandshake,
  event: CalendarDays,
};

function NotificationRow({ item }: { item: NotificationItem }) {
  const Icon = typeIcon[item.type];
  return (
    <li
      className={cn(
        "flex gap-3 rounded-2xl px-3 py-3 transition-colors hover:bg-accent/50",
        item.unread && "bg-primary/5"
      )}
    >
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <Icon className="h-4 w-4" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium leading-snug">{item.title}</p>
          {item.unread && (
            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
          )}
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">{item.body}</p>
        <p className="mt-1 text-[11px] text-muted-foreground">{item.time}</p>
      </div>
    </li>
  );
}

export function NotificationsPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const unread = notifications.filter((n) => n.unread).length;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Close notifications"
            className="fixed inset-0 z-40 bg-background/30 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            role="dialog"
            aria-label="Notifications"
            initial={{ opacity: 0, x: 24, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 24, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 360, damping: 32 }}
            className="fixed right-3 top-3 z-50 flex h-[min(640px,calc(100vh-1.5rem))] w-[min(380px,calc(100vw-1.5rem))] flex-col overflow-hidden glass-strong rounded-[1.75rem] sm:right-5 sm:top-5"
          >
            <div className="flex items-center justify-between gap-3 border-b border-border/50 px-5 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-primary" aria-hidden />
                  <h2 className="font-display text-base font-semibold">
                    Notifications
                  </h2>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {unread} unread · across your campuses
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon-sm" aria-label="Mark all read">
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={onClose}
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <ScrollArea className="flex-1 px-2 py-2">
              <ul className="space-y-1">
                {notifications.map((item) => (
                  <NotificationRow key={item.id} item={item} />
                ))}
              </ul>
            </ScrollArea>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
