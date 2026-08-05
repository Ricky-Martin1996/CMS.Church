import type {
  MinistryStatus,
  ScheduleAssignmentStatus,
  ScheduleEventType,
  SwapRequestStatus,
  TrainingStatus,
  VolunteerActivityType,
  VolunteerCheckInStatus,
  VolunteerMessageChannel,
  Weekday,
} from "@/domain/enums/ministry";

export type VolunteerMemberSummary = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  campus: string | null;
};

export type MinistryEntity = {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  description: string | null;
  color: string;
  icon: string | null;
  status: MinistryStatus;
  leaderMemberId: string | null;
  sortOrder: number;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
  roleCount?: number;
  volunteerCount?: number;
};

export type MinistryRoleEntity = {
  id: string;
  organizationId: string;
  ministryId: string;
  name: string;
  description: string | null;
  slotsNeeded: number;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

export type VolunteerSkillEntity = {
  id: string;
  name: string;
  level: string | null;
};

export type VolunteerCertificationEntity = {
  id: string;
  name: string;
  issuer: string | null;
  issuedAt: Date | null;
  expiresAt: Date | null;
};

export type VolunteerAvailabilityEntity = {
  id: string;
  weekday: Weekday;
  startTime: string;
  endTime: string;
  notes: string | null;
};

export type VolunteerMinistryPreferenceEntity = {
  id: string;
  ministryId: string;
  ministryName: string;
  priority: number;
};

export type VolunteerProfileEntity = {
  id: string;
  organizationId: string;
  memberId: string;
  member: VolunteerMemberSummary;
  experienceYears: number | null;
  trainingStatus: TrainingStatus;
  preferredService: string | null;
  emergencyName: string | null;
  emergencyPhone: string | null;
  notes: string | null;
  reliabilityScore: number;
  totalHours: number;
  isActive: boolean;
  skills: VolunteerSkillEntity[];
  certifications: VolunteerCertificationEntity[];
  availabilities: VolunteerAvailabilityEntity[];
  preferences: VolunteerMinistryPreferenceEntity[];
  createdAt: Date;
  updatedAt: Date;
};

export type VolunteerListItem = VolunteerProfileEntity & {
  displayName: string;
  primaryMinistry: string | null;
  upcomingAssignmentCount: number;
};

export type ScheduleEventEntity = {
  id: string;
  organizationId: string;
  ministryId: string | null;
  ministryName: string | null;
  title: string;
  eventType: ScheduleEventType;
  campus: string | null;
  startsAt: Date;
  endsAt: Date | null;
  location: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  slotCount?: number;
  filledSlots?: number;
  neededSlots?: number;
};

export type ScheduleSlotEntity = {
  id: string;
  organizationId: string;
  eventId: string;
  roleId: string | null;
  roleName: string | null;
  title: string;
  needed: number;
  startsAt: Date;
  endsAt: Date | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  assignmentCount?: number;
  confirmedCount?: number;
};

export type ScheduleAssignmentEntity = {
  id: string;
  organizationId: string;
  slotId: string;
  volunteerId: string;
  volunteer: VolunteerMemberSummary;
  status: ScheduleAssignmentStatus;
  notes: string | null;
  assignedAt: Date;
  respondedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  slot?: Pick<ScheduleSlotEntity, "id" | "title" | "startsAt" | "endsAt">;
  event?: Pick<ScheduleEventEntity, "id" | "title" | "startsAt">;
};

export type SwapRequestEntity = {
  id: string;
  organizationId: string;
  fromAssignmentId: string;
  toAssignmentId: string | null;
  fromVolunteerId: string;
  toVolunteerId: string | null;
  fromVolunteerName: string;
  toVolunteerName: string | null;
  status: SwapRequestStatus;
  message: string | null;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt: Date | null;
};

export type VolunteerCheckInEntity = {
  id: string;
  organizationId: string;
  volunteerId: string;
  assignmentId: string | null;
  status: VolunteerCheckInStatus;
  checkedInAt: Date;
  notes: string | null;
  createdAt: Date;
  volunteer?: VolunteerMemberSummary;
};

export type VolunteerMessageEntity = {
  id: string;
  organizationId: string;
  volunteerId: string | null;
  ministryId: string | null;
  channel: VolunteerMessageChannel;
  subject: string | null;
  body: string;
  actorUserId: string | null;
  metadata: Record<string, unknown> | null;
  sentAt: Date;
  createdAt: Date;
};

export type VolunteerActivityEntity = {
  id: string;
  organizationId: string;
  volunteerId: string;
  type: VolunteerActivityType;
  title: string;
  description: string | null;
  actorUserId: string | null;
  metadata: Record<string, unknown> | null;
  occurredAt: Date;
  createdAt: Date;
};

export type ConflictInfo = {
  assignmentId: string;
  slotId: string;
  slotTitle: string;
  eventTitle: string;
  startsAt: Date;
  endsAt: Date | null;
};

export type SchedulerBoardSlot = ScheduleSlotEntity & {
  assignments: ScheduleAssignmentEntity[];
  openSpots: number;
};

export type SchedulerBoard = {
  event: ScheduleEventEntity;
  slots: SchedulerBoardSlot[];
  availableVolunteers: VolunteerListItem[];
  conflicts: ConflictInfo[];
};

export type CoverageStat = {
  ministryId: string;
  ministryName: string;
  needed: number;
  filled: number;
  coveragePercent: number;
};

export type MinistryAnalytics = {
  totalVolunteers: number;
  activeVolunteers: number;
  totalHours: number;
  averageReliability: number;
  checkInRate: number;
  coveragePercent: number;
  coverageByMinistry: CoverageStat[];
  assignmentsThisMonth: number;
  confirmedThisMonth: number;
  declinedThisMonth: number;
  ministryGrowth: Array<{
    ministryId: string;
    ministryName: string;
    volunteerCount: number;
    previousCount: number;
    growthPercent: number;
  }>;
  recentActivity: VolunteerActivityEntity[];
};

export type ListVolunteersQuery = {
  organizationId: string;
  ministryId?: string;
  isActive?: boolean;
  query?: string;
  limit?: number;
};

export type ListScheduleEventsQuery = {
  organizationId: string;
  from?: Date;
  to?: Date;
  ministryId?: string;
  eventType?: ScheduleEventType;
  limit?: number;
};

export type CreateScheduleEventInput = {
  organizationId: string;
  ministryId?: string | null;
  title: string;
  eventType?: ScheduleEventType;
  campus?: string | null;
  startsAt: Date;
  endsAt?: Date | null;
  location?: string | null;
  notes?: string | null;
  slots: Array<{
    roleId?: string | null;
    title: string;
    needed?: number;
    startsAt: Date;
    endsAt?: Date | null;
    sortOrder?: number;
  }>;
  actorUserId?: string | null;
};

export type UpsertVolunteerProfileInput = {
  organizationId: string;
  memberId: string;
  experienceYears?: number | null;
  trainingStatus?: TrainingStatus;
  preferredService?: string | null;
  emergencyName?: string | null;
  emergencyPhone?: string | null;
  notes?: string | null;
  reliabilityScore?: number;
  isActive?: boolean;
  skills?: Array<{ name: string; level?: string | null }>;
  certifications?: Array<{
    name: string;
    issuer?: string | null;
    issuedAt?: Date | null;
    expiresAt?: Date | null;
  }>;
  availabilities?: Array<{
    weekday: Weekday;
    startTime: string;
    endTime: string;
    notes?: string | null;
  }>;
  ministryPreferences?: Array<{ ministryId: string; priority?: number }>;
  actorUserId?: string | null;
};
