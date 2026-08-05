import type { Metadata } from "next";
import { GivingView } from "@/components/giving/giving-view";

export const metadata: Metadata = {
  title: "Giving",
};

export default function GivingPage() {
  return <GivingView />;
}
