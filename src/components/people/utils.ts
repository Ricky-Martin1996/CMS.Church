import { format, parseISO, isValid } from "date-fns";
import type { MemberListItem } from "@/domain/entities/member";

export type DateLike = string | Date | null | undefined;

export function parseDate(value: DateLike): Date | null {
  if (!value) return null;
  if (value instanceof Date) return isValid(value) ? value : null;
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : null;
}

export function formatMemberDate(value: DateLike, pattern = "MMM d, yyyy") {
  const date = parseDate(value);
  return date ? format(date, pattern) : "—";
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function memberToCsvRow(member: MemberListItem) {
  return [
    member.firstName,
    member.lastName,
    member.email ?? "",
    member.phone ?? "",
    member.status,
    member.campus ?? "",
    member.ministryRole ?? "",
    member.tags.map((t) => t.name).join(";"),
    String(member.engagementScore),
    formatMemberDate(member.joinedAt),
  ];
}

export const CSV_HEADERS = [
  "firstName",
  "lastName",
  "email",
  "phone",
  "status",
  "campus",
  "ministryRole",
  "tags",
  "engagement",
  "joinedAt",
];

export function membersToCsv(members: MemberListItem[]) {
  const lines = [
    CSV_HEADERS.join(","),
    ...members.map((m) =>
      memberToCsvRow(m)
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    ),
  ];
  return lines.join("\n");
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
