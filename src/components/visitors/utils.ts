import { format, formatDistanceToNow, isValid, parseISO } from "date-fns";
import type { FollowUpPriority } from "@/domain/enums/visitor";
import { FollowUpPriority as Priority } from "@/domain/enums/visitor";

export type DateLike = string | Date | null | undefined;

export function parseDate(value: DateLike): Date | null {
  if (!value) return null;
  if (value instanceof Date) return isValid(value) ? value : null;
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : null;
}

export function formatVisitorDate(value: DateLike, pattern = "MMM d, yyyy") {
  const date = parseDate(value);
  return date ? format(date, pattern) : "—";
}

export function formatRelativeDate(value: DateLike) {
  const date = parseDate(value);
  return date ? formatDistanceToNow(date, { addSuffix: true }) : "—";
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function daysInStage(stageEnteredAt: DateLike): number {
  const date = parseDate(stageEnteredAt);
  if (!date) return 0;
  const diff = Date.now() - date.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

export function formatResponseTime(hours: number | null): string {
  if (hours == null) return "—";
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 48) return `${Math.round(hours)}h`;
  return `${Math.round(hours / 24)}d`;
}

export function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export const PRIORITY_VARIANT: Record<
  FollowUpPriority,
  "default" | "secondary" | "warning" | "outline"
> = {
  [Priority.LOW]: "outline",
  [Priority.MEDIUM]: "secondary",
  [Priority.HIGH]: "warning",
  [Priority.URGENT]: "default",
};

export function isTaskOverdue(dueAt: DateLike): boolean {
  const date = parseDate(dueAt);
  if (!date) return false;
  return date.getTime() < Date.now();
}

export function visitorDisplayName(
  firstName: string,
  lastName: string
): string {
  return [firstName, lastName].filter(Boolean).join(" ").trim() || "Visitor";
}
