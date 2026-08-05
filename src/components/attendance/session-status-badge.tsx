"use client";

import { Badge } from "@/components/ui/badge";
import {
  AttendanceSessionStatus,
  ATTENDANCE_SESSION_STATUS_LABELS,
} from "@/domain/enums/member";
import { cn } from "@/lib/utils";

const variantMap: Record<
  AttendanceSessionStatus,
  "default" | "success" | "warning" | "muted" | "outline"
> = {
  [AttendanceSessionStatus.LIVE]: "success",
  [AttendanceSessionStatus.SCHEDULED]: "default",
  [AttendanceSessionStatus.CLOSED]: "muted",
  [AttendanceSessionStatus.CANCELLED]: "outline",
};

export function SessionStatusBadge({
  status,
  className,
  pulse,
}: {
  status: AttendanceSessionStatus;
  className?: string;
  pulse?: boolean;
}) {
  return (
    <Badge
      variant={variantMap[status]}
      className={cn(
        pulse && status === AttendanceSessionStatus.LIVE && "animate-pulse",
        className
      )}
    >
      {status === AttendanceSessionStatus.LIVE && (
        <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-success" />
      )}
      {ATTENDANCE_SESSION_STATUS_LABELS[status]}
    </Badge>
  );
}
