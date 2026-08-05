import type { Metadata } from "next";
import { VisitorTasksView } from "@/components/visitors/visitor-tasks-view";

export const metadata: Metadata = {
  title: "Visitor Tasks",
};

export default function VisitorTasksPage() {
  return <VisitorTasksView />;
}
