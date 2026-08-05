import type { Metadata } from "next";
import { EventCalendarView } from "@/components/events/event-calendar-view";

export const metadata: Metadata = {
  title: "Church Calendar",
};

export default function EventsCalendarPage() {
  return <EventCalendarView />;
}
