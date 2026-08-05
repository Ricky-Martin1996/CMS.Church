import type { Metadata } from "next";
import { TemplatesView } from "@/components/communications/templates-view";

export const metadata: Metadata = {
  title: "Message Templates",
};

export default function TemplatesPage() {
  return <TemplatesView />;
}
