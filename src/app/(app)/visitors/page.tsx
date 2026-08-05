import type { Metadata } from "next";
import { VisitorsDashboardView } from "@/components/visitors/visitors-dashboard-view";

export const metadata: Metadata = {
  title: "Visitors",
};

export default function VisitorsPage() {
  return <VisitorsDashboardView />;
}
