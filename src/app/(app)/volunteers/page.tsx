import type { Metadata } from "next";
import { VolunteersView } from "@/components/volunteers/volunteers-view";

export const metadata: Metadata = {
  title: "Volunteers",
};

export default function VolunteersPage() {
  return <VolunteersView />;
}
