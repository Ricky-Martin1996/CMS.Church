import type {
  HouseholdActivityEntity,
  HouseholdDocumentEntity,
  HouseholdEntity,
  HouseholdFilterDefinition,
  HouseholdListColumn,
  HouseholdListItem,
  HouseholdMembershipEntity,
  HouseholdNoteEntity,
  HouseholdProfile,
} from "@/domain/entities/household";
import type {
  DocumentType,
  FamilyRelation,
  HouseholdStatus,
  NoteVisibility,
} from "@/domain/enums/member";
import { prisma } from "@/infrastructure/db/prisma";
import { memberDisplayName } from "@/infrastructure/repositories/member-mappers";
import type {
  DocumentType as PrismaDocumentType,
  FamilyRelation as PrismaFamilyRelation,
  HouseholdStatus as PrismaHouseholdStatus,
  NoteVisibility as PrismaNoteVisibility,
  Prisma,
} from "@prisma/client";
import { format, startOfMonth, subDays, subMonths } from "date-fns";
import { randomUUID } from "crypto";
import type {
  CreateHouseholdInput,
  HouseholdAnalyticsBuilder,
  HouseholdRepository,
  ListHouseholdsQuery,
  UpdateHouseholdInput,
} from "@/application/ports/household-repositories";

const MEMBER_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  avatarUrl: true,
  email: true,
  phone: true,
  status: true,
  engagementScore: true,
} as const;

const MEMBERSHIP_INCLUDE = {
  member: { select: MEMBER_SELECT },
} as const;

export function generateHouseholdCode(id?: string): string {
  const slice = (id ?? randomUUID().replace(/-/g, ""))
    .replace(/-/g, "")
    .slice(0, 8)
    .toUpperCase();
  return `HH-${slice}`;
}

function parseMetadata(
  value: Prisma.JsonValue | null
): Record<string, unknown> | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export function mapHouseholdEntity(household: {
  id: string;
  organizationId: string;
  familyName: string;
  householdCode: string;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  geoLatitude: number | null;
  geoLongitude: number | null;
  preferredLanguage: string | null;
  anniversaryDate: Date | null;
  emergencyContact: string | null;
  emergencyPhone: string | null;
  photoUrl: string | null;
  notes: string | null;
  status: string;
  cellGroup: string | null;
  assignedCellLeaderId: string | null;
  engagementScore: number;
  qrToken: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}): HouseholdEntity {
  return {
    id: household.id,
    organizationId: household.organizationId,
    familyName: household.familyName,
    householdCode: household.householdCode,
    addressLine1: household.addressLine1,
    addressLine2: household.addressLine2,
    city: household.city,
    state: household.state,
    postalCode: household.postalCode,
    country: household.country,
    geoLatitude: household.geoLatitude,
    geoLongitude: household.geoLongitude,
    preferredLanguage: household.preferredLanguage,
    anniversaryDate: household.anniversaryDate,
    emergencyContact: household.emergencyContact,
    emergencyPhone: household.emergencyPhone,
    photoUrl: household.photoUrl,
    notes: household.notes,
    status: household.status as HouseholdStatus,
    cellGroup: household.cellGroup,
    assignedCellLeaderId: household.assignedCellLeaderId,
    engagementScore: household.engagementScore,
    qrToken: household.qrToken,
    createdAt: household.createdAt,
    updatedAt: household.updatedAt,
    deletedAt: household.deletedAt,
  };
}

export function mapHouseholdMembership(
  membership: {
    id: string;
    householdId: string;
    memberId: string;
    relation: string;
    isPrimary: boolean;
    createdAt: Date;
    updatedAt: Date;
    member?: {
      id: string;
      firstName: string;
      lastName: string;
      avatarUrl: string | null;
      email: string | null;
      phone: string | null;
      status: string;
      engagementScore: number;
    };
  }
): HouseholdMembershipEntity {
  return {
    id: membership.id,
    householdId: membership.householdId,
    memberId: membership.memberId,
    relation: membership.relation as FamilyRelation,
    isPrimary: membership.isPrimary,
    createdAt: membership.createdAt,
    updatedAt: membership.updatedAt,
    member: membership.member,
  };
}

