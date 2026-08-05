import { Badge } from "@/components/ui/badge";
import {
  VISITOR_PIPELINE_LABELS,
  VisitorPipelineStage,
} from "@/domain/enums/visitor";
import { cn } from "@/lib/utils";

const STAGE_VARIANT: Record<
  VisitorPipelineStage,
  "default" | "success" | "secondary" | "warning" | "muted" | "outline"
> = {
  [VisitorPipelineStage.FIRST_VISIT]: "secondary",
  [VisitorPipelineStage.WELCOME_SENT]: "outline",
  [VisitorPipelineStage.ASSIGNED_LEADER]: "default",
  [VisitorPipelineStage.CONTACTED]: "default",
  [VisitorPipelineStage.SECOND_VISIT]: "secondary",
  [VisitorPipelineStage.CELL_GROUP_INVITED]: "warning",
  [VisitorPipelineStage.FOUNDATION_COURSE]: "warning",
  [VisitorPipelineStage.MEMBERSHIP_INTERVIEW]: "default",
  [VisitorPipelineStage.MEMBER]: "success",
};

export function VisitorStatusBadge({
  stage,
  className,
}: {
  stage: VisitorPipelineStage;
  className?: string;
}) {
  return (
    <Badge variant={STAGE_VARIANT[stage]} className={cn(className)}>
      {VISITOR_PIPELINE_LABELS[stage]}
    </Badge>
  );
}
