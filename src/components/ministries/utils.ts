import { format, formatDistanceToNow, isValid, parseISO } from "date-fns";
import { MinistryStatus } from "@/domain/enums/ministry";

export type DateLike = string | Date | null | undefined;

export function parseDate(value: DateLike): Date | null {
  if (!value) return null;
  if (value instanceof Date) return isValid(value) ? value : null;
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : null;
}

export function formatMinistryDate(value: DateLike, pattern = "MMM d, yyyy") {
  const date = parseDate(value);
  return date ? format(date, pattern) : "—";
}

export function formatMinistryDateTime(value: DateLike) {
  const date = parseDate(value);
  return date ? format(date, "MMM d, yyyy · h:mm a") : "—";
}

export function formatRelativeDate(value: DateLike) {
  const date = parseDate(value);
  return date ? formatDistanceToNow(date, { addSuffix: true }) : "—";
}

export function getInitials(firstName: string, lastName?: string) {
  return `${firstName.charAt(0)}${lastName?.charAt(0) ?? ""}`.toUpperCase();
}

export function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

export function ministryStatusVariant(status: MinistryStatus) {
  switch (status) {
    case MinistryStatus.ACTIVE:
      return "success" as const;
    case MinistryStatus.PAUSED:
      return "warning" as const;
    case MinistryStatus.ARCHIVED:
      return "muted" as const;
    default:
      return "outline" as const;
  }
}

export function reliabilityTone(score: number) {
  if (score >= 85) return "text-success";
  if (score >= 70) return "text-foreground";
  return "text-warning";
}
