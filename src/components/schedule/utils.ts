import {
  addDays,
  endOfWeek,
  format,
  isValid,
  parseISO,
  startOfWeek,
} from "date-fns";
import { ScheduleAssignmentStatus } from "@/domain/enums/ministry";

export type DateLike = string | Date | null | undefined;

export function parseDate(value: DateLike): Date | null {
  if (!value) return null;
  if (value instanceof Date) return isValid(value) ? value : null;
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : null;
}

export function formatScheduleDate(value: DateLike, pattern = "MMM d, yyyy") {
  const date = parseDate(value);
  return date ? format(date, pattern) : "—";
}

export function formatScheduleDateTime(value: DateLike) {
  const date = parseDate(value);
  return date ? format(date, "EEE, MMM d · h:mm a") : "—";
}

export function formatSlotTime(value: DateLike) {
  const date = parseDate(value);
  return date ? format(date, "h:mm a") : "—";
}

export function getWeekRange(date: Date) {
  const start = startOfWeek(date, { weekStartsOn: 0 });
  const end = endOfWeek(date, { weekStartsOn: 0 });
  return { start, end };
}

export function getWeekDays(date: Date) {
  const start = startOfWeek(date, { weekStartsOn: 0 });
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function toIsoDateTimeInput(date: Date = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function assignmentStatusVariant(status: ScheduleAssignmentStatus) {
  switch (status) {
    case ScheduleAssignmentStatus.CONFIRMED:
    case ScheduleAssignmentStatus.COMPLETED:
      return "success" as const;
    case ScheduleAssignmentStatus.ASSIGNED:
      return "default" as const;
    case ScheduleAssignmentStatus.DECLINED:
    case ScheduleAssignmentStatus.NO_SHOW:
      return "warning" as const;
    case ScheduleAssignmentStatus.CANCELLED:
      return "muted" as const;
    default:
      return "outline" as const;
  }
}

export function volunteerDragId(volunteerId: string) {
  return `volunteer:${volunteerId}`;
}

export function slotDropId(slotId: string) {
  return `slot:${slotId}`;
}

export function parseVolunteerDragId(id: string) {
  return id.startsWith("volunteer:") ? id.slice(10) : null;
}

export function parseSlotDropId(id: string) {
  return id.startsWith("slot:") ? id.slice(5) : null;
}