export function mapHouseholdActivity(activity: {
  id: string;
  organizationId: string;
  householdId: string;
  type: string;
  title: string;
  description: string | null;
  metadata: Prisma.JsonValue | null;
  actorUserId: string | null;
  occurredAt: Date;
}): HouseholdActivityEntity {
  return {
    id: activity.id,
    organizationId: activity.organizationId,
    householdId: activity.householdId,
    type: activity.type as HouseholdActivityEntity["type"],
    title: activity.title,
    description: activity.description,
    metadata: parseMetadata(activity.metadata),
    actorUserId: activity.actorUserId,
    occurredAt: activity.occurredAt,
  };
}

export function mapHouseholdNote(note: {
  id: string;
  organizationId: string;
  householdId: string;
  authorUserId: string;
  visibility: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
}): HouseholdNoteEntity {
  return {
    id: note.id,
    organizationId: note.organizationId,
    householdId: note.householdId,
    authorUserId: note.authorUserId,
    visibility: note.visibility as NoteVisibility,
    body: note.body,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
  };
}

export function mapHouseholdDocument(document: {
  id: string;
  organizationId: string;
  householdId: string;
  type: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  storageKey: string;
  url: string | null;
  createdAt: Date;
}): HouseholdDocumentEntity {
  return {
    id: document.id,
    organizationId: document.organizationId,
    householdId: document.householdId,
    type: document.type as DocumentType,
    name: document.name,
    mimeType: document.mimeType,
    sizeBytes: document.sizeBytes,
    storageKey: document.storageKey,
    url: document.url,
    createdAt: document.createdAt,
  };
}

function resolveHead(
  memberships: Array<{
    relation: string;
    isPrimary: boolean;
    member?: { firstName: string; lastName: string; avatarUrl: string | null } | null;
  }>
): { headName: string | null; headAvatar: string | null } {
  const head =
    memberships.find((m) => m.relation === "HEAD" || m.isPrimary) ??
    memberships[0];
  if (!head?.member) return { headName: null, headAvatar: null };
  return {
    headName: memberDisplayName(head.member.firstName, head.member.lastName),
    headAvatar: head.member.avatarUrl,
  };
}

function toListItem(
  household: Parameters<typeof mapHouseholdEntity>[0] & {
    memberships?: Array<{
      relation: string;
      isPrimary: boolean;
      member?: { firstName: string; lastName: string; avatarUrl: string | null } | null;
    }>;
    _count?: { memberships: number };
  }
): HouseholdListItem {
  const memberships = household.memberships ?? [];
  const memberCount = household._count?.memberships ?? memberships.length;
  const { headName, headAvatar } = resolveHead(memberships);
  return {
    ...mapHouseholdEntity(household),
    memberCount,
    headName,
    headAvatar,
  };
}

function buildHouseholdWhere(
  organizationId: string,
  filter?: HouseholdFilterDefinition
): Prisma.HouseholdWhereInput {
  const where: Prisma.HouseholdWhereInput = {
    organizationId,
    deletedAt: null,
  };

  if (!filter) return where;

  if (filter.query) {
    const q = filter.query.trim();
    if (q) {
      where.OR = [
        { familyName: { contains: q, mode: "insensitive" } },
        { householdCode: { contains: q, mode: "insensitive" } },
        { city: { contains: q, mode: "insensitive" } },
        { cellGroup: { contains: q, mode: "insensitive" } },
      ];
    }
  }

  if (filter.statuses?.length) {
    where.status = { in: filter.statuses as PrismaHouseholdStatus[] };
  }

  if (filter.cellGroup) {
    where.cellGroup = filter.cellGroup;
  }

  if (filter.assignedCellLeaderId !== undefined) {
    where.assignedCellLeaderId = filter.assignedCellLeaderId;
  }

  if (filter.minEngagement !== undefined) {
    where.engagementScore = { gte: filter.minEngagement };
  }

  if (filter.hasAddress === true) {
    where.addressLine1 = { not: null };
  } else if (filter.hasAddress === false) {
    where.addressLine1 = null;
  }

  return where;
}

function lastSixMonthKeys(): string[] {
  const now = new Date();
  const keys: string[] = [];
  for (let i = 5; i >= 0; i -= 1) {
    keys.push(format(startOfMonth(subMonths(now, i)), "yyyy-MM"));
  }
  return keys;
}

