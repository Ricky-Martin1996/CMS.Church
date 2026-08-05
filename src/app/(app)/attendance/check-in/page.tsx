import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckInDeskView } from "@/components/attendance/check-in-desk-view";
import { LoadingState } from "@/components/shared/states";

export const metadata: Metadata = {
  title: "Check-in Desk",
};

export default function CheckInPage() {
  return (
    <Suspense fallback={<LoadingState label="Loading check-in desk…" />}>
      <CheckInDeskView />
    </Suspense>
  );
}
