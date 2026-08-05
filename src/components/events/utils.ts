import {
  CHURCH_EVENT_STATUS_LABELS,
  CHURCH_EVENT_TYPE_LABELS,
  ChurchEventStatus,
  ChurchEventType,
} from "@/domain/enums/event";
import { format, isSameDay, isSameMonth, startOfWeek, addDays } from "date-fns";

export function eventTypeLabel(type: ChurchEventType | string) {
  return (
    CHURCH_EVENT_TYPE_LABELS[type as ChurchEventType] ??
    String(type).replaceAll("_", " ")
  );
}

export function eventStatusLabel(status: ChurchEventStatus | string) {
  return (
    CHURCH_EVENT_STATUS_LABELS[status as ChurchEventStatus] ??
    String(status).replaceAll("_", " ")
  );
}

export function eventStatusVariant(
  status: ChurchEventStatus | string
): "default" | "success" | "warning" | "secondary" | "muted" | "outline" {
  switch (status) {
    case ChurchEventStatus.PUBLISHED:
      return "success";
    case ChurchEventStatus.DRAFT:
      return "secondary";
    case ChurchEventStatus.CANCELLED:
      return "warning";
    case ChurchEventStatus.COMPLETED:
      return "muted";
    default:
      return "outline";
  }
}

export function formatEventWhen(
  startsAt: string | Date,
  endsAt?: string | Date | null,
  allDay?: boolean
) {
  const start = new Date(startsAt);
  if (allDay) return format(start, "EEEE, MMMM d");
  const startLabel = format(start, "EEE, MMM d · h:mm a");
  if (!endsAt) return startLabel;
  const end = new Date(endsAt);
  if (isSameDay(start, end)) {
    return `${format(start, "EEE, MMM d · h:mm a")} – ${format(end, "h:mm a")}`;
  }
  return `${startLabel} → ${format(end, "EEE, MMM d · h:mm a")}`;
}

export function capacityPercent(
  registered: number | undefined | null,
  capacity: number | null | undefined
) {
  if (!capacity || capacity <= 0) return null;
  return Math.min(100, Math.round(((registered ?? 0) / capacity) * 100));
}

export function getMonthGrid(anchor: Date) {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const gridStart = startOfWeek(first, { weekStartsOn: 0 });
  return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
}

export function getWeekDays(anchor: Date) {
  const start = startOfWeek(anchor, { weekStartsOn: 0 });
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function isInMonth(day: Date, anchor: Date) {
  return isSameMonth(day, anchor);
}

export const EVENT_TYPE_OPTIONS = Object.values(ChurchEventType);
export const EVENT_STATUS_OPTIONS = Object.values(ChurchEventStatus);
