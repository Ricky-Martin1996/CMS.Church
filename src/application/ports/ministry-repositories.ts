import type {
  ConflictInfo,
  CreateScheduleEventInput,
  ListScheduleEventsQuery,
  ListVolunteersQuery,
  MinistryAnalytics,
  MinistryEntity,
  MinistryRoleEntity,
  ScheduleAssignmentEntity,
  ScheduleEventEntity,
  SchedulerBoard,
  SwapRequestEntity,
  UpsertVolunteerProfileInput,
  VolunteerCheckInEntity,
  VolunteerListItem,
  VolunteerMessageEntity,
  VolunteerProfileEntity,
} from "@/domain/entities/ministry";
import type {
  MinistryStatus,
  ScheduleAssignmentStatus,
  SwapRequestStatus,
  VolunteerCheckInStatus,
  VolunteerMessageChannel,
} from "@/domain/enums/ministry";

export type MinistryRepository = {
  ensureDefaultMinistries(organizationId: string): Promise<MinistryEntity[]>;
  listMinistries(organizationId: string): Promise<MinistryEntity[]>;
  createMinistry(input: {
    organizationId: string;
    name: string;
    slug: string;
    description?: string | null;
    color?: string;
    icon?: string | null;
    leaderMemberId?: string | null;
    sortOrder?: number;
    actorUserId?: string | null;
  }): Promise<MinistryEntity>;
  updateMinistry(input: {
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
  }): Promise<MinistryEntity>;
  listRoles(organizationId: string, ministryId: string): Promise<MinistryRoleEntity[]>;
  createRole(input: {
    organizationId: string;
    ministryId: string;
    name: string;
    description?: string | null;
    slotsNeeded?: number;
    sortOrder?: number;
    actorUserId?: string | null;
  }): Promise<MinistryRoleEntity>;
  updateRole(input: {
    organizationId: string;
    roleId: string;
    name?: string;
    description?: string | null;
    slotsNeeded?: number;
    sortOrder?: number;
    actorUserId?: string | null;
  }): Promise<MinistryRoleEntity>;
  listVolunteers(query: ListVolunteersQuery): Promise<VolunteerListItem[]>;
  getVolunteerProfile(
    organizationId: string,
    volunteerId: string
  ): Promise<VolunteerProfileEntity | null>;
  getVolunteerProfileByMember(
    organizationId: string,
    memberId: string
  ): Promise<VolunteerProfileEntity | null>;
  upsertVolunteerProfile(input: UpsertVolunteerProfileInput): Promise<VolunteerProfileEntity>;
  listScheduleEvents(query: ListScheduleEventsQuery): Promise<ScheduleEventEntity[]>;
  createScheduleEvent(input: CreateScheduleEventInput): Promise<ScheduleEventEntity>;
  getSchedulerBoard(input: {
    organizationId: string;
    eventId?: string;
    date?: Date;
  }): Promise<SchedulerBoard | null>;
  assignVolunteer(input: {
    organizationId: string;
    slotId: string;
    volunteerId: string;
    notes?: string | null;
    actorUserId?: string | null;
  }): Promise<{ assignment: ScheduleAssignmentEntity; conflicts: ConflictInfo[] }>;
  updateAssignmentStatus(input: {
    organizationId: string;
    assignmentId: string;
    status: ScheduleAssignmentStatus;
    actorUserId?: string | null;
  }): Promise<ScheduleAssignmentEntity>;
  createSwapRequest(input: {
    organizationId: string;
    fromAssignmentId: string;
    toVolunteerId?: string | null;
    message?: string | null;
    actorUserId?: string | null;
  }): Promise<SwapRequestEntity>;
  resolveSwapRequest(input: {
    organizationId: string;
    swapRequestId: string;
    accept: boolean;
    actorUserId?: string | null;
  }): Promise<SwapRequestEntity>;
  checkInVolunteer(input: {
    organizationId: string;
    volunteerId: string;
    assignmentId?: string | null;
    status: VolunteerCheckInStatus;
    notes?: string | null;
    actorUserId?: string | null;
  }): Promise<VolunteerCheckInEntity>;
  sendMessage(input: {
    organizationId: string;
    volunteerId?: string | null;
    ministryId?: string | null;
    channel: VolunteerMessageChannel;
    subject?: string | null;
    body: string;
    actorUserId?: string | null;
  }): Promise<VolunteerMessageEntity>;
  getAnalytics(organizationId: string): Promise<MinistryAnalytics>;
};
