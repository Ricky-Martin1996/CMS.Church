import type {
  CommunicationLogEntity,
  FollowUpTaskEntity,
  ListOpenTasksQuery,
  ListVisitorsQuery,
  PipelineBoardColumn,
  VisitorDashboard,
  VisitorListItem,
  VisitorProfile,
  VisitorStageConfigEntity,
} from "@/domain/entities/visitor-journey";
import type {
  CommunicationChannel,
  CommunicationDirection,
  FollowUpPriority,
  FollowUpTaskStatus,
  FollowUpTaskType,
  VisitorPipelineStage,
} from "@/domain/enums/visitor";

export type VisitorJourneyRepository = {
  ensureStageConfigs(organizationId: string): Promise<VisitorStageConfigEntity[]>;
  bootstrapVisitorJourney(input: {
    organizationId: string;
    visitorId: string;
    actorUserId?: string | null;
  }): Promise<void>;
  listVisitors(query: ListVisitorsQuery): Promise<VisitorListItem[]>;
  getPipelineBoard(organizationId: string): Promise<PipelineBoardColumn[]>;
  getVisitorProfile(
    organizationId: string,
    visitorId: string
  ): Promise<VisitorProfile | null>;
  advanceStage(input: {
    organizationId: string;
    visitorId: string;
    actorUserId: string;
    note?: string | null;
  }): Promise<VisitorProfile>;
  setStage(input: {
    organizationId: string;
    visitorId: string;
    stage: VisitorPipelineStage;
    actorUserId: string;
    note?: string | null;
  }): Promise<VisitorProfile>;
  assignLeader(input: {
    organizationId: string;
    visitorId: string;
    leaderId: string | null;
    assignedUserId?: string | null;
    actorUserId: string;
  }): Promise<VisitorProfile>;
  createTask(input: {
    organizationId: string;
    visitorId: string;
    type: FollowUpTaskType;
    title?: string;
    description?: string | null;
    ownerUserId?: string | null;
    dueAt?: Date | null;
    priority?: FollowUpPriority;
    actorUserId: string;
    automationKey?: string | null;
  }): Promise<FollowUpTaskEntity>;
  completeTask(input: {
    organizationId: string;
    taskId: string;
    actorUserId: string;
    notes?: string | null;
  }): Promise<FollowUpTaskEntity>;
  updateTask(input: {
    organizationId: string;
    taskId: string;
    actorUserId: string;
    title?: string;
    description?: string | null;
    ownerUserId?: string | null;
    dueAt?: Date | null;
    priority?: FollowUpPriority;
    status?: FollowUpTaskStatus;
    notes?: string | null;
  }): Promise<FollowUpTaskEntity>;
  logCommunication(input: {
    organizationId: string;
    visitorId: string;
    channel: CommunicationChannel;
    direction?: CommunicationDirection;
    subject?: string | null;
    body: string;
    actorUserId: string;
    metadata?: Record<string, unknown> | null;
  }): Promise<CommunicationLogEntity>;
  convertToMember(input: {
    organizationId: string;
    visitorId: string;
    actorUserId: string;
    tagIds?: string[];
  }): Promise<{ memberId: string; profile: VisitorProfile }>;
  getDashboard(organizationId: string): Promise<VisitorDashboard>;
  listOpenTasks(query: ListOpenTasksQuery): Promise<FollowUpTaskEntity[]>;
};
