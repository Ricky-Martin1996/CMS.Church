import { format, parseISO, isValid } from "date-fns";
import type { HouseholdListItem } from "@/domain/entities/household";

export type DateLike = string | Date | null | undefined;

export function parseDate(value: DateLike): Date | null {
  if (!value) return null;
  if (value instanceof Date) return isValid(value) ? value : null;
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : null;
}

export function formatHouseholdDate(value: DateLike, pattern = "MMM d, yyyy") {
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

export function formatAddress(household: {
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
}) {
  const parts = [
    household.addressLine1,
    household.addressLine2,
    [household.city, household.state].filter(Boolean).join(", ") || null,
    household.postalCode,
    household.country,
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : null;
}

export function householdToCsvRow(h: HouseholdListItem) {
  return [
    h.familyName,
    h.householdCode,
    String(h.memberCount),
    h.headName ?? "",
    h.status,
    h.cellGroup ?? "",
    String(h.engagementScore),
    h.city ?? "",
    formatHouseholdDate(h.updatedAt),
  ];
}

export const HOUSEHOLD_CSV_HEADERS = [
  "familyName",
  "householdCode",
  "members",
  "head",
  "status",
  "cellGroup",
  "engagement",
  "city",
  "updatedAt",
];

export function householdsToCsv(households: HouseholdListItem[]) {
  const lines = [
    HOUSEHOLD_CSV_HEADERS.join(","),
    ...households.map((h) =>
      householdToCsvRow(h)
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

export function memberDisplayName(member?: {
  firstName: string;
  lastName: string;
}) {
  if (!member) return "Unknown";
  return `${member.firstName} ${member.lastName}`.trim();
}
