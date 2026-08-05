import type { Metadata } from "next";
import { Suspense } from "react";
import { ScheduleView } from "@/components/schedule/schedule-view";
import { LoadingState } from "@/components/shared/states";

export const metadata: Metadata = {
  title: "Schedule",
};

export default function SchedulePage() {
  return (
    <Suspense fallback={<LoadingState label="Loading schedule…" />}>
      <ScheduleView />
    </Suspense>
  );
}
