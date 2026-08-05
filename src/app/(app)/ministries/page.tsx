import type { Metadata } from "next";
import { MinistriesView } from "@/components/ministries/ministries-view";

export const metadata: Metadata = {
  title: "Ministries",
};

export default function MinistriesPage() {
  return <MinistriesView />;
}
