import type {
  AttendanceRecordRepository,
  AttendanceSessionRepository,
  VisitorRepository,
} from "@/application/ports/attendance-repositories";
import type {
  AttendanceAnalytics,
  AttendanceDashboard,
  AttendanceRecordEntity,
  AttendanceSessionEntity,
  CheckInHouseholdResult,
  HouseholdCheckInPreview,
  HouseholdCheckInSearchResult,
  ListSessionsQuery,
  MemberCheckInSearchResult,
  QrCheckInResult,
  SessionLiveStats,
} from "@/domain/entities/attendance";
import {
  AttendanceCheckStatus,
  AttendanceMethod,
  AttendanceSessionStatus,
  AttendanceSessionType,
} from "@/domain/enums/member";
import { prisma } from "@/infrastructure/db/prisma";
import { AppError, conflict, notFound } from "@/server/errors";
import type {
  AttendanceCheckStatus as PrismaAttendanceCheckStatus,
  AttendanceMethod as PrismaAttendanceMethod,
  AttendanceSessionStatus as PrismaAttendanceSessionStatus,
  AttendanceSessionType as PrismaAttendanceSessionType,
  Prisma,
} from "@prisma/client";
import {
  endOfDay,
  format,
  startOfDay,
  startOfWeek,
  subWeeks,
} from "date-fns";

const MEMBER_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  avatarUrl: true,
  email: true,
  phone: true,
} as const;

function mapSession(row: {
  id: string;
  organizationId: string;
  serviceName: string;
  campus: string | null;
  ministry: string | null;
  date: Date;
  startTime: Date | null;
  endTime: Date | null;
  attendanceType: PrismaAttendanceSessionType;
  status: PrismaAttendanceSessionStatus;
  expectedCount: number | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}): AttendanceSessionEntity {
  return {
    id: row.id,
    organizationId: row.organizationId,
    serviceName: row.serviceName,
    campus: row.campus,
    ministry: row.ministry,
    date: row.date,
    startTime: row.startTime,
    endTime: row.endTime,
    attendanceType: row.attendanceType as AttendanceSessionType,
    status: row.status as AttendanceSessionStatus,
    expectedCount: row.expectedCount,
    notes: row.notes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapRecord(row: {
  id: string;
  organizationId: string;
  sessionId: string | null;
  memberId: string;
  householdId: string | null;
  eventName: string;
  attendedAt: Date;
  checkedInByUserId: string | null;
  method: PrismaAttendanceMethod;
  attendanceStatus: PrismaAttendanceCheckStatus;
  notes: string | null;
  createdAt: Date;
  member?: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
    email: string | null;
    phone: string | null;
  };
}): AttendanceRecordEntity {
  return {
    id: row.id,
    organizationId: row.organizationId,
    sessionId: row.sessionId,
    memberId: row.memberId,
    householdId: row.householdId,
    eventName: row.eventName,
    attendedAt: row.attendedAt,
    checkedInByUserId: row.checkedInByUserId,
    method: row.method as AttendanceMethod,
    attendanceStatus: row.attendanceStatus as AttendanceCheckStatus,
    notes: row.notes,
    createdAt: row.createdAt,
    member: row.member,
  };
}

function mapVisitor(row: {
  id: string;
  organizationId: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  invitedByMemberId: string | null;
  householdId: string | null;
  familyName: string | null;
  childrenCount: number;
  prayerRequest: string | null;
  notes: string | null;
  convertedMemberId: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: row.id,
    organizationId: row.organizationId,
    firstName: row.firstName,
    lastName: row.lastName,
    phone: row.phone,
    email: row.email,
    invitedByMemberId: row.invitedByMemberId,
    householdId: row.householdId,
    familyName: row.familyName,
    childrenCount: row.childrenCount,
    prayerRequest: row.prayerRequest,
    notes: row.notes,
    convertedMemberId: row.convertedMemberId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapVisitorAttendance(row: {
  id: string;
  organizationId: string;
  visitorId: string;
  sessionId: string;
  invitedByMemberId: string | null;
  isFirstVisit: boolean;
  isSecondVisit: boolean;
  convertedToMember: boolean;
  checkedInAt: Date;
  notes: string | null;
  createdAt: Date;
  visitor?: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    email: string | null;
  };
}) {
  return {
    id: row.id,
    organizationId: row.organizationId,
    visitorId: row.visitorId,
    sessionId: row.sessionId,
    invitedByMemberId: row.invitedByMemberId,
    isFirstVisit: row.isFirstVisit,
    isSecondVisit: row.isSecondVisit,
    convertedToMember: row.convertedToMember,
    checkedInAt: row.checkedInAt,
    notes: row.notes,
    createdAt: row.createdAt,
    visitor: row.visitor,
  };
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: string }).code === "P2002"
  );
}

