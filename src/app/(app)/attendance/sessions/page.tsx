import type { Metadata } from "next";
import { SessionsView } from "@/components/attendance/sessions-view";

export const metadata: Metadata = {
  title: "Attendance Sessions",
};

export default function SessionsPage() {
  return <SessionsView />;
}
