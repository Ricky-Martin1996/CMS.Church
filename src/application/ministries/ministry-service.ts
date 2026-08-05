import type {
  CreateScheduleEventInput,
  ListScheduleEventsQuery,
  ListVolunteersQuery,
  UpsertVolunteerProfileInput,
} from "@/domain/entities/ministry";
import type {
  MinistryStatus,
  ScheduleAssignmentStatus,
  VolunteerCheckInStatus,
  VolunteerMessageChannel,
} from "@/domain/enums/ministry";
import { ministryRepository } from "@/infrastructure/repositories/ministry-repository";
import { notFound } from "@/server/errors";

export async function ensureDefaultMinistries(organizationId: string) {
  return ministryRepository.ensureDefaultMinistries(organizationId);
}

export async function listMinistries(organizationId: string) {
  return ministryRepository.listMinistries(organizationId);
}

export async function createMinistry(input: {
  organizationId: string;
  name: string;
  slug: string;
  description?: string | null;
  color?: string;
  icon?: string | null;
  leaderMemberId?: string | null;
  sortOrder?: number;
  actorUserId?: string | null;
}) {
  return ministryRepository.createMinistry(input);
}

export async function updateMinistry(input: {
  organizationId: string;
  ministryId: string;
  name?: string;
  description?: string | null;
  color?: string;
  icon?: string | null;
  status?: MinistryStatus;
  leaderMemberId?: string | null;
  sortOrder?: number;
  actorUserId?: string | null;
}) {
  return ministryRepository.updateMinistry(input);
}

export async function listVolunteers(query: ListVolunteersQuery) {
  return ministryRepository.listVolunteers(query);
}

export async function getVolunteerProfile(
  organizationId: string,
  volunteerId: string
) {
  const profile = await ministryRepository.getVolunteerProfile(
    organizationId,
    volunteerId
  );
  if (!profile) throw notFound("Volunteer profile not found");
  return profile;
}

export async function upsertVolunteerProfile(input: UpsertVolunteerProfileInput) {
  return ministryRepository.upsertVolunteerProfile(input);
}

export async function listScheduleEvents(query: ListScheduleEventsQuery) {
  return ministryRepository.listScheduleEvents(query);
}

export async function createScheduleEvent(input: CreateScheduleEventInput) {
  return ministryRepository.createScheduleEvent(input);
}

export async function getSchedulerBoard(input: {
  organizationId: string;
  eventId?: string;
  date?: Date;
}) {
  const board = await ministryRepository.getSchedulerBoard(input);
  if (!board) throw notFound("Schedule event not found");
  return board;
}

export async function assignVolunteer(input: {
  organizationId: string;
  slotId: string;
  volunteerId: string;
  notes?: string | null;
  actorUserId?: string | null;
}) {
  return ministryRepository.assignVolunteer(input);
}

export async function updateAssignmentStatus(input: {
  organizationId: string;
  assignmentId: string;
  status: ScheduleAssignmentStatus;
  actorUserId?: string | null;
}) {
  return ministryRepository.updateAssignmentStatus(input);
}

export async function createSwapRequest(input: {
  organizationId: string;
  fromAssignmentId: string;
  toVolunteerId?: string | null;
  message?: string | null;
  actorUserId?: string | null;
}) {
  return ministryRepository.createSwapRequest(input);
}

export async function resolveSwapRequest(input: {
  organizationId: string;
  swapRequestId: string;
  accept: boolean;
  actorUserId?: string | null;
}) {
  return ministryRepository.resolveSwapRequest(input);
}

export async function checkInVolunteer(input: {
  organizationId: string;
  volunteerId: string;
  assignmentId?: string | null;
  status: VolunteerCheckInStatus;
  notes?: string | null;
  actorUserId?: string | null;
}) {
  return ministryRepository.checkInVolunteer(input);
}

export async function sendVolunteerMessage(input: {
  organizationId: string;
  volunteerId?: string | null;
  ministryId?: string | null;
  channel: VolunteerMessageChannel;
  subject?: string | null;
  body: string;
  actorUserId?: string | null;
}) {
  return ministryRepository.sendMessage(input);
}

export async function getMinistryAnalytics(organizationId: string) {
  return ministryRepository.getAnalytics(organizationId);
}