async function requireSession(organizationId: string, sessionId: string) {
  const session = await prisma.attendanceSession.findFirst({
    where: { id: sessionId, organizationId },
  });
  if (!session) throw notFound("Attendance session not found");
  return session;
}

async function requireMember(organizationId: string, memberId: string) {
  const member = await prisma.member.findFirst({
    where: { id: memberId, organizationId, deletedAt: null },
  });
  if (!member) throw notFound("Member not found");
  return member;
}

async function requireHousehold(organizationId: string, householdId: string) {
  const household = await prisma.household.findFirst({
    where: { id: householdId, organizationId, deletedAt: null },
  });
  if (!household) throw notFound("Household not found");
  return household;
}

function csvEscape(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}

export const attendanceSessionRepository: AttendanceSessionRepository = {
  async listSessions(query) {
    const where: Prisma.AttendanceSessionWhereInput = {
      organizationId: query.organizationId,
    };

    if (query.status?.length) {
      where.status = { in: query.status as PrismaAttendanceSessionStatus[] };
    }
    if (query.attendanceType?.length) {
      where.attendanceType = {
        in: query.attendanceType as PrismaAttendanceSessionType[],
      };
    }
    if (query.from || query.to) {
      where.date = {};
      if (query.from) where.date.gte = startOfDay(query.from);
      if (query.to) where.date.lte = endOfDay(query.to);
    }

    const rows = await prisma.attendanceSession.findMany({
      where,
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: query.limit ?? 50,
    });

    return rows.map(mapSession);
  },

  async getSession(organizationId, sessionId) {
    const row = await prisma.attendanceSession.findFirst({
      where: { id: sessionId, organizationId },
    });
    return row ? mapSession(row) : null;
  },

  async getActiveLiveSession(organizationId) {
    const row = await prisma.attendanceSession.findFirst({
      where: { organizationId, status: "LIVE" },
      orderBy: { date: "desc" },
    });
    return row ? mapSession(row) : null;
  },

  async createSession(input) {
    const row = await prisma.attendanceSession.create({
      data: {
        organizationId: input.organizationId,
        serviceName: input.serviceName,
        campus: input.campus ?? null,
        ministry: input.ministry ?? null,
        date: input.date,
        startTime: input.startTime ?? null,
        endTime: input.endTime ?? null,
        attendanceType: (input.attendanceType ?? "SUNDAY") as PrismaAttendanceSessionType,
        expectedCount: input.expectedCount ?? null,
        notes: input.notes ?? null,
      },
    });
    return mapSession(row);
  },

  async updateSession(organizationId, sessionId, input) {
    await requireSession(organizationId, sessionId);
    const row = await prisma.attendanceSession.update({
      where: { id: sessionId },
      data: {
        ...(input.serviceName !== undefined ? { serviceName: input.serviceName } : {}),
        ...(input.campus !== undefined ? { campus: input.campus } : {}),
        ...(input.ministry !== undefined ? { ministry: input.ministry } : {}),
        ...(input.date !== undefined ? { date: input.date } : {}),
        ...(input.startTime !== undefined ? { startTime: input.startTime } : {}),
        ...(input.endTime !== undefined ? { endTime: input.endTime } : {}),
        ...(input.attendanceType !== undefined
          ? { attendanceType: input.attendanceType as PrismaAttendanceSessionType }
          : {}),
        ...(input.expectedCount !== undefined
          ? { expectedCount: input.expectedCount }
          : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
      },
    });
    return mapSession(row);
  },

  async setSessionStatus(organizationId, sessionId, status) {
    const session = await requireSession(organizationId, sessionId);

    if (status === AttendanceSessionStatus.LIVE) {
      await prisma.attendanceSession.updateMany({
        where: {
          organizationId,
          status: "LIVE",
          NOT: { id: sessionId },
        },
        data: { status: "CLOSED", endTime: new Date() },
      });
    }

    const row = await prisma.attendanceSession.update({
      where: { id: session.id },
      data: {
        status: status as PrismaAttendanceSessionStatus,
        ...(status === AttendanceSessionStatus.LIVE && !session.startTime
          ? { startTime: new Date() }
          : {}),
        ...(status === AttendanceSessionStatus.CLOSED ? { endTime: new Date() } : {}),
      },
    });

    return mapSession(row);
  },
};

export const attendanceRecordRepository: AttendanceRecordRepository = {
  async getLiveStats(organizationId, sessionId) {
    const session = await requireSession(organizationId, sessionId);

    const [
      presentCount,
      volunteerCount,
      householdGroups,
      visitorCount,
      firstTimeVisitors,
      returningVisitors,
      recentRecords,
    ] = await Promise.all([
      prisma.attendanceRecord.count({
        where: {
          organizationId,
          sessionId,
          attendanceStatus: "PRESENT",
        },
      }),
      prisma.attendanceRecord.count({
        where: {
          organizationId,
          sessionId,
          method: "VOLUNTEER",
        },
      }),
      prisma.attendanceRecord.groupBy({
        by: ["householdId"],
        where: {
          organizationId,
          sessionId,
          householdId: { not: null },
        },
      }),
      prisma.visitorAttendance.count({
        where: { organizationId, sessionId },
      }),
      prisma.visitorAttendance.count({
        where: { organizationId, sessionId, isFirstVisit: true },
      }),
      prisma.visitorAttendance.count({
        where: {
          organizationId,
          sessionId,
          isFirstVisit: false,
        },
      }),
      prisma.attendanceRecord.findMany({
        where: { organizationId, sessionId },
        orderBy: { attendedAt: "desc" },
        take: 12,
        include: { member: { select: MEMBER_SELECT } },
      }),
    ]);

    return {
      sessionId,
      presentCount,
      visitorCount,
      firstTimeVisitors,
      returningVisitors,
      householdCount: householdGroups.length,
      volunteerCount,
      expectedCount: session.expectedCount,
      recentCheckIns: recentRecords.map((row) => ({
        id: row.id,
        memberId: row.memberId,
        firstName: row.member.firstName,
        lastName: row.member.lastName,
        avatarUrl: row.member.avatarUrl,
        method: row.method as AttendanceMethod,
        attendedAt: row.attendedAt,
        householdId: row.householdId,
      })),
    } satisfies SessionLiveStats;
  },

  async checkInMember(input) {
    const session = await requireSession(input.organizationId, input.sessionId);
    const member = await requireMember(input.organizationId, input.memberId);

    let householdId = input.householdId ?? null;
    if (!householdId) {
      const link = await prisma.householdMembership.findFirst({
        where: {
          memberId: member.id,
          household: { organizationId: input.organizationId, deletedAt: null },
        },
      });
      householdId = link?.householdId ?? null;
    }

    const attendedAt = new Date();
    const data = {
      organizationId: input.organizationId,
      sessionId: input.sessionId,
      memberId: input.memberId,
      householdId,
      eventName: session.serviceName,
      attendedAt,
      checkedInByUserId: input.actorUserId,
      method: input.method as PrismaAttendanceMethod,
      attendanceStatus: (input.attendanceStatus ??
        AttendanceCheckStatus.PRESENT) as PrismaAttendanceCheckStatus,
      notes: input.notes ?? null,
    };

    try {
      const row = await prisma.attendanceRecord.create({
        data,
        include: { member: { select: MEMBER_SELECT } },
      });
      return mapRecord(row);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw conflict("Member is already checked in for this session");
      }
      throw error;
    }
  },

  async checkInByQrToken(input) {
    const member = await prisma.member.findFirst({
      where: {
        qrToken: input.qrToken,
        organizationId: input.organizationId,
        deletedAt: null,
      },
      select: MEMBER_SELECT,
    });

    if (member) {
      const record = await this.checkInMember({
        organizationId: input.organizationId,
        sessionId: input.sessionId,
        memberId: member.id,
        method: AttendanceMethod.QR,
        actorUserId: input.actorUserId,
      });
      return {
        kind: "member",
        member,
        record,
      } satisfies QrCheckInResult;
    }

    const household = await prisma.household.findFirst({
      where: {
        qrToken: input.qrToken,
        organizationId: input.organizationId,
        deletedAt: null,
      },
    });

    if (!household) {
      throw notFound("Invalid QR code");
    }

    const preview = await this.getHouseholdCheckInPreview(
      input.organizationId,
      input.sessionId,
      household.id
    );

    if (input.autoCheckInAll) {
      const unchecked = preview.members
        .filter((m) => !m.alreadyCheckedIn)
        .map((m) => m.memberId);
      const autoCheckedIn = await this.checkInHousehold({
        organizationId: input.organizationId,
        sessionId: input.sessionId,
        householdId: household.id,
        memberIds: unchecked,
        actorUserId: input.actorUserId,
        method: AttendanceMethod.QR,
      });
      return {
        kind: "household",
        preview,
        autoCheckedIn,
      } satisfies QrCheckInResult;
    }

    return {
      kind: "household",
      preview,
    } satisfies QrCheckInResult;
  },

  async searchMembersForCheckIn(organizationId, query, limit = 20) {
    const q = query.trim();
    if (!q) return [];

    const members = await prisma.member.findMany({
      where: {
        organizationId,
        deletedAt: null,
        OR: [
          { firstName: { contains: q, mode: "insensitive" } },
          { lastName: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          { phone: { contains: q, mode: "insensitive" } },
        ],
      },
      take: limit,
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      include: {
        householdLinks: {
          take: 1,
          include: {
            household: {
              select: { id: true, familyName: true },
            },
          },
        },
      },
    });

    return members.map(
      (member): MemberCheckInSearchResult => ({
        id: member.id,
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        phone: member.phone,
        avatarUrl: member.avatarUrl,
        status: member.status,
        householdId: member.householdLinks[0]?.household.id ?? null,
        householdName: member.householdLinks[0]?.household.familyName ?? null,
      })
    );
  },

  async searchHouseholdsForCheckIn(organizationId, query, limit = 20) {
    const q = query.trim();
    if (!q) return [];

    const households = await prisma.household.findMany({
      where: {
        organizationId,
        deletedAt: null,
        OR: [
          { familyName: { contains: q, mode: "insensitive" } },
          { householdCode: { contains: q, mode: "insensitive" } },
        ],
      },
      take: limit,
      orderBy: { familyName: "asc" },
      include: {
        memberships: {
          where: { isPrimary: true },
          take: 1,
          include: {
            member: {
              select: { firstName: true, lastName: true },
            },
          },
        },
        _count: { select: { memberships: true } },
      },
    });

    return households.map(
      (household): HouseholdCheckInSearchResult => ({
        id: household.id,
        familyName: household.familyName,
        householdCode: household.householdCode,
        memberCount: household._count.memberships,
        headName: household.memberships[0]
          ? `${household.memberships[0].member.firstName} ${household.memberships[0].member.lastName}`
          : null,
      })
    );
  },

  async getHouseholdCheckInPreview(organizationId, sessionId, householdId) {
    await requireSession(organizationId, sessionId);
    const household = await requireHousehold(organizationId, householdId);

    const memberships = await prisma.householdMembership.findMany({
      where: { householdId },
      include: {
        member: {
          select: {
            ...MEMBER_SELECT,
            deletedAt: true,
          },
        },
      },
      orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
    });

    const activeMembers = memberships.filter((m) => m.member.deletedAt === null);
    const memberIds = activeMembers.map((m) => m.memberId);

    const checkedIn = await prisma.attendanceRecord.findMany({
      where: {
        organizationId,
        sessionId,
        memberId: { in: memberIds },
      },
      select: { memberId: true },
    });
    const checkedSet = new Set(checkedIn.map((r) => r.memberId));

    const members = activeMembers.map((link) => ({
      memberId: link.memberId,
      firstName: link.member.firstName,
      lastName: link.member.lastName,
      avatarUrl: link.member.avatarUrl,
      relation: link.relation,
      alreadyCheckedIn: checkedSet.has(link.memberId),
    }));

    return {
      sessionId,
      householdId: household.id,
      familyName: household.familyName,
      householdCode: household.householdCode,
      members,
      checkedInCount: members.filter((m) => m.alreadyCheckedIn).length,
      totalCount: members.length,
    } satisfies HouseholdCheckInPreview;
  },

  async checkInHousehold(input) {
    await requireSession(input.organizationId, input.sessionId);
    const household = await requireHousehold(
      input.organizationId,
      input.householdId
    );

    const memberships = await prisma.householdMembership.findMany({
      where: {
        householdId: household.id,
        memberId: { in: input.memberIds },
      },
    });
    const validMemberIds = new Set(memberships.map((m) => m.memberId));
    const skipped = input.memberIds.filter((id) => !validMemberIds.has(id));

    const checkedIn: AttendanceRecordEntity[] = [];
    for (const memberId of input.memberIds) {
      if (!validMemberIds.has(memberId)) continue;
      try {
        const record = await this.checkInMember({
          organizationId: input.organizationId,
          sessionId: input.sessionId,
          memberId,
          method: input.method ?? AttendanceMethod.HOUSEHOLD,
          actorUserId: input.actorUserId,
          householdId: household.id,
        });
        checkedIn.push(record);
      } catch (error) {
        if (error instanceof AppError && error.code === "CONFLICT") {
          skipped.push(memberId);
          continue;
        }
        if (isUniqueViolation(error)) {
          skipped.push(memberId);
          continue;
        }
        throw error;
      }
    }

    return {
      kind: "household",
      householdId: household.id,
      familyName: household.familyName,
      checkedIn,
      skipped,
    } satisfies CheckInHouseholdResult;
  },

  async undoCheckIn(organizationId, sessionId, memberId) {
    await requireSession(organizationId, sessionId);
    const result = await prisma.attendanceRecord.deleteMany({
      where: { organizationId, sessionId, memberId },
    });
    if (result.count === 0) {
      throw notFound("Check-in record not found");
    }
  },

  async getDashboard(organizationId, range) {
    const sessions = await prisma.attendanceSession.findMany({
      where: {
        organizationId,
        date: {
          gte: startOfDay(range.from),
          lte: endOfDay(range.to),
        },
      },
      orderBy: { date: "desc" },
      include: {
        _count: {
          select: {
            records: true,
            visitorAttendances: true,
          },
        },
      },
    });

    const [totalPresent, totalVisitors, activeLiveSession] = await Promise.all([
      prisma.attendanceRecord.count({
        where: {
          organizationId,
          session: {
            date: {
              gte: startOfDay(range.from),
              lte: endOfDay(range.to),
            },
          },
          attendanceStatus: "PRESENT",
        },
      }),
      prisma.visitorAttendance.count({
        where: {
          organizationId,
          session: {
            date: {
              gte: startOfDay(range.from),
              lte: endOfDay(range.to),
            },
          },
        },
      }),
      attendanceSessionRepository.getActiveLiveSession(organizationId),
    ]);

    const recentSessions = sessions.slice(0, 8).map((session) => ({
      id: session.id,
      serviceName: session.serviceName,
      date: session.date,
      status: session.status as AttendanceSessionStatus,
      attendanceType: session.attendanceType as AttendanceSessionType,
      presentCount: session._count.records,
      visitorCount: session._count.visitorAttendances,
      expectedCount: session.expectedCount,
    }));

    return {
      rangeStart: range.from,
      rangeEnd: range.to,
      totalSessions: sessions.length,
      totalPresent,
      totalVisitors,
      averagePresent:
        sessions.length > 0 ? Math.round(totalPresent / sessions.length) : 0,
      activeLiveSession,
      recentSessions,
    } satisfies AttendanceDashboard;
  },

  async getAnalytics(organizationId) {
    const now = new Date();
    const weekStarts = Array.from({ length: 8 }).map((_, i) =>
      startOfWeek(subWeeks(now, 7 - i), { weekStartsOn: 0 })
    );

    const weeklyTrend: AttendanceAnalytics["weeklyTrend"] = [];
    for (let i = 0; i < weekStarts.length; i += 1) {
      const from = weekStarts[i]!;
      const to = i < weekStarts.length - 1 ? weekStarts[i + 1]! : now;
      const [presentCount, visitorCount] = await Promise.all([
        prisma.attendanceRecord.count({
          where: {
            organizationId,
            attendedAt: { gte: from, lt: to },
            attendanceStatus: "PRESENT",
          },
        }),
        prisma.visitorAttendance.count({
          where: {
            organizationId,
            checkedInAt: { gte: from, lt: to },
          },
        }),
      ]);
      weeklyTrend.push({
        label: format(from, "MMM d"),
        presentCount,
        visitorCount,
      });
    }

    const sessions = await prisma.attendanceSession.findMany({
      where: { organizationId },
      include: {
        _count: { select: { records: true, visitorAttendances: true } },
      },
    });

    const byTypeMap = new Map<
      string,
      { sessionCount: number; presentCount: number; visitorCount: number }
    >();
    for (const session of sessions) {
      const existing = byTypeMap.get(session.attendanceType) ?? {
        sessionCount: 0,
        presentCount: 0,
        visitorCount: 0,
      };
      existing.sessionCount += 1;
      existing.presentCount += session._count.records;
      existing.visitorCount += session._count.visitorAttendances;
      byTypeMap.set(session.attendanceType, existing);
    }

    const bySessionType = [...byTypeMap.entries()].map(([type, stats]) => ({
      type: type as AttendanceAnalytics["bySessionType"][number]["type"],
      ...stats,
    }));

    const [firstTimeVisitors, secondTimeVisitors, returningVisitors, totalVisitors] =
      await Promise.all([
        prisma.visitorAttendance.count({
          where: { organizationId, isFirstVisit: true },
        }),
        prisma.visitorAttendance.count({
          where: { organizationId, isSecondVisit: true },
        }),
        prisma.visitorAttendance.count({
          where: {
            organizationId,
            isFirstVisit: false,
            isSecondVisit: false,
          },
        }),
        prisma.visitor.count({ where: { organizationId } }),
      ]);

    const householdCounts = await prisma.attendanceRecord.groupBy({
      by: ["householdId"],
      where: {
        organizationId,
        householdId: { not: null },
        attendanceStatus: "PRESENT",
      },
      _count: { _all: true },
      orderBy: { _count: { householdId: "desc" } },
      take: 5,
    });

    const householdIds = householdCounts
      .map((row) => row.householdId)
      .filter((id): id is string => Boolean(id));

    const households = await prisma.household.findMany({
      where: { id: { in: householdIds } },
      select: { id: true, familyName: true },
    });
    const householdNameById = new Map(
      households.map((h) => [h.id, h.familyName])
    );

    return {
      weeklyTrend,
      bySessionType,
      visitorStats: {
        totalVisitors,
        firstTimeVisitors,
        secondTimeVisitors,
        returningVisitors,
      },
      topAttendingHouseholds: householdCounts.map((row) => ({
        householdId: row.householdId!,
        familyName: householdNameById.get(row.householdId!) ?? "Unknown",
        checkInCount: row._count._all,
      })),
    } satisfies AttendanceAnalytics;
  },

  async listMemberAttendanceHistory(organizationId, memberId, limit = 50) {
    const rows = await prisma.attendanceRecord.findMany({
      where: { organizationId, memberId },
      orderBy: { attendedAt: "desc" },
      take: limit,
      include: { member: { select: MEMBER_SELECT } },
    });
    return rows.map(mapRecord);
  },

  async listHouseholdAttendanceHistory(organizationId, householdId, limit = 50) {
    const rows = await prisma.attendanceRecord.findMany({
      where: { organizationId, householdId },
      orderBy: { attendedAt: "desc" },
      take: limit,
      include: { member: { select: MEMBER_SELECT } },
    });
    return rows.map(mapRecord);
  },

  async exportSessionCsv(organizationId, sessionId) {
    const session = await requireSession(organizationId, sessionId);

    const [records, visitorRows] = await Promise.all([
      prisma.attendanceRecord.findMany({
        where: { organizationId, sessionId },
        include: { member: { select: MEMBER_SELECT } },
        orderBy: { attendedAt: "asc" },
      }),
      prisma.visitorAttendance.findMany({
        where: { organizationId, sessionId },
        include: {
          visitor: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
        },
        orderBy: { checkedInAt: "asc" },
      }),
    ]);

    const header = [
      "type",
      "firstName",
      "lastName",
      "email",
      "phone",
      "method",
      "status",
      "checkedInAt",
      "householdId",
      "isFirstVisit",
      "isSecondVisit",
    ];

    const memberLines = records.map((row) =>
      [
        "member",
        row.member.firstName,
        row.member.lastName,
        row.member.email ?? "",
        row.member.phone ?? "",
        row.method,
        row.attendanceStatus,
        row.attendedAt.toISOString(),
        row.householdId ?? "",
        "",
        "",
      ]
        .map((v) => csvEscape(String(v)))
        .join(",")
    );

    const visitorLines = visitorRows.map((row) =>
      [
        "visitor",
        row.visitor.firstName,
        row.visitor.lastName,
        row.visitor.email ?? "",
        row.visitor.phone ?? "",
        "VISITOR",
        "PRESENT",
        row.checkedInAt.toISOString(),
        "",
        row.isFirstVisit ? "yes" : "no",
        row.isSecondVisit ? "yes" : "no",
      ]
        .map((v) => csvEscape(String(v)))
        .join(",")
    );

    const meta = `# Session: ${session.serviceName} (${format(session.date, "yyyy-MM-dd")})`;
    return [meta, header.join(","), ...memberLines, ...visitorLines].join("\n");
  },
};

export const visitorRepository: VisitorRepository = {
  async registerVisitor(input) {
    const row = await prisma.visitor.create({
      data: {
        organizationId: input.organizationId,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone ?? null,
        email: input.email ?? null,
        invitedByMemberId: input.invitedByMemberId ?? null,
        householdId: input.householdId ?? null,
        familyName: input.familyName ?? null,
        childrenCount: input.childrenCount ?? 0,
        prayerRequest: input.prayerRequest ?? null,
        notes: input.notes ?? null,
      },
    });
    return mapVisitor(row);
  },

  async checkInVisitor(input) {
    await requireSession(input.organizationId, input.sessionId);

    const visitor = await prisma.visitor.findFirst({
      where: { id: input.visitorId, organizationId: input.organizationId },
    });
    if (!visitor) throw notFound("Visitor not found");

    const priorCount = await prisma.visitorAttendance.count({
      where: { visitorId: input.visitorId },
    });

    const isFirstVisit = priorCount === 0;
    const isSecondVisit = priorCount === 1;

    try {
      const row = await prisma.visitorAttendance.create({
        data: {
          organizationId: input.organizationId,
          visitorId: input.visitorId,
          sessionId: input.sessionId,
          invitedByMemberId: input.invitedByMemberId ?? null,
          isFirstVisit,
          isSecondVisit,
          notes: input.notes ?? null,
        },
        include: {
          visitor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
              email: true,
            },
          },
        },
      });
      return mapVisitorAttendance(row);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw conflict("Visitor is already checked in for this session");
      }
      throw error;
    }
  },
};
