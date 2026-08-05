import type { MinistryRepository } from "@/application/ports/ministry-repositories";
import type {
  ConflictInfo,
  MinistryAnalytics,
  MinistryEntity,
  MinistryRoleEntity,
  ScheduleAssignmentEntity,
  ScheduleEventEntity,
  ScheduleSlotEntity,
  SchedulerBoard,
  SwapRequestEntity,
  VolunteerActivityEntity,
  VolunteerCheckInEntity,
  VolunteerListItem,
  VolunteerMemberSummary,
  VolunteerMessageEntity,
  VolunteerProfileEntity,
} from "@/domain/entities/ministry";
import {
  DEFAULT_MINISTRIES,
  ScheduleAssignmentStatus,
  SwapRequestStatus,
  TrainingStatus,
  VolunteerActivityType,
  VolunteerCheckInStatus,
  Weekday,
} from "@/domain/enums/ministry";
import type {
  MinistryStatus,
  ScheduleEventType,
  VolunteerMessageChannel,
} from "@/domain/enums/ministry";
import { prisma } from "@/infrastructure/db/prisma";
import { conflict, notFound } from "@/server/errors";
import type {
  MinistryStatus as PrismaMinistryStatus,
  Prisma,
  ScheduleAssignmentStatus as PrismaScheduleAssignmentStatus,
  ScheduleEventType as PrismaScheduleEventType,
  SwapRequestStatus as PrismaSwapRequestStatus,
  TrainingStatus as PrismaTrainingStatus,
  VolunteerActivityType as PrismaVolunteerActivityType,
  VolunteerCheckInStatus as PrismaVolunteerCheckInStatus,
  VolunteerMessageChannel as PrismaVolunteerMessageChannel,
  Weekday as PrismaWeekday,
} from "@prisma/client";
import {
  endOfDay,
  endOfMonth,
  getDay,
  startOfDay,
  startOfMonth,
  subMonths,
} from "date-fns";

const DEFAULT_MESSAGE_METADATA = { provider: null, queued: false };

const MEMBER_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  avatarUrl: true,
  campus: true,
} as const;

const ACTIVE_ASSIGNMENT_STATUSES: PrismaScheduleAssignmentStatus[] = [
  "ASSIGNED",
  "CONFIRMED",
];

function asJsonRecord(value: unknown): Record<string, unknown> | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function mapMemberSummary(row: {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  campus: string | null;
}): VolunteerMemberSummary {
  return {
    id: row.id,
    firstName: row.firstName,
    lastName: row.lastName,
    email: row.email,
    phone: row.phone,
    avatarUrl: row.avatarUrl,
    campus: row.campus,
  };
}

function displayName(firstName: string, lastName: string) {
  return `${firstName} ${lastName}`.trim();
}

function mapMinistry(row: {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  description: string | null;
  color: string;
  icon: string | null;
  status: PrismaMinistryStatus;
  leaderMemberId: string | null;
  sortOrder: number;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
  _count?: { roles: number; preferences: number };
}): MinistryEntity {
  return {
    id: row.id,
    organizationId: row.organizationId,
    name: row.name,
    slug: row.slug,
    description: row.description,
    color: row.color,
    icon: row.icon,
    status: row.status as MinistryStatus,
    leaderMemberId: row.leaderMemberId,
    sortOrder: row.sortOrder,
    isDefault: row.isDefault,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    roleCount: row._count?.roles,
    volunteerCount: row._count?.preferences,
  };
}

