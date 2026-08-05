import { format, formatDistanceToNow } from "date-fns";
import {
  ATTENDANCE_METHOD_LABELS,
  ATTENDANCE_SESSION_TYPE_LABELS,
  type AttendanceMethod,
  type AttendanceSessionType,
} from "@/domain/enums/member";

export function formatSessionDate(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "MMM d, yyyy");
}

export function formatSessionDateTime(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "MMM d, yyyy · h:mm a");
}

export function formatCheckInTime(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

export function getInitials(firstName: string, lastName?: string) {
  return `${firstName.charAt(0)}${lastName?.charAt(0) ?? ""}`.toUpperCase();
}

export function formatMethod(method: AttendanceMethod) {
  return ATTENDANCE_METHOD_LABELS[method];
}

export function formatSessionType(type: AttendanceSessionType) {
  return ATTENDANCE_SESSION_TYPE_LABELS[type];
}

export function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function toIsoDateInput(date: Date = new Date()) {
  return date.toISOString().slice(0, 16);
}