export const householdAnalyticsBuilder: HouseholdAnalyticsBuilder = {
  async build(organizationId, memberIds, engagementScore) {
    const monthKeys = lastSixMonthKeys();
    const sixMonthsAgo = startOfMonth(subMonths(new Date(), 5));
    const ninetyDaysAgo = subDays(new Date(), 90);

    if (memberIds.length === 0) {
      return {
        attendanceTrend: monthKeys.map((month) => ({ month, count: 0 })),
        givingTrend: monthKeys.map((month) => ({ month, amountCents: 0 })),
        engagementScore,
        volunteerCount: 0,
        openPrayers: 0,
        memberCount: 0,
        growthTimeline: monthKeys.map((month) => ({ month, memberCount: 0 })),
      };
    }

    const memberFilter = { organizationId, memberId: { in: memberIds } };

    const [
      attendanceRecords,
      givingRecords,
      openPrayers,
      volunteerCount,
      membershipsByMonth,
    ] = await Promise.all([
      prisma.attendanceRecord.findMany({
        where: { ...memberFilter, attendedAt: { gte: sixMonthsAgo } },
        select: { attendedAt: true },
      }),
      prisma.givingRecord.findMany({
        where: { ...memberFilter, givenAt: { gte: sixMonthsAgo } },
        select: { givenAt: true, amountCents: true },
      }),
      prisma.prayerRequest.count({
        where: {
          ...memberFilter,
          status: { in: ["OPEN", "PRAYING"] },
        },
      }),
      prisma.volunteerAssignment.count({
        where: {
          ...memberFilter,
          status: "ACTIVE",
          startedAt: { gte: ninetyDaysAgo },
        },
      }),
      prisma.householdMembership.findMany({
        where: { memberId: { in: memberIds } },
        select: { createdAt: true },
      }),
    ]);

    const attendanceByMonth = new Map(monthKeys.map((k) => [k, 0]));
    for (const record of attendanceRecords) {
      const key = format(startOfMonth(record.attendedAt), "yyyy-MM");
      if (attendanceByMonth.has(key)) {
        attendanceByMonth.set(key, (attendanceByMonth.get(key) ?? 0) + 1);
      }
    }

    const givingByMonth = new Map(monthKeys.map((k) => [k, 0]));
    for (const record of givingRecords) {
      const key = format(startOfMonth(record.givenAt), "yyyy-MM");
      if (givingByMonth.has(key)) {
        givingByMonth.set(key, (givingByMonth.get(key) ?? 0) + record.amountCents);
      }
    }

    const growthTimeline = monthKeys.map((month) => {
      const monthEnd = startOfMonth(
        new Date(`${month}-01T00:00:00.000Z`)
      );
      const count = membershipsByMonth.filter(
        (m) => m.createdAt <= monthEnd
      ).length;
      return { month, memberCount: count };
    });

    return {
      attendanceTrend: monthKeys.map((month) => ({
        month,
        count: attendanceByMonth.get(month) ?? 0,
      })),
      givingTrend: monthKeys.map((month) => ({
        month,
        amountCents: givingByMonth.get(month) ?? 0,
      })),
      engagementScore,
      volunteerCount,
      openPrayers,
      memberCount: memberIds.length,
      growthTimeline,
    };
  },
};

function buildOrderBy(
  sort: ListHouseholdsQuery["sort"] = "familyName",
  sortDir: ListHouseholdsQuery["sortDir"] = "asc"
): Prisma.HouseholdOrderByWithRelationInput[] {
  const dir = sortDir ?? "asc";
  switch (sort) {
    case "engagement":
      return [{ engagementScore: dir }, { id: dir }];
    case "updatedAt":
      return [{ updatedAt: dir }, { id: dir }];
    case "memberCount":
      return [{ memberships: { _count: dir } }, { id: dir }];
    case "familyName":
    default:
      return [{ familyName: dir }, { id: dir }];
  }
}

