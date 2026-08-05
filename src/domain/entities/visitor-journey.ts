import type { VisitorAttendanceEntity, VisitorEntity } from "@/domain/entities/attendance";
import type {
  CommunicationChannel,
  CommunicationDirection,
  FollowUpPriority,
  FollowUpTaskStatus,
  FollowUpTaskType,
  VisitorActivityType,
  VisitorPipelineStage,
} from "@/domain/enums/visitor";

export type VisitorStageConfigEntity = {
  id: string;
  organizationId: string;
  stageKey: VisitorPipelineStage;
  label: string;
  sortOrder: number;
  isActive: boolean;
  autoTaskTypes: FollowUpTaskType[];
  slaHours: number | null;
  createdAt: Date;
  updatedAt: Date;
};

export type VisitorJourneyEntity = {
  id: string;
  organizationId: string;
  visitorId: string;
  currentStage: VisitorPipelineStage;
  startedAt: Date;
  completedAt: Date | null;
  convertedAt: Date | null;
  conversionMemberId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
};

export type FollowUpTaskEntity = {
  id: string;
  organizationId: string;
  visitorId: string;
  type: FollowUpTaskType;
  title: string;
  description: string | null;
  ownerUserId: string | null;
  dueAt: Date | null;
  priority: FollowUpPriority;
  status: FollowUpTaskStatus;
  notes: string | null;
  completedAt: Date | null;
  automationKey: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CommunicationLogEntity = {
  id: string;
  organizationId: string;
  visitorId: string;
  channel: CommunicationChannel;
  direction: CommunicationDirection;
  subject: string | null;
  body: string;
  actorUserId: string | null;
  occurredAt: Date;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
};

export type VisitorStatusHistoryEntity = {
  id: string;
  organizationId: string;
  visitorId: string;
  fromStatus: VisitorPipelineStage | null;
  toStatus: VisitorPipelineStage;
  changedByUserId: string | null;
  note: string | null;
  occurredAt: Date;
};

export type VisitorActivityEntity = {
  id: string;
  organizationId: string;
  visitorId: string;
  type: VisitorActivityType;
  title: string;
  description: string | null;
  actorUserId: string | null;
  metadata: Record<string, unknown> | null;
  occurredAt: Date;
  createdAt: Date;
};

export type VisitorHouseholdSummary = {
  id: string;
  familyName: string;
  householdCode: string;
  memberCount: number;
};

export type VisitorListItem = VisitorEntity & {
  displayName: string;
  visitCount: number;
  openTaskCount: number;
  overdueTaskCount: number;
  lastCommunicationAt: Date | null;
  assignedLeaderName: string | null;
};

export type VisitorProfile = VisitorEntity & {
  displayName: string;
  visitCount: number;
  assignedLeaderName: string | null;
  journey: VisitorJourneyEntity | null;
  attendances: VisitorAttendanceEntity[];
  tasks: FollowUpTaskEntity[];
  communications: CommunicationLogEntity[];
  statusHistory: VisitorStatusHistoryEntity[];
  activities: VisitorActivityEntity[];
  household: VisitorHouseholdSummary | null;
};

export type VisitorFunnelStage = {
  stage: VisitorPipelineStage;
  label: string;
  sortOrder: number;
  count: number;
};

export type PipelineBoardColumn = {
  stage: VisitorPipelineStage;
  label: string;
  sortOrder: number;
  visitors: VisitorListItem[];
};

export type VisitorDashboard = {
  newVisitorsCount: number;
  needingFollowUpCount: number;
  conversionRate: number;
  avgResponseTimeHours: number | null;
  openTasksCount: number;
  funnel: VisitorFunnelStage[];
  recentCommunications: CommunicationLogEntity[];
};

export type ListVisitorsQuery = {
  organizationId: string;
  status?: VisitorPipelineStage[];
  query?: string;
  assignedLeaderId?: string | null;
  needsFollowUp?: boolean;
  limit?: number;
};

export type ListOpenTasksQuery = {
  organizationId: string;
  ownerUserId?: string | null;
  visitorId?: string;
  overdueOnly?: boolean;
  limit?: number;
};
