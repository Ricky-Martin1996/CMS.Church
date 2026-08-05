import type { Metadata } from "next";
import { HouseholdsView } from "@/components/households/households-view";

export const metadata: Metadata = {
  title: "Households",
};

export default function HouseholdsPage() {
  return <HouseholdsView />;
}
