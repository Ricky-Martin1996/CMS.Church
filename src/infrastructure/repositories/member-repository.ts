import type {
  ListMembersQuery,
  MemberRepository,
} from "@/application/ports/member-repositories";
import type { MemberAnalytics, MemberFilterDefinition, MemberProfile } from "@/domain/entities/member";
import { prisma } from "@/infrastructure/db/prisma";
import {
  mapActivity,
  mapAttendance,
  mapDocument,
  mapFamilyMember,
  mapGiving,
  mapHousehold,
  mapMember,
  mapMemberListItem,
  mapNote,
  mapPrayer,
  mapVolunteer,
  memberDisplayName,
} from "@/infrastructure/repositories/member-mappers";
import type {
  MemberLifecycle as PrismaMemberLifecycle,
  MemberStatus as PrismaMemberStatus,
  Prisma,
} from "@prisma/client";
import { format, startOfMonth, subDays, subMonths } from "date-fns";

const MEMBER_TAG_INCLUDE = {
  tags: {
    include: { tag: true },
  },
} as const;

function buildMemberWhere(
  organizationId: string,
  filter?: MemberFilterDefinition
): Prisma.MemberWhereInput {
  const where: Prisma.MemberWhereInput = {
    organizationId,
    deletedAt: null,
  };

  if (!filter) {
    return where;
  }

  if (filter.query) {
    const q = filter.query.trim();
    if (q) {
      where.OR = [
        { firstName: { contains: q, mode: "insensitive" } },
        { lastName: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { phone: { contains: q, mode: "insensitive" } },
        { ministryRole: { contains: q, mode: "insensitive" } },
        { campus: { contains: q, mode: "insensitive" } },
      ];
    }
  }

  if (filter.statuses?.length) {
    where.status = { in: filter.statuses as PrismaMemberStatus[] };
  }

  if (filter.tagIds?.length) {
    where.tags = {
      some: {
        tagId: { in: filter.tagIds },
      },
    };
  }

  if (filter.campus) {
    where.campus = filter.campus;
  }

  if (filter.lifecycle?.length) {
    where.lifecycle = { in: filter.lifecycle as PrismaMemberLifecycle[] };
  }

  if (filter.assignedLeaderId !== undefined) {
    where.assignedLeaderId = filter.assignedLeaderId;
  }

  if (filter.hasEmail === true) {
    where.email = { not: null };
  } else if (filter.hasEmail === false) {
    where.email = null;
  }

  if (filter.joinedAfter || filter.joinedBefore) {
    where.joinedAt = {
      ...(filter.joinedAfter ? { gte: new Date(filter.joinedAfter) } : {}),
      ...(filter.joinedBefore ? { lte: new Date(filter.joinedBefore) } : {}),
    };
  }

  return where;
}

function buildOrderBy(
  sort: ListMembersQuery["sort"] = "name",
  sortDir: ListMembersQuery["sortDir"] = "asc"
): Prisma.MemberOrderByWithRelationInput[] {
  const dir = sortDir ?? "asc";

  switch (sort) {
    case "joinedAt":
      return [{ joinedAt: dir }, { id: dir }];
    case "engagement":
      return [{ engagementScore: dir }, { id: dir }];
    case "updatedAt":
      return [{ updatedAt: dir }, { id: dir }];
    case "name":
    default:
      return [{ lastName: dir }, { firstName: dir }, { id: dir }];
  }
}

function lastSixMonthKeys(): string[] {
  const now = new Date();
  const keys: string[] = [];

  for (let i = 5; i >= 0; i -= 1) {
    keys.push(format(startOfMonth(subMonths(now, i)), "yyyy-MM"));
  }

  return keys;
}

async function buildAnalytics(
  organizationId: string,
  memberId: string,
  scores: Pick<
    MemberAnalytics,
    "engagementScore" | "growthScore" | "riskScore"
  >
): Promise<MemberAnalytics> {
  const monthKeys = lastSixMonthKeys();
  const sixMonthsAgo = startOfMonth(subMonths(new Date(), 5));
  const ninetyDaysAgo = subDays(new Date(), 90);

  const [
    attendanceRecords,
    givingRecords,
    attendanceCount90d,
    givingAgg,
    openPrayers,
    activeVolunteerRoles,
  ] = await Promise.all([
    prisma.attendanceRecord.findMany({
      where: {
        organizationId,
        memberId,
        attendedAt: { gte: sixMonthsAgo },
      },
      select: { attendedAt: true },
    }),
    prisma.givingRecord.findMany({
      where: {
        organizationId,
        memberId,
        givenAt: { gte: sixMonthsAgo },
      },
      select: { givenAt: true, amountCents: true },
    }),
    prisma.attendanceRecord.count({
      where: {
        organizationId,
        memberId,
        attendedAt: { gte: ninetyDaysAgo },
      },
    }),
    prisma.givingRecord.aggregate({
      where: {
        organizationId,
        memberId,
        givenAt: { gte: ninetyDaysAgo },
      },
      _sum: { amountCents: true },
    }),
    prisma.prayerRequest.count({
      where: {
        organizationId,
        memberId,
        status: { in: ["OPEN", "PRAYING"] },
      },
    }),
    prisma.volunteerAssignment.count({
      where: {
        organizationId,
        memberId,
        status: "ACTIVE",
      },
    }),
  ]);

  const attendanceByMonth = new Map<string, number>(
    monthKeys.map((key) => [key, 0])
  );
  for (const record of attendanceRecords) {
    const key = format(startOfMonth(record.attendedAt), "yyyy-MM");
    if (attendanceByMonth.has(key)) {
      attendanceByMonth.set(key, (attendanceByMonth.get(key) ?? 0) + 1);
    }
  }

  const givingByMonth = new Map<string, number>(
    monthKeys.map((key) => [key, 0])
  );
  for (const record of givingRecords) {
    const key = format(startOfMonth(record.givenAt), "yyyy-MM");
    if (givingByMonth.has(key)) {
      givingByMonth.set(
        key,
        (givingByMonth.get(key) ?? 0) + record.amountCents
      );
    }
  }

  return {
    attendanceTrend: monthKeys.map((month) => ({
      month,
      count: attendanceByMonth.get(month) ?? 0,
    })),
    givingTrend: monthKeys.map((month) => ({
      month,
      amountCents: givingByMonth.get(month) ?? 0,
    })),
    engagementScore: scores.engagementScore,
    growthScore: scores.growthScore,
    riskScore: scores.riskScore,
    attendanceCount90d,
    givingTotalCents90d: givingAgg._sum.amountCents ?? 0,
    openPrayers,
    activeVolunteerRoles,
  };
}

export const memberRepository: MemberRepository = {
  async list(query) {
    const limit = query.limit ?? 25;
    const where = buildMemberWhere(query.organizationId, query.filter);
    const orderBy = buildOrderBy(query.sort, query.sortDir);

    const [total, rows] = await Promise.all([
      prisma.member.count({ where }),
      prisma.member.findMany({
        where,
        take: limit + 1,
        skip: query.cursor ? 1 : 0,
        cursor: query.cursor ? { id: query.cursor } : undefined,
        orderBy,
        include: MEMBER_TAG_INCLUDE,
      }),
    ]);

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor = hasMore ? page[page.length - 1]?.id ?? null : null;

    return {
      items: page.map(mapMemberListItem),
      nextCursor,
      total,
    };
  },

  async getById(organizationId, id) {
    const member = await prisma.member.findFirst({
      where: { id, organizationId, deletedAt: null },
    });
    return member ? mapMember(member) : null;
  },

  async getProfile(organizationId, id, noteVisibilities) {
    const member = await prisma.member.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: {
        tags: { include: { tag: true } },
        activities: {
          orderBy: { occurredAt: "desc" },
          take: 50,
        },
        notes: {
          where: {
            visibility: { in: noteVisibilities },
          },
          orderBy: { createdAt: "desc" },
          take: 40,
        },
        documents: {
          orderBy: { createdAt: "desc" },
          take: 40,
        },
        attendance: {
          orderBy: { attendedAt: "desc" },
          take: 24,
        },
        giving: {
          orderBy: { givenAt: "desc" },
          take: 24,
        },
        prayers: {
          orderBy: { createdAt: "desc" },
          take: 40,
        },
        volunteers: {
          orderBy: { startedAt: "desc" },
          take: 40,
        },
        assignedLeader: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        householdLinks: {
          take: 1,
          include: {
            household: {
              include: {
                memberships: {
                  include: {
                    member: {
                      select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        avatarUrl: true,
                        email: true,
                        phone: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!member) {
      return null;
    }

    const householdLink = member.householdLinks[0];
    const household = householdLink?.household ?? null;

    const analytics = await buildAnalytics(organizationId, id, {
      engagementScore: member.engagementScore,
      growthScore: member.growthScore,
      riskScore: member.riskScore,
    });

    const profile: MemberProfile = {
      ...mapMember(member),
      displayName: memberDisplayName(member.firstName, member.lastName),
      tags: member.tags.map((mt) => ({
        id: mt.tag.id,
        organizationId: mt.tag.organizationId,
        name: mt.tag.name,
        slug: mt.tag.slug,
        color: mt.tag.color,
      })),
      activities: member.activities.map(mapActivity),
      notes: member.notes.map(mapNote),
      documents: member.documents.map(mapDocument),
      family: {
        household: household ? mapHousehold(household) : null,
        members: household
          ? household.memberships.map(mapFamilyMember)
          : [],
      },
      attendance: member.attendance.map(mapAttendance),
      giving: member.giving.map(mapGiving),
      prayers: member.prayers.map(mapPrayer),
      volunteers: member.volunteers.map(mapVolunteer),
      assignedLeader: member.assignedLeader
        ? {
            id: member.assignedLeader.id,
            firstName: member.assignedLeader.firstName,
            lastName: member.assignedLeader.lastName,
            avatarUrl: member.assignedLeader.avatarUrl,
          }
        : null,
      analytics,
    };

    return profile;
  },

  async create(input) {
    const member = await prisma.member.create({
      data: {
        organizationId: input.organizationId,
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email ?? null,
        phone: input.phone ?? null,
        whatsapp: input.whatsapp ?? null,
        status: (input.status ?? "VISITOR") as PrismaMemberStatus,
        lifecycle: (input.lifecycle ?? "VISITOR") as PrismaMemberLifecycle,
        campus: input.campus ?? null,
        ministryRole: input.ministryRole ?? null,
        joinedAt: input.joinedAt ?? null,
        ...(input.tagIds?.length
          ? {
              tags: {
                create: input.tagIds.map((tagId) => ({ tagId })),
              },
            }
          : {}),
      },
      include: MEMBER_TAG_INCLUDE,
    });

    return mapMember(member);
  },

  async update(organizationId, id, input) {
    const { tagIds, ...fields } = input;

    const existing = await prisma.member.findFirst({
      where: { id, organizationId, deletedAt: null },
      select: { id: true },
    });

    if (!existing) {
      throw new Error(`Member not found: ${id}`);
    }

    const member = await prisma.member.update({
      where: { id },
      data: {
        ...(fields.firstName !== undefined ? { firstName: fields.firstName } : {}),
        ...(fields.lastName !== undefined ? { lastName: fields.lastName } : {}),
        ...(fields.email !== undefined ? { email: fields.email } : {}),
        ...(fields.phone !== undefined ? { phone: fields.phone } : {}),
        ...(fields.whatsapp !== undefined ? { whatsapp: fields.whatsapp } : {}),
        ...(fields.status !== undefined
          ? { status: fields.status as PrismaMemberStatus }
          : {}),
        ...(fields.lifecycle !== undefined
          ? { lifecycle: fields.lifecycle as PrismaMemberLifecycle }
          : {}),
        ...(fields.avatarUrl !== undefined ? { avatarUrl: fields.avatarUrl } : {}),
        ...(fields.coverUrl !== undefined ? { coverUrl: fields.coverUrl } : {}),
        ...(fields.gender !== undefined ? { gender: fields.gender } : {}),
        ...(fields.maritalStatus !== undefined
          ? { maritalStatus: fields.maritalStatus }
          : {}),
        ...(fields.dateOfBirth !== undefined
          ? { dateOfBirth: fields.dateOfBirth }
          : {}),
        ...(fields.baptismDate !== undefined
          ? { baptismDate: fields.baptismDate }
          : {}),
        ...(fields.joinedAt !== undefined ? { joinedAt: fields.joinedAt } : {}),
        ...(fields.campus !== undefined ? { campus: fields.campus } : {}),
        ...(fields.ministryRole !== undefined
          ? { ministryRole: fields.ministryRole }
          : {}),
        ...(fields.addressLine1 !== undefined
          ? { addressLine1: fields.addressLine1 }
          : {}),
        ...(fields.addressLine2 !== undefined
          ? { addressLine2: fields.addressLine2 }
          : {}),
        ...(fields.city !== undefined ? { city: fields.city } : {}),
        ...(fields.state !== undefined ? { state: fields.state } : {}),
        ...(fields.postalCode !== undefined
          ? { postalCode: fields.postalCode }
          : {}),
        ...(fields.country !== undefined ? { country: fields.country } : {}),
        ...(fields.emergencyName !== undefined
          ? { emergencyName: fields.emergencyName }
          : {}),
        ...(fields.emergencyPhone !== undefined
          ? { emergencyPhone: fields.emergencyPhone }
          : {}),
        ...(fields.emergencyRelation !== undefined
          ? { emergencyRelation: fields.emergencyRelation }
          : {}),
        ...(fields.assignedLeaderId !== undefined
          ? { assignedLeaderId: fields.assignedLeaderId }
          : {}),
        ...(tagIds !== undefined
          ? {
              tags: {
                deleteMany: {},
                create: tagIds.map((tagId) => ({ tagId })),
              },
            }
          : {}),
      },
      include: MEMBER_TAG_INCLUDE,
    });

    return mapMember(member);
  },

  async softDelete(organizationId, id) {
    await prisma.member.updateMany({
      where: { id, organizationId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  },

  async bulkUpdateStatus(organizationId, ids, status) {
    const result = await prisma.member.updateMany({
      where: {
        id: { in: ids },
        organizationId,
        deletedAt: null,
      },
      data: { status: status as PrismaMemberStatus },
    });
    return result.count;
  },

  async bulkAssignLeader(organizationId, ids, leaderId) {
    const result = await prisma.member.updateMany({
      where: {
        id: { in: ids },
        organizationId,
        deletedAt: null,
      },
      data: { assignedLeaderId: leaderId },
    });
    return result.count;
  },

  async bulkAddTag(organizationId, ids, tagId) {
    const tag = await prisma.tag.findFirst({
      where: { id: tagId, organizationId },
      select: { id: true },
    });

    if (!tag) {
      return 0;
    }

    const existing = await prisma.memberTag.findMany({
      where: {
        tagId,
        memberId: { in: ids },
        member: { organizationId, deletedAt: null },
      },
      select: { memberId: true },
    });

    const existingMemberIds = new Set(existing.map((row) => row.memberId));
    const toCreate = ids.filter((memberId) => !existingMemberIds.has(memberId));

    if (toCreate.length === 0) {
      return 0;
    }

    const result = await prisma.memberTag.createMany({
      data: toCreate.map((memberId) => ({ memberId, tagId })),
      skipDuplicates: true,
    });

    return result.count;
  },

  async findByIds(organizationId, ids) {
    const members = await prisma.member.findMany({
      where: {
        id: { in: ids },
        organizationId,
        deletedAt: null,
      },
    });
    return members.map(mapMember);
  },

  async findByQrToken(organizationId, qrToken) {
    const member = await prisma.member.findFirst({
      where: { organizationId, qrToken, deletedAt: null },
    });
    return member ? mapMember(member) : null;
  },

  async updateScores(organizationId, id, scores) {
    await prisma.member.updateMany({
      where: { id, organizationId, deletedAt: null },
      data: {
        engagementScore: scores.engagementScore,
        growthScore: scores.growthScore,
        riskScore: scores.riskScore,
        aiSummary: scores.aiSummary,
        aiInsights: scores.aiInsights as Prisma.InputJsonValue,
      },
    });
  },

  async listForExport(organizationId, filter) {
    const where = buildMemberWhere(organizationId, filter);
    const members = await prisma.member.findMany({
      where,
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }, { id: "asc" }],
      include: MEMBER_TAG_INCLUDE,
    });
    return members.map(mapMemberListItem);
  },
};
