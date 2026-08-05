import type { Metadata } from "next";
import { EventCheckInView } from "@/components/events/event-check-in-view";

export const metadata: Metadata = {
  title: "Event Check-in",
};

export default async function EventCheckInPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EventCheckInView eventId={id} />;
}
