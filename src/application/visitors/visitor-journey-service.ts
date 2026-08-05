import type { ListOpenTasksQuery, ListVisitorsQuery } from "@/domain/entities/visitor-journey";
import type {
  CommunicationChannel,
  CommunicationDirection,
  FollowUpPriority,
  FollowUpTaskStatus,
  FollowUpTaskType,
  VisitorPipelineStage,
} from "@/domain/enums/visitor";
import { visitorJourneyRepository } from "@/infrastructure/repositories/visitor-journey-repository";

export async function ensureVisitorStageConfigs(organizationId: string) {
  return visitorJourneyRepository.ensureStageConfigs(organizationId);
}

export async function bootstrapVisitorJourney(input: {
  organizationId: string;
  visitorId: string;
  actorUserId?: string | null;
}) {
  await visitorJourneyRepository.ensureStageConfigs(input.organizationId);
  await visitorJourneyRepository.bootstrapVisitorJourney(input);
}

export async function listVisitors(query: ListVisitorsQuery) {
  await visitorJourneyRepository.ensureStageConfigs(query.organizationId);
  return visitorJourneyRepository.listVisitors(query);
}

export async function getPipelineBoard(organizationId: string) {
  return visitorJourneyRepository.getPipelineBoard(organizationId);
}

export async function getVisitorProfile(organizationId: string, visitorId: string) {
  return visitorJourneyRepository.getVisitorProfile(organizationId, visitorId);
}

export async function advanceVisitorStage(input: {
  organizationId: string;
  visitorId: string;
  actorUserId: string;
  note?: string | null;
}) {
  return visitorJourneyRepository.advanceStage(input);
}

export async function setVisitorStage(input: {
  organizationId: string;
  visitorId: string;
  stage: VisitorPipelineStage;
  actorUserId: string;
  note?: string | null;
}) {
  return visitorJourneyRepository.setStage(input);
}

export async function assignVisitorLeader(input: {
  organizationId: string;
  visitorId: string;
  leaderId: string | null;
  assignedUserId?: string | null;
  actorUserId: string;
}) {
  return visitorJourneyRepository.assignLeader(input);
}

export async function createFollowUpTask(input: {
  organizationId: string;
  visitorId: string;
  type: FollowUpTaskType;
  title?: string;
  description?: string | null;
  ownerUserId?: string | null;
  dueAt?: Date | null;
  priority?: FollowUpPriority;
  actorUserId: string;
}) {
  return visitorJourneyRepository.createTask(input);
}

export async function completeFollowUpTask(input: {
  organizationId: string;
  taskId: string;
  actorUserId: string;
  notes?: string | null;
}) {
  return visitorJourneyRepository.completeTask(input);
}

export async function updateFollowUpTask(input: {
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
}) {
  return visitorJourneyRepository.updateTask(input);
}

export async function logVisitorCommunication(input: {
  organizationId: string;
  visitorId: string;
  channel: CommunicationChannel;
  direction?: CommunicationDirection;
  subject?: string | null;
  body: string;
  actorUserId: string;
  metadata?: Record<string, unknown> | null;
}) {
  return visitorJourneyRepository.logCommunication({
    ...input,
    metadata: input.metadata ?? { provider: null, queued: false },
  });
}

export async function convertVisitorToMember(input: {
  organizationId: string;
  visitorId: string;
  actorUserId: string;
  tagIds?: string[];
}) {
  return visitorJourneyRepository.convertToMember(input);
}

export async function getVisitorDashboard(organizationId: string) {
  await visitorJourneyRepository.ensureStageConfigs(organizationId);
  return visitorJourneyRepository.getDashboard(organizationId);
}

export async function listOpenFollowUpTasks(query: ListOpenTasksQuery) {
  return visitorJourneyRepository.listOpenTasks(query);
}
