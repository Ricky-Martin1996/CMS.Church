import type { Metadata } from "next";
import { VisitorPipelineView } from "@/components/visitors/visitor-pipeline-view";

export const metadata: Metadata = {
  title: "Visitor Pipeline",
};

export default function VisitorPipelinePage() {
  return <VisitorPipelineView />;
}
