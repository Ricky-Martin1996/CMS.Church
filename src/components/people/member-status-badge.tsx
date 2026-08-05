import { Badge } from "@/components/ui/badge";
import {
  MEMBER_STATUS_LABELS,
  MemberLifecycle,
  MemberStatus,
} from "@/domain/enums/member";
import { cn } from "@/lib/utils";

const STATUS_VARIANT: Record<
  MemberStatus,
  "success" | "default" | "muted" | "warning" | "outline"
> = {
  [MemberStatus.ACTIVE]: "success",
  [MemberStatus.VISITOR]: "default",
  [MemberStatus.INACTIVE]: "muted",
  [MemberStatus.NEW_MEMBER]: "success",
  [MemberStatus.TRANSFERRED]: "outline",
  [MemberStatus.DECEASED]: "muted",
};

const LIFECYCLE_LABELS: Record<MemberLifecycle, string> = {
  [MemberLifecycle.PROSPECT]: "Prospect",
  [MemberLifecycle.VISITOR]: "Visitor",
  [MemberLifecycle.REGULAR]: "Regular",
  [MemberLifecycle.MEMBER]: "Member",
  [MemberLifecycle.LEADER]: "Leader",
  [MemberLifecycle.ALUMNI]: "Alumni",
};

export function MemberStatusBadge({
  status,
  className,
}: {
  status: MemberStatus;
  className?: string;
}) {
  return (
    <Badge variant={STATUS_VARIANT[status]} className={cn(className)}>
      {MEMBER_STATUS_LABELS[status]}
    </Badge>
  );
}

export function MemberLifecycleBadge({
  lifecycle,
  className,
}: {
  lifecycle: MemberLifecycle;
  className?: string;
}) {
  return (
    <Badge variant="outline" className={cn(className)}>
      {LIFECYCLE_LABELS[lifecycle]}
    </Badge>
  );
}