function mapRole(row: {
  id: string;
  organizationId: string;
  ministryId: string;
  name: string;
  description: string | null;
  slotsNeeded: number;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}): MinistryRoleEntity {
  return {
    id: row.id,
    organizationId: row.organizationId,
    ministryId: row.ministryId,
    name: row.name,
    description: row.description,
    slotsNeeded: row.slotsNeeded,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapProfile(row: {
  id: string;
  organizationId: string;
  memberId: string;
  experienceYears: number | null;
  trainingStatus: PrismaTrainingStatus;
  preferredService: string | null;
  emergencyName: string | null;
  emergencyPhone: string | null;
  notes: string | null;
  reliabilityScore: number;
  totalHours: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  member: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    avatarUrl: string | null;
    campus: string | null;
  };
  skills?: Array<{ id: string; name: string; level: string | null }>;
  certifications?: Array<{
    id: string;
    name: string;
    issuer: string | null;
    issuedAt: Date | null;
    expiresAt: Date | null;
  }>;
  availabilities?: Array<{
    id: string;
    weekday: PrismaWeekday;
    startTime: string;
    endTime: string;
    notes: string | null;
  }>;
  preferences?: Array<{
    id: string;
    ministryId: string;
    priority: number;
    ministry?: { name: string };
  }>;
}): VolunteerProfileEntity {
  return {
    id: row.id,
    organizationId: row.organizationId,
    memberId: row.memberId,
    member: mapMemberSummary(row.member),
    experienceYears: row.experienceYears,
    trainingStatus: row.trainingStatus as TrainingStatus,
    preferredService: row.preferredService,
    emergencyName: row.emergencyName,
    emergencyPhone: row.emergencyPhone,
    notes: row.notes,
    reliabilityScore: row.reliabilityScore,
    totalHours: row.totalHours,
    isActive: row.isActive,
    skills: (row.skills ?? []).map((s) => ({
      id: s.id,
      name: s.name,
      level: s.level,
    })),
    certifications: (row.certifications ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      issuer: c.issuer,
      issuedAt: c.issuedAt,
      expiresAt: c.expiresAt,
    })),
    availabilities: (row.availabilities ?? []).map((a) => ({
      id: a.id,
      weekday: a.weekday as Weekday,
      startTime: a.startTime,
      endTime: a.endTime,
      notes: a.notes,
    })),
    preferences: (row.preferences ?? []).map((p) => ({
      id: p.id,
      ministryId: p.ministryId,
      ministryName: p.ministry?.name ?? "",
      priority: p.priority,
    })),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapEvent(row: {
  id: string;
  organizationId: string;
  ministryId: string | null;
  title: string;
  eventType: PrismaScheduleEventType;
  campus: string | null;
  startsAt: Date;
  endsAt: Date | null;
  location: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  ministry?: { name: string } | null;
  slots?: Array<{
    needed: number;
    assignments: Array<{ status: PrismaScheduleAssignmentStatus }>;
  }>;
}): ScheduleEventEntity {
  let neededSlots = 0;
  let filledSlots = 0;
  if (row.slots) {
    for (const slot of row.slots) {
      neededSlots += slot.needed;
      filledSlots += slot.assignments.filter((a) =>
        ACTIVE_ASSIGNMENT_STATUSES.includes(a.status)
      ).length;
    }
  }

  return {
    id: row.id,
    organizationId: row.organizationId,
    ministryId: row.ministryId,
    ministryName: row.ministry?.name ?? null,
    title: row.title,
    eventType: row.eventType as ScheduleEventType,
    campus: row.campus,
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    location: row.location,
    notes: row.notes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    slotCount: row.slots?.length,
    neededSlots: row.slots ? neededSlots : undefined,
    filledSlots: row.slots ? filledSlots : undefined,
  };
}

function mapSlot(row: {
  id: string;
  organizationId: string;
  eventId: string;
  roleId: string | null;
  title: string;
  needed: number;
  startsAt: Date;
  endsAt: Date | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  role?: { name: string } | null;
  assignments?: Array<{ status: PrismaScheduleAssignmentStatus }>;
}): ScheduleSlotEntity {
  const confirmedCount = row.assignments?.filter(
    (a) => a.status === "CONFIRMED" || a.status === "ASSIGNED"
  ).length;

  return {
    id: row.id,
    organizationId: row.organizationId,
    eventId: row.eventId,
    roleId: row.roleId,
    roleName: row.role?.name ?? null,
    title: row.title,
    needed: row.needed,
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    assignmentCount: row.assignments?.length,
    confirmedCount,
  };
}

function mapAssignment(row: {
  id: string;
  organizationId: string;
  slotId: string;
  volunteerId: string;
  status: PrismaScheduleAssignmentStatus;
  notes: string | null;
  assignedAt: Date;
  respondedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  volunteer: {
    member: {
      id: string;
      firstName: string;
      lastName: string;
      email: string | null;
      phone: string | null;
      avatarUrl: string | null;
      campus: string | null;
    };
  };
  slot?: {
    id: string;
    title: string;
    startsAt: Date;
    endsAt: Date | null;
    event?: { id: string; title: string; startsAt: Date };
  };
}): ScheduleAssignmentEntity {
  return {
    id: row.id,
    organizationId: row.organizationId,
    slotId: row.slotId,
    volunteerId: row.volunteerId,
    volunteer: mapMemberSummary(row.volunteer.member),
    status: row.status as ScheduleAssignmentStatus,
    notes: row.notes,
    assignedAt: row.assignedAt,
    respondedAt: row.respondedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    slot: row.slot
      ? {
          id: row.slot.id,
          title: row.slot.title,
          startsAt: row.slot.startsAt,
          endsAt: row.slot.endsAt,
        }
      : undefined,
    event: row.slot?.event
      ? {
          id: row.slot.event.id,
          title: row.slot.event.title,
          startsAt: row.slot.event.startsAt,
        }
      : undefined,
  };
}

function mapSwap(row: {
  id: string;
  organizationId: string;
  fromAssignmentId: string;
  toAssignmentId: string | null;
  fromVolunteerId: string;
  toVolunteerId: string | null;
  status: PrismaSwapRequestStatus;
  message: string | null;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt: Date | null;
  fromVolunteer: { member: { firstName: string; lastName: string } };
  toVolunteer?: { member: { firstName: string; lastName: string } } | null;
}): SwapRequestEntity {
  return {
    id: row.id,
    organizationId: row.organizationId,
    fromAssignmentId: row.fromAssignmentId,
    toAssignmentId: row.toAssignmentId,
    fromVolunteerId: row.fromVolunteerId,
    toVolunteerId: row.toVolunteerId,
    fromVolunteerName: displayName(
      row.fromVolunteer.member.firstName,
      row.fromVolunteer.member.lastName
    ),
    toVolunteerName: row.toVolunteer
      ? displayName(
          row.toVolunteer.member.firstName,
          row.toVolunteer.member.lastName
        )
      : null,
    status: row.status as SwapRequestStatus,
    message: row.message,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    resolvedAt: row.resolvedAt,
  };
}

function mapCheckIn(row: {
  id: string;
  organizationId: string;
  volunteerId: string;
  assignmentId: string | null;
  status: PrismaVolunteerCheckInStatus;
  checkedInAt: Date;
  notes: string | null;
  createdAt: Date;
  volunteer?: {
    member: {
      id: string;
      firstName: string;
      lastName: string;
      email: string | null;
      phone: string | null;
      avatarUrl: string | null;
      campus: string | null;
    };
  };
}): VolunteerCheckInEntity {
  return {
    id: row.id,
    organizationId: row.organizationId,
    volunteerId: row.volunteerId,
    assignmentId: row.assignmentId,
    status: row.status as VolunteerCheckInStatus,
    checkedInAt: row.checkedInAt,
    notes: row.notes,
    createdAt: row.createdAt,
    volunteer: row.volunteer
      ? mapMemberSummary(row.volunteer.member)
      : undefined,
  };
}

function mapMessage(row: {
  id: string;
  organizationId: string;
  volunteerId: string | null;
  ministryId: string | null;
  channel: PrismaVolunteerMessageChannel;
  subject: string | null;
  body: string;
  actorUserId: string | null;
  metadata: unknown;
  sentAt: Date;
  createdAt: Date;
}): VolunteerMessageEntity {
  return {
    id: row.id,
    organizationId: row.organizationId,
    volunteerId: row.volunteerId,
    ministryId: row.ministryId,
    channel: row.channel as VolunteerMessageChannel,
    subject: row.subject,
    body: row.body,
    actorUserId: row.actorUserId,
    metadata: asJsonRecord(row.metadata),
    sentAt: row.sentAt,
    createdAt: row.createdAt,
  };
}

function mapActivity(row: {
  id: string;
  organizationId: string;
  volunteerId: string;
  type: PrismaVolunteerActivityType;
  title: string;
  description: string | null;
  actorUserId: string | null;
  metadata: unknown;
  occurredAt: Date;
  createdAt: Date;
}): VolunteerActivityEntity {
  return {
    id: row.id,
    organizationId: row.organizationId,
    volunteerId: row.volunteerId,
    type: row.type as VolunteerActivityType,
    title: row.title,
    description: row.description,
    actorUserId: row.actorUserId,
    metadata: asJsonRecord(row.metadata),
    occurredAt: row.occurredAt,
    createdAt: row.createdAt,
  };
}

function slotsOverlap(
  aStart: Date,
  aEnd: Date | null,
  bStart: Date,
  bEnd: Date | null
): boolean {
  const aEndTime = aEnd?.getTime() ?? aStart.getTime() + 2 * 60 * 60 * 1000;
  const bEndTime = bEnd?.getTime() ?? bStart.getTime() + 2 * 60 * 60 * 1000;
  return aStart.getTime() < bEndTime && bStart.getTime() < aEndTime;
}

const WEEKDAY_MAP: Weekday[] = [
  Weekday.SUN,
  Weekday.MON,
  Weekday.TUE,
  Weekday.WED,
  Weekday.THU,
  Weekday.FRI,
  Weekday.SAT,
];

function volunteerAvailableOnDate(
  availabilities: Array<{ weekday: Weekday; startTime: string; endTime: string }>,
  date: Date
): boolean {
  if (availabilities.length === 0) return true;
  const weekday = WEEKDAY_MAP[getDay(date)]!;
  return availabilities.some((a) => a.weekday === weekday);
}

const PROFILE_INCLUDE = {
  member: { select: MEMBER_SELECT },
  skills: true,
  certifications: true,
  availabilities: true,
  preferences: { include: { ministry: { select: { name: true } } } },
} as const;

async function logVolunteerActivity(input: {
  organizationId: string;
  volunteerId: string;
  type: VolunteerActivityType;
  title: string;
  description?: string | null;
  actorUserId?: string | null;
  metadata?: Record<string, unknown> | null;
}) {
  await prisma.volunteerActivity.create({
    data: {
      organizationId: input.organizationId,
      volunteerId: input.volunteerId,
      type: input.type as PrismaVolunteerActivityType,
      title: input.title,
      description: input.description ?? null,
      actorUserId: input.actorUserId ?? null,
      metadata: (input.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
    },
  });
}

async function findAssignmentConflicts(
  organizationId: string,
  volunteerId: string,
  slotStartsAt: Date,
  slotEndsAt: Date | null,
  excludeSlotId?: string
): Promise<ConflictInfo[]> {
  const assignments = await prisma.scheduleAssignment.findMany({
    where: {
      organizationId,
      volunteerId,
      status: { in: ACTIVE_ASSIGNMENT_STATUSES },
      slot: excludeSlotId ? { id: { not: excludeSlotId } } : undefined,
    },
    include: {
      slot: {
        include: { event: { select: { title: true } } },
      },
    },
  });

  const conflicts: ConflictInfo[] = [];
  for (const a of assignments) {
    if (
      slotsOverlap(slotStartsAt, slotEndsAt, a.slot.startsAt, a.slot.endsAt)
    ) {
      conflicts.push({
        assignmentId: a.id,
        slotId: a.slotId,
        slotTitle: a.slot.title,
        eventTitle: a.slot.event.title,
        startsAt: a.slot.startsAt,
        endsAt: a.slot.endsAt,
      });
    }
  }
  return conflicts;
}

export const ministryRepository: MinistryRepository = {
  async ensureDefaultMinistries(organizationId) {
    const existing = await prisma.ministry.findMany({
      where: { organizationId, isDefault: true },
      include: { _count: { select: { roles: true, preferences: true } } },
      orderBy: { sortOrder: "asc" },
    });

    if (existing.length >= DEFAULT_MINISTRIES.length) {
      return existing.map(mapMinistry);
    }

    const results: MinistryEntity[] = [];

    for (let i = 0; i < DEFAULT_MINISTRIES.length; i++) {
      const def = DEFAULT_MINISTRIES[i]!;
      const ministry = await prisma.ministry.upsert({
        where: {
          organizationId_slug: { organizationId, slug: def.slug },
        },
        create: {
          organizationId,
          name: def.name,
          slug: def.slug,
          description: def.description,
          color: def.color,
          isDefault: true,
          sortOrder: i,
        },
        update: {
          name: def.name,
          description: def.description,
          color: def.color,
          isDefault: true,
          sortOrder: i,
        },
        include: { _count: { select: { roles: true, preferences: true } } },
      });

      for (let r = 0; r < def.roles.length; r++) {
        const roleName = def.roles[r]!;
        const existingRole = await prisma.ministryRole.findFirst({
          where: { organizationId, ministryId: ministry.id, name: roleName },
        });
        if (!existingRole) {
          await prisma.ministryRole.create({
            data: {
              organizationId,
              ministryId: ministry.id,
              name: roleName,
              sortOrder: r,
            },
          });
        }
      }

      results.push(mapMinistry(ministry));
    }

    return results;
  },

  async listMinistries(organizationId) {
    const rows = await prisma.ministry.findMany({
      where: { organizationId },
      include: { _count: { select: { roles: true, preferences: true } } },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
    return rows.map(mapMinistry);
  },

  async createMinistry(input) {
    const row = await prisma.ministry.create({
      data: {
        organizationId: input.organizationId,
        name: input.name,
        slug: input.slug,
        description: input.description ?? null,
        color: input.color ?? "#0d9488",
        icon: input.icon ?? null,
        leaderMemberId: input.leaderMemberId ?? null,
        sortOrder: input.sortOrder ?? 0,
      },
      include: { _count: { select: { roles: true, preferences: true } } },
    });
    return mapMinistry(row);
  },

  async updateMinistry(input) {
    const existing = await prisma.ministry.findFirst({
      where: { id: input.ministryId, organizationId: input.organizationId },
    });
    if (!existing) throw notFound("Ministry not found");

    const row = await prisma.ministry.update({
      where: { id: input.ministryId },
      data: {
        name: input.name,
        description: input.description,
        color: input.color,
        icon: input.icon,
        status: input.status as PrismaMinistryStatus | undefined,
        leaderMemberId: input.leaderMemberId,
        sortOrder: input.sortOrder,
      },
      include: { _count: { select: { roles: true, preferences: true } } },
    });
    return mapMinistry(row);
  },

  async listRoles(organizationId, ministryId) {
    const rows = await prisma.ministryRole.findMany({
      where: { organizationId, ministryId },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
    return rows.map(mapRole);
  },

  async createRole(input) {
    const row = await prisma.ministryRole.create({
      data: {
        organizationId: input.organizationId,
        ministryId: input.ministryId,
        name: input.name,
        description: input.description ?? null,
        slotsNeeded: input.slotsNeeded ?? 1,
        sortOrder: input.sortOrder ?? 0,
      },
    });
    return mapRole(row);
  },

  async updateRole(input) {
    const existing = await prisma.ministryRole.findFirst({
      where: { id: input.roleId, organizationId: input.organizationId },
    });
    if (!existing) throw notFound("Ministry role not found");

    const row = await prisma.ministryRole.update({
      where: { id: input.roleId },
      data: {
        name: input.name,
        description: input.description,
        slotsNeeded: input.slotsNeeded,
        sortOrder: input.sortOrder,
      },
    });
    return mapRole(row);
  },

  async listVolunteers(query) {
    const where: Prisma.VolunteerProfileWhereInput = {
      organizationId: query.organizationId,
      isActive: query.isActive,
    };

    if (query.ministryId) {
      where.preferences = { some: { ministryId: query.ministryId } };
    }

    if (query.query?.trim()) {
      const q = query.query.trim();
      where.member = {
        OR: [
          { firstName: { contains: q, mode: "insensitive" } },
          { lastName: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
        ],
      };
    }

    const rows = await prisma.volunteerProfile.findMany({
      where,
      include: {
        ...PROFILE_INCLUDE,
        assignments: {
          where: {
            status: { in: ACTIVE_ASSIGNMENT_STATUSES },
            slot: { startsAt: { gte: new Date() } },
          },
        },
      },
      orderBy: { member: { lastName: "asc" } },
      take: query.limit ?? 100,
    });

    return rows.map((row) => {
      const profile = mapProfile(row);
      const primaryPref = profile.preferences.sort(
        (a, b) => a.priority - b.priority
      )[0];
      return {
        ...profile,
        displayName: displayName(
          profile.member.firstName,
          profile.member.lastName
        ),
        primaryMinistry: primaryPref?.ministryName ?? null,
        upcomingAssignmentCount: row.assignments.length,
      };
    });
  },

  async getVolunteerProfile(organizationId, volunteerId) {
    const row = await prisma.volunteerProfile.findFirst({
      where: { id: volunteerId, organizationId },
      include: PROFILE_INCLUDE,
    });
    return row ? mapProfile(row) : null;
  },

  async getVolunteerProfileByMember(organizationId, memberId) {
    const row = await prisma.volunteerProfile.findFirst({
      where: { memberId, organizationId },
      include: PROFILE_INCLUDE,
    });
    return row ? mapProfile(row) : null;
  },

  async upsertVolunteerProfile(input) {
    const member = await prisma.member.findFirst({
      where: {
        id: input.memberId,
        organizationId: input.organizationId,
        deletedAt: null,
      },
    });
    if (!member) throw notFound("Member not found");

    const existing = await prisma.volunteerProfile.findUnique({
      where: { memberId: input.memberId },
    });

    const profile = existing
      ? await prisma.volunteerProfile.update({
          where: { id: existing.id },
          data: {
            experienceYears: input.experienceYears,
            trainingStatus: input.trainingStatus as PrismaTrainingStatus | undefined,
            preferredService: input.preferredService,
            emergencyName: input.emergencyName,
            emergencyPhone: input.emergencyPhone,
            notes: input.notes,
            reliabilityScore: input.reliabilityScore,
            isActive: input.isActive,
          },
          include: PROFILE_INCLUDE,
        })
      : await prisma.volunteerProfile.create({
          data: {
            organizationId: input.organizationId,
            memberId: input.memberId,
            experienceYears: input.experienceYears ?? null,
            trainingStatus:
              (input.trainingStatus as PrismaTrainingStatus) ?? "NOT_STARTED",
            preferredService: input.preferredService ?? null,
            emergencyName: input.emergencyName ?? null,
            emergencyPhone: input.emergencyPhone ?? null,
            notes: input.notes ?? null,
            reliabilityScore: input.reliabilityScore ?? 80,
            isActive: input.isActive ?? true,
          },
          include: PROFILE_INCLUDE,
        });

    if (input.skills) {
      await prisma.volunteerSkill.deleteMany({ where: { volunteerId: profile.id } });
      if (input.skills.length > 0) {
        await prisma.volunteerSkill.createMany({
          data: input.skills.map((s) => ({
            organizationId: input.organizationId,
            volunteerId: profile.id,
            name: s.name,
            level: s.level ?? null,
          })),
        });
      }
    }

    if (input.certifications) {
      await prisma.volunteerCertification.deleteMany({
        where: { volunteerId: profile.id },
      });
      if (input.certifications.length > 0) {
        await prisma.volunteerCertification.createMany({
          data: input.certifications.map((c) => ({
            organizationId: input.organizationId,
            volunteerId: profile.id,
            name: c.name,
            issuer: c.issuer ?? null,
            issuedAt: c.issuedAt ?? null,
            expiresAt: c.expiresAt ?? null,
          })),
        });
      }
    }

    if (input.availabilities) {
      await prisma.volunteerAvailability.deleteMany({
        where: { volunteerId: profile.id },
      });
      if (input.availabilities.length > 0) {
        await prisma.volunteerAvailability.createMany({
          data: input.availabilities.map((a) => ({
            organizationId: input.organizationId,
            volunteerId: profile.id,
            weekday: a.weekday as PrismaWeekday,
            startTime: a.startTime,
            endTime: a.endTime,
            notes: a.notes ?? null,
          })),
        });
      }
    }

    if (input.ministryPreferences) {
      await prisma.volunteerMinistryPreference.deleteMany({
        where: { volunteerId: profile.id },
      });
      if (input.ministryPreferences.length > 0) {
        await prisma.volunteerMinistryPreference.createMany({
          data: input.ministryPreferences.map((p) => ({
            organizationId: input.organizationId,
            volunteerId: profile.id,
            ministryId: p.ministryId,
            priority: p.priority ?? 1,
          })),
        });
      }
    }

    const refreshed = await prisma.volunteerProfile.findUniqueOrThrow({
      where: { id: profile.id },
      include: PROFILE_INCLUDE,
    });

    await logVolunteerActivity({
      organizationId: input.organizationId,
      volunteerId: refreshed.id,
      type: existing ? VolunteerActivityType.UPDATED : VolunteerActivityType.CREATED,
      title: existing ? "Volunteer profile updated" : "Volunteer profile created",
      description: displayName(member.firstName, member.lastName),
      actorUserId: input.actorUserId,
    });

    return mapProfile(refreshed);
  },

  async listScheduleEvents(query) {
    const where: Prisma.ScheduleEventWhereInput = {
      organizationId: query.organizationId,
    };

    if (query.from || query.to) {
      where.startsAt = {};
      if (query.from) where.startsAt.gte = query.from;
      if (query.to) where.startsAt.lte = query.to;
    }
    if (query.ministryId) where.ministryId = query.ministryId;
    if (query.eventType) where.eventType = query.eventType as PrismaScheduleEventType;

    const rows = await prisma.scheduleEvent.findMany({
      where,
      include: {
        ministry: { select: { name: true } },
        slots: {
          include: {
            assignments: { select: { status: true } },
          },
        },
      },
      orderBy: { startsAt: "asc" },
      take: query.limit ?? 50,
    });

    return rows.map(mapEvent);
  },

  async createScheduleEvent(input) {
    const event = await prisma.scheduleEvent.create({
      data: {
        organizationId: input.organizationId,
        ministryId: input.ministryId ?? null,
        title: input.title,
        eventType: (input.eventType ?? "SUNDAY_SERVICE") as PrismaScheduleEventType,
        campus: input.campus ?? null,
        startsAt: input.startsAt,
        endsAt: input.endsAt ?? null,
        location: input.location ?? null,
        notes: input.notes ?? null,
        slots: {
          create: input.slots.map((slot, index) => ({
            organizationId: input.organizationId,
            roleId: slot.roleId ?? null,
            title: slot.title,
            needed: slot.needed ?? 1,
            startsAt: slot.startsAt,
            endsAt: slot.endsAt ?? null,
            sortOrder: slot.sortOrder ?? index,
          })),
        },
      },
      include: {
        ministry: { select: { name: true } },
        slots: {
          include: {
            assignments: { select: { status: true } },
          },
        },
      },
    });

    return mapEvent(event);
  },

  async getSchedulerBoard(input) {
    let event;

    if (input.eventId) {
      event = await prisma.scheduleEvent.findFirst({
        where: { id: input.eventId, organizationId: input.organizationId },
        include: {
          ministry: { select: { name: true } },
          slots: {
            include: {
              role: { select: { name: true } },
              assignments: {
                include: {
                  volunteer: { include: { member: { select: MEMBER_SELECT } } },
                },
              },
            },
            orderBy: { sortOrder: "asc" },
          },
        },
      });
    } else if (input.date) {
      const dayStart = startOfDay(input.date);
      const dayEnd = endOfDay(input.date);
      event = await prisma.scheduleEvent.findFirst({
        where: {
          organizationId: input.organizationId,
          startsAt: { gte: dayStart, lte: dayEnd },
        },
        include: {
          ministry: { select: { name: true } },
          slots: {
            include: {
              role: { select: { name: true } },
              assignments: {
                include: {
                  volunteer: { include: { member: { select: MEMBER_SELECT } } },
                },
              },
            },
            orderBy: { sortOrder: "asc" },
          },
        },
        orderBy: { startsAt: "asc" },
      });
    }

    if (!event) return null;

    const ministryId = event.ministryId;
    const eventDate = event.startsAt;

    const volunteerWhere: Prisma.VolunteerProfileWhereInput = {
      organizationId: input.organizationId,
      isActive: true,
    };

    if (ministryId) {
      volunteerWhere.preferences = { some: { ministryId } };
    }

    const volunteers = await prisma.volunteerProfile.findMany({
      where: volunteerWhere,
      include: {
        ...PROFILE_INCLUDE,
        assignments: {
          where: {
            status: { in: ACTIVE_ASSIGNMENT_STATUSES },
            slot: { startsAt: { gte: startOfDay(eventDate), lte: endOfDay(eventDate) } },
          },
        },
      },
    });

    const assignedVolunteerIds = new Set(
      event.slots.flatMap((s) => s.assignments.map((a) => a.volunteerId))
    );

    const availableVolunteers: VolunteerListItem[] = volunteers
      .filter((v) => {
        if (assignedVolunteerIds.has(v.id)) return false;
        if (v.assignments.length > 0) return false;
        return volunteerAvailableOnDate(
          v.availabilities.map((a) => ({
            weekday: a.weekday as Weekday,
            startTime: a.startTime,
            endTime: a.endTime,
          })),
          eventDate
        );
      })
      .map((row) => {
        const profile = mapProfile(row);
        const primaryPref = profile.preferences.sort(
          (a, b) => a.priority - b.priority
        )[0];
        return {
          ...profile,
          displayName: displayName(
            profile.member.firstName,
            profile.member.lastName
          ),
          primaryMinistry: primaryPref?.ministryName ?? null,
          upcomingAssignmentCount: row.assignments.length,
        };
      });

    const allConflicts: ConflictInfo[] = [];

    const slots = event.slots.map((slot) => {
      const assignments = slot.assignments.map((a) =>
        mapAssignment({
          ...a,
          slot: {
            id: slot.id,
            title: slot.title,
            startsAt: slot.startsAt,
            endsAt: slot.endsAt,
            event: { id: event!.id, title: event!.title, startsAt: event!.startsAt },
          },
        })
      );

      const activeCount = assignments.filter(
        (a) =>
          a.status === ScheduleAssignmentStatus.ASSIGNED ||
          a.status === ScheduleAssignmentStatus.CONFIRMED
      ).length;

      return {
        ...mapSlot({ ...slot, assignments: slot.assignments }),
        assignments,
        openSpots: Math.max(0, slot.needed - activeCount),
      };
    });

    const board: SchedulerBoard = {
      event: mapEvent(event),
      slots,
      availableVolunteers,
      conflicts: allConflicts,
    };

    return board;
  },

  async assignVolunteer(input) {
    const slot = await prisma.scheduleSlot.findFirst({
      where: { id: input.slotId, organizationId: input.organizationId },
      include: { event: true },
    });
    if (!slot) throw notFound("Schedule slot not found");

    const volunteer = await prisma.volunteerProfile.findFirst({
      where: { id: input.volunteerId, organizationId: input.organizationId },
      include: { member: { select: MEMBER_SELECT } },
    });
    if (!volunteer) throw notFound("Volunteer not found");

    const existing = await prisma.scheduleAssignment.findUnique({
      where: {
        slotId_volunteerId: {
          slotId: input.slotId,
          volunteerId: input.volunteerId,
        },
      },
    });
    if (existing) {
      throw conflict("Volunteer is already assigned to this slot");
    }

    const conflicts = await findAssignmentConflicts(
      input.organizationId,
      input.volunteerId,
      slot.startsAt,
      slot.endsAt,
      input.slotId
    );

    const assignment = await prisma.scheduleAssignment.create({
      data: {
        organizationId: input.organizationId,
        slotId: input.slotId,
        volunteerId: input.volunteerId,
        notes: input.notes ?? null,
        status: "ASSIGNED",
      },
      include: {
        volunteer: { include: { member: { select: MEMBER_SELECT } } },
        slot: {
          include: { event: { select: { id: true, title: true, startsAt: true } } },
        },
      },
    });

    await logVolunteerActivity({
      organizationId: input.organizationId,
      volunteerId: input.volunteerId,
      type: VolunteerActivityType.ASSIGNED,
      title: "Assigned to schedule slot",
      description: `${slot.title} — ${slot.event.title}`,
      actorUserId: input.actorUserId,
      metadata: {
        slotId: slot.id,
        eventId: slot.eventId,
        conflicts: conflicts.length,
      },
    });

    return {
      assignment: mapAssignment(assignment),
      conflicts,
    };
  },

  async updateAssignmentStatus(input) {
    const existing = await prisma.scheduleAssignment.findFirst({
      where: { id: input.assignmentId, organizationId: input.organizationId },
      include: {
        slot: { include: { event: true } },
        volunteer: { include: { member: { select: MEMBER_SELECT } } },
      },
    });
    if (!existing) throw notFound("Assignment not found");

    const row = await prisma.scheduleAssignment.update({
      where: { id: input.assignmentId },
      data: {
        status: input.status as PrismaScheduleAssignmentStatus,
        respondedAt: new Date(),
      },
      include: {
        volunteer: { include: { member: { select: MEMBER_SELECT } } },
        slot: {
          include: { event: { select: { id: true, title: true, startsAt: true } } },
        },
      },
    });

    const activityType =
      input.status === ScheduleAssignmentStatus.CONFIRMED
        ? VolunteerActivityType.CONFIRMED
        : input.status === ScheduleAssignmentStatus.DECLINED
          ? VolunteerActivityType.DECLINED
          : VolunteerActivityType.UPDATED;

    await logVolunteerActivity({
      organizationId: input.organizationId,
      volunteerId: existing.volunteerId,
      type: activityType,
      title: `Assignment ${input.status.toLowerCase()}`,
      description: `${existing.slot.title} — ${existing.slot.event.title}`,
      actorUserId: input.actorUserId,
    });

    return mapAssignment(row);
  },

  async createSwapRequest(input) {
    const fromAssignment = await prisma.scheduleAssignment.findFirst({
      where: { id: input.fromAssignmentId, organizationId: input.organizationId },
      include: {
        slot: { select: { eventId: true } },
        volunteer: { include: { member: { select: MEMBER_SELECT } } },
      },
    });
    if (!fromAssignment) throw notFound("Assignment not found");

    let toAssignmentId: string | null = null;
    const toVolunteerId: string | null = input.toVolunteerId ?? null;

    if (input.toVolunteerId) {
      const toAssignment = await prisma.scheduleAssignment.findFirst({
        where: {
          organizationId: input.organizationId,
          volunteerId: input.toVolunteerId,
          slot: { eventId: fromAssignment.slot.eventId },
        },
      });
      toAssignmentId = toAssignment?.id ?? null;
    }

    const swap = await prisma.scheduleSwapRequest.create({
      data: {
        organizationId: input.organizationId,
        fromAssignmentId: input.fromAssignmentId,
        toAssignmentId,
        fromVolunteerId: fromAssignment.volunteerId,
        toVolunteerId,
        message: input.message ?? null,
        status: "PENDING",
      },
      include: {
        fromVolunteer: { include: { member: { select: MEMBER_SELECT } } },
        toVolunteer: { include: { member: { select: MEMBER_SELECT } } },
      },
    });

    await logVolunteerActivity({
      organizationId: input.organizationId,
      volunteerId: fromAssignment.volunteerId,
      type: VolunteerActivityType.SWAP_REQUESTED,
      title: "Swap request created",
      description: input.message ?? undefined,
      actorUserId: input.actorUserId,
    });

    return mapSwap(swap);
  },

  async resolveSwapRequest(input) {
    const swap = await prisma.scheduleSwapRequest.findFirst({
      where: { id: input.swapRequestId, organizationId: input.organizationId },
      include: {
        fromAssignment: true,
        fromVolunteer: { include: { member: { select: MEMBER_SELECT } } },
        toVolunteer: { include: { member: { select: MEMBER_SELECT } } },
      },
    });
    if (!swap) throw notFound("Swap request not found");
    if (swap.status !== "PENDING") {
      throw conflict("Swap request is no longer pending");
    }

    if (input.accept && swap.toVolunteerId) {
      await prisma.$transaction([
        prisma.scheduleAssignment.update({
          where: { id: swap.fromAssignmentId },
          data: { volunteerId: swap.toVolunteerId },
        }),
        ...(swap.toAssignmentId
          ? [
              prisma.scheduleAssignment.update({
                where: { id: swap.toAssignmentId },
                data: { volunteerId: swap.fromVolunteerId },
              }),
            ]
          : []),
      ]);
    }

    const updated = await prisma.scheduleSwapRequest.update({
      where: { id: swap.id },
      data: {
        status: (input.accept ? "ACCEPTED" : "DECLINED") as PrismaSwapRequestStatus,
        resolvedAt: new Date(),
      },
      include: {
        fromVolunteer: { include: { member: { select: MEMBER_SELECT } } },
        toVolunteer: { include: { member: { select: MEMBER_SELECT } } },
      },
    });

    await logVolunteerActivity({
      organizationId: input.organizationId,
      volunteerId: swap.fromVolunteerId,
      type: input.accept
        ? VolunteerActivityType.SWAP_ACCEPTED
        : VolunteerActivityType.DECLINED,
      title: input.accept ? "Swap accepted" : "Swap declined",
      actorUserId: input.actorUserId,
    });

    return mapSwap(updated);
  },

  async checkInVolunteer(input) {
    const volunteer = await prisma.volunteerProfile.findFirst({
      where: { id: input.volunteerId, organizationId: input.organizationId },
      include: { member: { select: MEMBER_SELECT } },
    });
    if (!volunteer) throw notFound("Volunteer not found");

    if (input.assignmentId) {
      const assignment = await prisma.scheduleAssignment.findFirst({
        where: {
          id: input.assignmentId,
          organizationId: input.organizationId,
          volunteerId: input.volunteerId,
        },
      });
      if (!assignment) throw notFound("Assignment not found");
    }

    const checkIn = await prisma.volunteerCheckIn.create({
      data: {
        organizationId: input.organizationId,
        volunteerId: input.volunteerId,
        assignmentId: input.assignmentId ?? null,
        status: input.status as PrismaVolunteerCheckInStatus,
        notes: input.notes ?? null,
      },
      include: {
        volunteer: { include: { member: { select: MEMBER_SELECT } } },
      },
    });

    await logVolunteerActivity({
      organizationId: input.organizationId,
      volunteerId: input.volunteerId,
      type: VolunteerActivityType.CHECKED_IN,
      title: `Check-in: ${input.status}`,
      actorUserId: input.actorUserId,
      metadata: { assignmentId: input.assignmentId, status: input.status },
    });

    return mapCheckIn(checkIn);
  },

  async sendMessage(input) {
    const message = await prisma.volunteerMessage.create({
      data: {
        organizationId: input.organizationId,
        volunteerId: input.volunteerId ?? null,
        ministryId: input.ministryId ?? null,
        channel: input.channel as PrismaVolunteerMessageChannel,
        subject: input.subject ?? null,
        body: input.body,
        actorUserId: input.actorUserId ?? null,
        metadata: DEFAULT_MESSAGE_METADATA as Prisma.InputJsonValue,
      },
    });

    if (input.volunteerId) {
      await logVolunteerActivity({
        organizationId: input.organizationId,
        volunteerId: input.volunteerId,
        type: VolunteerActivityType.MESSAGE_SENT,
        title: "Message sent",
        description: input.subject ?? input.body.slice(0, 80),
        actorUserId: input.actorUserId,
        metadata: { channel: input.channel },
      });
    }

    return mapMessage(message);
  },

  async getAnalytics(organizationId) {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const prevMonthEnd = endOfMonth(subMonths(now, 1));

    const [
      totalVolunteers,
      activeVolunteers,
      hoursAgg,
      reliabilityAgg,
      assignmentsThisMonth,
      confirmedThisMonth,
      declinedThisMonth,
      checkInsThisMonth,
      expectedCheckIns,
      ministries,
      recentActivities,
    ] = await Promise.all([
      prisma.volunteerProfile.count({ where: { organizationId } }),
      prisma.volunteerProfile.count({
        where: { organizationId, isActive: true },
      }),
      prisma.volunteerProfile.aggregate({
        where: { organizationId },
        _sum: { totalHours: true },
      }),
      prisma.volunteerProfile.aggregate({
        where: { organizationId, isActive: true },
        _avg: { reliabilityScore: true },
      }),
      prisma.scheduleAssignment.count({
        where: {
          organizationId,
          assignedAt: { gte: monthStart, lte: monthEnd },
        },
      }),
      prisma.scheduleAssignment.count({
        where: {
          organizationId,
          status: "CONFIRMED",
          assignedAt: { gte: monthStart, lte: monthEnd },
        },
      }),
      prisma.scheduleAssignment.count({
        where: {
          organizationId,
          status: "DECLINED",
          assignedAt: { gte: monthStart, lte: monthEnd },
        },
      }),
      prisma.volunteerCheckIn.count({
        where: {
          organizationId,
          checkedInAt: { gte: monthStart, lte: monthEnd },
          status: { in: ["CHECKED_IN", "LATE"] },
        },
      }),
      prisma.scheduleAssignment.count({
        where: {
          organizationId,
          status: { in: ["CONFIRMED", "COMPLETED"] },
          slot: { startsAt: { gte: monthStart, lte: monthEnd } },
        },
      }),
      prisma.ministry.findMany({
        where: { organizationId, status: "ACTIVE" },
        include: {
          events: {
            where: { startsAt: { gte: monthStart, lte: monthEnd } },
            include: {
              slots: {
                include: {
                  assignments: {
                    where: { status: { in: ACTIVE_ASSIGNMENT_STATUSES } },
                  },
                },
              },
            },
          },
          preferences: true,
        },
      }),
      prisma.volunteerActivity.findMany({
        where: { organizationId },
        orderBy: { occurredAt: "desc" },
        take: 10,
      }),
    ]);

    let totalNeeded = 0;
    let totalFilled = 0;
    const coverageByMinistry = ministries.map((m) => {
      let needed = 0;
      let filled = 0;
      for (const event of m.events) {
        for (const slot of event.slots) {
          needed += slot.needed;
          filled += slot.assignments.length;
        }
      }
      totalNeeded += needed;
      totalFilled += filled;
      return {
        ministryId: m.id,
        ministryName: m.name,
        needed,
        filled,
        coveragePercent: needed > 0 ? Math.round((filled / needed) * 100) : 100,
      };
    });

    const ministryGrowth = await Promise.all(
      ministries.map(async (m) => {
        const currentCount = await prisma.volunteerMinistryPreference.count({
          where: { organizationId, ministryId: m.id },
        });
        const previousCount = await prisma.volunteerMinistryPreference.count({
          where: {
            organizationId,
            ministryId: m.id,
            createdAt: { lte: prevMonthEnd },
          },
        });
        const growthPercent =
          previousCount > 0
            ? Math.round(((currentCount - previousCount) / previousCount) * 100)
            : currentCount > 0
              ? 100
              : 0;
        return {
          ministryId: m.id,
          ministryName: m.name,
          volunteerCount: currentCount,
          previousCount,
          growthPercent,
        };
      })
    );

    const analytics: MinistryAnalytics = {
      totalVolunteers,
      activeVolunteers,
      totalHours: hoursAgg._sum.totalHours ?? 0,
      averageReliability: Math.round(reliabilityAgg._avg.reliabilityScore ?? 0),
      checkInRate:
        expectedCheckIns > 0
          ? Math.round((checkInsThisMonth / expectedCheckIns) * 100)
          : 0,
      coveragePercent:
        totalNeeded > 0 ? Math.round((totalFilled / totalNeeded) * 100) : 100,
      coverageByMinistry,
      assignmentsThisMonth,
      confirmedThisMonth,
      declinedThisMonth,
      ministryGrowth,
      recentActivity: recentActivities.map(mapActivity),
    };

    return analytics;
  },
};

export type { MinistryRepository };
