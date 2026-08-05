import { format, formatDistanceToNow, isValid, parseISO } from "date-fns";
import {
  TrainingStatus,
  Weekday,
} from "@/domain/enums/ministry";

export type DateLike = string | Date | null | undefined;

export function parseDate(value: DateLike): Date | null {
  if (!value) return null;
  if (value instanceof Date) return isValid(value) ? value : null;
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : null;
}

export function formatVolunteerDate(value: DateLike, pattern = "MMM d, yyyy") {
  const date = parseDate(value);
  return date ? format(date, pattern) : "—";
}

export function formatVolunteerDateTime(value: DateLike) {
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

export function trainingStatusVariant(status: TrainingStatus) {
  switch (status) {
    case TrainingStatus.COMPLETED:
      return "success" as const;
    case TrainingStatus.IN_PROGRESS:
      return "default" as const;
    case TrainingStatus.EXPIRED:
      return "warning" as const;
  }
  return "muted" as const;
}

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  [Weekday.SUN]: "Sunday",
  [Weekday.MON]: "Monday",
  [Weekday.TUE]: "Tuesday",
  [Weekday.WED]: "Wednesday",
  [Weekday.THU]: "Thursday",
  [Weekday.FRI]: "Friday",
  [Weekday.SAT]: "Saturday",
};

export function reliabilityTone(score: number) {
  if (score >= 85) return "text-success";
  if (score >= 70) return "text-foreground";
  return "text-warning";
}