export const householdRepository: HouseholdRepository = {
  async list(query: ListHouseholdsQuery) {
    const limit = query.limit ?? 25;
    const where = buildHouseholdWhere(query.organizationId, query.filter);
    const orderBy = buildOrderBy(query.sort, query.sortDir);

    const [total, rows] = await Promise.all([
      prisma.household.count({ where }),
      prisma.household.findMany({
        where,
        take: limit + 1,
        skip: query.cursor ? 1 : 0,
        cursor: query.cursor ? { id: query.cursor } : undefined,
        orderBy,
        include: {
          memberships: {
            include: { member: { select: { firstName: true, lastName: true, avatarUrl: true } } },
          },
          _count: { select: { memberships: true } },
        },
      }),
    ]);

    let items = rows.map(toListItem);

    if (query.filter?.minMembers !== undefined || query.filter?.maxMembers !== undefined) {
      items = items.filter((item) => {
        if (query.filter?.minMembers !== undefined && item.memberCount < query.filter.minMembers) {
          return false;
        }
        if (query.filter?.maxMembers !== undefined && item.memberCount > query.filter.maxMembers) {
          return false;
        }
        return true;
      });
    }

    const hasMore = rows.length > limit;
    const page = hasMore ? items.slice(0, limit) : items;
    const nextCursor = hasMore ? page[page.length - 1]?.id ?? null : null;

    return { items: page, nextCursor, total };
  },

  async getById(organizationId: string, id: string) {
    const household = await prisma.household.findFirst({
      where: { id, organizationId, deletedAt: null },
    });
    return household ? mapHouseholdEntity(household) : null;
  },

  async getProfile(organizationId, id, noteVisibilities) {
    const household = await prisma.household.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: {
        memberships: { include: MEMBERSHIP_INCLUDE },
        activities: { orderBy: { occurredAt: "desc" }, take: 50 },
        householdNotes: {
          where: { visibility: { in: noteVisibilities as PrismaNoteVisibility[] } },
          orderBy: { createdAt: "desc" },
        },
        documents: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!household) return null;

    const memberIds = household.memberships.map((m) => m.memberId);
    const analytics = await householdAnalyticsBuilder.build(
      organizationId,
      memberIds,
      household.engagementScore
    );

    const entity = mapHouseholdEntity(household);
    const { notes: summaryNotes, ...entityRest } = entity;

    const profile: HouseholdProfile = {
      ...entityRest,
      summaryNotes,
      memberships: household.memberships.map(mapHouseholdMembership),
      activities: household.activities.map(mapHouseholdActivity),
      notes: household.householdNotes.map(mapHouseholdNote),
      documents: household.documents.map(mapHouseholdDocument),
      analytics,
    };

    return profile;
  },

  async create(input: CreateHouseholdInput) {
    const household = await prisma.household.create({
      data: {
        organizationId: input.organizationId,
        familyName: input.familyName,
        householdCode: input.householdCode ?? generateHouseholdCode(),
        addressLine1: input.addressLine1 ?? null,
        addressLine2: input.addressLine2 ?? null,
        city: input.city ?? null,
        state: input.state ?? null,
        postalCode: input.postalCode ?? null,
        country: input.country ?? null,
        geoLatitude: input.geoLatitude ?? null,
        geoLongitude: input.geoLongitude ?? null,
        preferredLanguage: input.preferredLanguage ?? null,
        anniversaryDate: input.anniversaryDate ?? null,
        emergencyContact: input.emergencyContact ?? null,
        emergencyPhone: input.emergencyPhone ?? null,
        photoUrl: input.photoUrl ?? null,
        notes: input.notes ?? null,
        status: (input.status ?? "ACTIVE") as PrismaHouseholdStatus,
        cellGroup: input.cellGroup ?? null,
        assignedCellLeaderId: input.assignedCellLeaderId ?? null,
        ...(input.initialMemberId
          ? {
              memberships: {
                create: {
                  memberId: input.initialMemberId,
                  relation: (input.initialRelation ?? "HEAD") as PrismaFamilyRelation,
                  isPrimary: true,
                },
              },
            }
          : {}),
      },
    });

    return mapHouseholdEntity(household);
  },

  async update(organizationId: string, id: string, input: UpdateHouseholdInput) {
    const existing = await prisma.household.findFirst({
      where: { id, organizationId, deletedAt: null },
      select: { id: true },
    });
    if (!existing) throw new Error(`Household not found: ${id}`);

    const household = await prisma.household.update({
      where: { id },
      data: {
        ...(input.familyName !== undefined ? { familyName: input.familyName } : {}),
        ...(input.householdCode !== undefined ? { householdCode: input.householdCode } : {}),
        ...(input.addressLine1 !== undefined ? { addressLine1: input.addressLine1 } : {}),
        ...(input.addressLine2 !== undefined ? { addressLine2: input.addressLine2 } : {}),
        ...(input.city !== undefined ? { city: input.city } : {}),
        ...(input.state !== undefined ? { state: input.state } : {}),
        ...(input.postalCode !== undefined ? { postalCode: input.postalCode } : {}),
        ...(input.country !== undefined ? { country: input.country } : {}),
        ...(input.geoLatitude !== undefined ? { geoLatitude: input.geoLatitude } : {}),
        ...(input.geoLongitude !== undefined ? { geoLongitude: input.geoLongitude } : {}),
        ...(input.preferredLanguage !== undefined
          ? { preferredLanguage: input.preferredLanguage }
          : {}),
        ...(input.anniversaryDate !== undefined
          ? { anniversaryDate: input.anniversaryDate }
          : {}),
        ...(input.emergencyContact !== undefined
          ? { emergencyContact: input.emergencyContact }
          : {}),
        ...(input.emergencyPhone !== undefined
          ? { emergencyPhone: input.emergencyPhone }
          : {}),
        ...(input.photoUrl !== undefined ? { photoUrl: input.photoUrl } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
        ...(input.status !== undefined
          ? { status: input.status as PrismaHouseholdStatus }
          : {}),
        ...(input.cellGroup !== undefined ? { cellGroup: input.cellGroup } : {}),
        ...(input.assignedCellLeaderId !== undefined
          ? { assignedCellLeaderId: input.assignedCellLeaderId }
          : {}),
      },
    });

    return mapHouseholdEntity(household);
  },

  async softDelete(organizationId: string, id: string) {
    await prisma.household.updateMany({
      where: { id, organizationId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  },

  async addMember(input) {
    const household = await prisma.household.findFirst({
      where: {
        id: input.householdId,
        organizationId: input.organizationId,
        deletedAt: null,
      },
      select: { id: true },
    });
    if (!household) throw new Error("Household not found");

    const member = await prisma.member.findFirst({
      where: {
        id: input.memberId,
        organizationId: input.organizationId,
        deletedAt: null,
      },
      select: { id: true },
    });
    if (!member) throw new Error("Member not found");

    const existing = await prisma.householdMembership.findUnique({
      where: { memberId: input.memberId },
    });
    if (existing && existing.householdId !== input.householdId) {
      throw new Error("Member already belongs to another household");
    }

    const membership = await prisma.householdMembership.upsert({
      where: {
        householdId_memberId: {
          householdId: input.householdId,
          memberId: input.memberId,
        },
      },
      create: {
        householdId: input.householdId,
        memberId: input.memberId,
        relation: input.relation as PrismaFamilyRelation,
        isPrimary: input.isPrimary ?? false,
      },
      update: {
        relation: input.relation as PrismaFamilyRelation,
        isPrimary: input.isPrimary ?? false,
      },
      include: MEMBERSHIP_INCLUDE,
    });

    return mapHouseholdMembership(membership);
  },

  async removeMember(organizationId, householdId, memberId) {
    await prisma.householdMembership.deleteMany({
      where: {
        householdId,
        memberId,
        household: { organizationId, deletedAt: null },
      },
    });
  },

  async moveMember(input) {
    const [from, to] = await Promise.all([
      prisma.household.findFirst({
        where: {
          id: input.fromHouseholdId,
          organizationId: input.organizationId,
          deletedAt: null,
        },
      }),
      prisma.household.findFirst({
        where: {
          id: input.toHouseholdId,
          organizationId: input.organizationId,
          deletedAt: null,
        },
      }),
    ]);
    if (!from || !to) throw new Error("Household not found");

    await prisma.householdMembership.update({
      where: { memberId: input.memberId },
      data: {
        householdId: input.toHouseholdId,
        relation: (input.relation ?? "OTHER") as PrismaFamilyRelation,
        isPrimary: false,
      },
    });
  },

  async setRelation(organizationId, householdId, memberId, relation) {
    await prisma.householdMembership.updateMany({
      where: {
        householdId,
        memberId,
        household: { organizationId, deletedAt: null },
      },
      data: { relation: relation as PrismaFamilyRelation },
    });
  },

  async setHead(organizationId, householdId, memberId) {
    await prisma.$transaction([
      prisma.householdMembership.updateMany({
        where: {
          householdId,
          household: { organizationId, deletedAt: null },
        },
        data: { isPrimary: false, relation: "OTHER" as PrismaFamilyRelation },
      }),
      prisma.householdMembership.updateMany({
        where: {
          householdId,
          memberId,
          household: { organizationId, deletedAt: null },
        },
        data: { isPrimary: true, relation: "HEAD" as PrismaFamilyRelation },
      }),
    ]);
  },

  async merge(organizationId, sourceId, targetId) {
    const [source, target] = await Promise.all([
      prisma.household.findFirst({
        where: { id: sourceId, organizationId, deletedAt: null },
        include: { memberships: true },
      }),
      prisma.household.findFirst({
        where: { id: targetId, organizationId, deletedAt: null },
      }),
    ]);
    if (!source || !target) throw new Error("Household not found");
    if (sourceId === targetId) throw new Error("Cannot merge household with itself");

    await prisma.$transaction(async (tx) => {
      for (const membership of source.memberships) {
        const existing = await tx.householdMembership.findUnique({
          where: { memberId: membership.memberId },
        });
        if (existing && existing.householdId === targetId) continue;
        if (existing) {
          await tx.householdMembership.delete({ where: { id: existing.id } });
        }
        await tx.householdMembership.create({
          data: {
            householdId: targetId,
            memberId: membership.memberId,
            relation: membership.relation,
            isPrimary: membership.isPrimary,
          },
        });
      }
      await tx.household.update({
        where: { id: sourceId },
        data: { deletedAt: new Date() },
      });
    });

    const merged = await prisma.household.findFirstOrThrow({
      where: { id: targetId, organizationId, deletedAt: null },
    });
    return mapHouseholdEntity(merged);
  },

  async split(input) {
    const source = await prisma.household.findFirst({
      where: {
        id: input.sourceHouseholdId,
        organizationId: input.organizationId,
        deletedAt: null,
      },
      include: { memberships: true },
    });
    if (!source) throw new Error("Source household not found");

    const validIds = new Set(source.memberships.map((m) => m.memberId));
    for (const memberId of input.memberIds) {
      if (!validIds.has(memberId)) {
        throw new Error(`Member ${memberId} is not in source household`);
      }
    }

    const newHousehold = await prisma.$transaction(async (tx) => {
      const created = await tx.household.create({
        data: {
          organizationId: input.organizationId,
          familyName: input.newFamilyName,
          householdCode: generateHouseholdCode(),
        },
      });

      for (const memberId of input.memberIds) {
        await tx.householdMembership.update({
          where: { memberId },
          data: { householdId: created.id, isPrimary: false },
        });
      }

      return created;
    });

    const updatedSource = await prisma.household.findFirstOrThrow({
      where: { id: input.sourceHouseholdId, organizationId: input.organizationId },
    });

    return {
      source: mapHouseholdEntity(updatedSource),
      newHousehold: mapHouseholdEntity(newHousehold),
    };
  },

  async findByIds(organizationId, ids) {
    const households = await prisma.household.findMany({
      where: { id: { in: ids }, organizationId, deletedAt: null },
    });
    return households.map(mapHouseholdEntity);
  },

  async listForExport(organizationId, filter) {
    const where = buildHouseholdWhere(organizationId, filter);
    const households = await prisma.household.findMany({
      where,
      orderBy: [{ familyName: "asc" }, { id: "asc" }],
      include: {
        memberships: {
          include: { member: { select: { firstName: true, lastName: true, avatarUrl: true } } },
        },
        _count: { select: { memberships: true } },
      },
    });
    return households.map(toListItem);
  },

  async updateEngagement(organizationId, id, score) {
    await prisma.household.updateMany({
      where: { id, organizationId, deletedAt: null },
      data: { engagementScore: score },
    });
  },

  async getMemberIds(organizationId, householdId) {
    const memberships = await prisma.householdMembership.findMany({
      where: {
        householdId,
        household: { organizationId, deletedAt: null },
      },
      select: { memberId: true },
    });
    return memberships.map((m) => m.memberId);
  },
};
