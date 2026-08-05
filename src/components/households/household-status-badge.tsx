import { Badge } from "@/components/ui/badge";
import {
  HOUSEHOLD_STATUS_LABELS,
  HouseholdStatus,
} from "@/domain/enums/member";
import { cn } from "@/lib/utils";

const STATUS_VARIANT: Record<
  HouseholdStatus,
  "success" | "default" | "muted" | "outline"
> = {
  [HouseholdStatus.ACTIVE]: "success",
  [HouseholdStatus.INACTIVE]: "muted",
  [HouseholdStatus.ARCHIVED]: "outline",
};

export function HouseholdStatusBadge({
  status,
  className,
}: {
  status: HouseholdStatus;
  className?: string;
}) {
  return (
    <Badge variant={STATUS_VARIANT[status]} className={cn(className)}>
      {HOUSEHOLD_STATUS_LABELS[status]}
    </Badge>
  );
}
