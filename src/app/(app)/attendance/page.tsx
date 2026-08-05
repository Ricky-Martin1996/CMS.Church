import type { Metadata } from "next";
import { AttendanceDashboardView } from "@/components/attendance/attendance-dashboard-view";

export const metadata: Metadata = {
  title: "Attendance",
};

export default function AttendancePage() {
  return <AttendanceDashboardView />;
}
