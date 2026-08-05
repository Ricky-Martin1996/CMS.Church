"use server";

import {
  checkInByQr,
  checkInHousehold,
  checkInMember,
  closeSession,
  createSession,
  exportSessionCsv,
  getActiveLiveSession,
  getAnalytics,
  getDashboard,
  getHouseholdCheckInPreview,
  getLiveStats,
  listSessions,
  registerVisitorCheckIn,
  searchHouseholdsForCheckIn,
  searchMembersForCheckIn,
  startSession,
  undoCheckIn,
} from "@/application/attendance/attendance-service";
import {
  AttendanceMethod,
  AttendanceSessionStatus,
  AttendanceSessionType,
} from "@/domain/enums/member";
import { Permission } from "@/domain/permissions/rbac";
import { requirePermission } from "@/server/auth/session";
import { AppError } from "@/server/errors";
import { revalidatePath } from "next/cache";
import { z } from "zod";

function actionError(error: unknown): { ok: false; error: string } {
  if (error instanceof AppError) {
    return { ok: false, error: error.message };
  }
  if (error instanceof z.ZodError) {
    return { ok: false, error: "Invalid input" };
  }
  console.error("[attendance action]", error);
  return { ok: false, error: "Something went wrong" };
}

const sessionFilterSchema = z.object({
  status: z.array(z.nativeEnum(AttendanceSessionStatus)).optional(),
  attendanceType: z.array(z.nativeEnum(AttendanceSessionType)).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

export async function listSessionsAction(input?: z.infer<typeof sessionFilterSchema>) {
  try {
    const ctx = await requirePermission(Permission.ATTENDANCE_READ);
    const filter = input ? sessionFilterSchema.parse(input) : undefined;
    const data = await listSessions({
      organizationId: ctx.organization.id,
      status: filter?.status,
      attendanceType: filter?.attendanceType,
      from: filter?.from ? new Date(filter.from) : undefined,
      to: filter?.to ? new Date(filter.to) : undefined,
      limit: filter?.limit,
    });
    return { ok: true as const, data };
  } catch (error) {
    return actionError(error);
  }
}

export async function createSessionAction(raw: unknown) {
  try {
    const ctx = await requirePermission(Permission.ATTENDANCE_SESSIONS);
    const schema = z.object({
      serviceName: z.string().min(1).max(120),
      campus: z.string().max(80).optional(),
      ministry: z.string().max(80).optional(),
      date: z.string().datetime(),
      startTime: z.string().datetime().optional(),
      endTime: z.string().datetime().optional(),
      attendanceType: z.nativeEnum(AttendanceSessionType).optional(),
      expectedCount: z.number().int().min(0).nullable().optional(),
      notes: z.string().max(2000).optional(),
    });
    const data = schema.parse(raw);
    const session = await createSession({
      organizationId: ctx.organization.id,
      actorUserId: ctx.user.id,
      serviceName: data.serviceName,
      campus: data.campus ?? null,
      ministry: data.ministry ?? null,
      date: new Date(data.date),
      startTime: data.startTime ? new Date(data.startTime) : null,
      endTime: data.endTime ? new Date(data.endTime) : null,
      attendanceType: data.attendanceType,
      expectedCount: data.expectedCount ?? null,
      notes: data.notes ?? null,
    });
    revalidatePath("/attendance");
    return { ok: true as const, data: session };
  } catch (error) {
    return actionError(error);
  }
}

export async function startSessionAction(sessionId: string) {
  try {
    const ctx = await requirePermission(Permission.ATTENDANCE_MANAGE);
    const session = await startSession({
      organizationId: ctx.organization.id,
      sessionId,
      actorUserId: ctx.user.id,
    });
    revalidatePath("/attendance");
    return { ok: true as const, data: session };
  } catch (error) {
    return actionError(error);
  }
}

export async function closeSessionAction(sessionId: string) {
  try {
    const ctx = await requirePermission(Permission.ATTENDANCE_MANAGE);
    const session = await closeSession({
      organizationId: ctx.organization.id,
      sessionId,
      actorUserId: ctx.user.id,
    });
    revalidatePath("/attendance");
    return { ok: true as const, data: session };
  } catch (error) {
    return actionError(error);
  }
}

export async function getLiveStatsAction(sessionId: string) {
  try {
    const ctx = await requirePermission(Permission.ATTENDANCE_READ);
    const data = await getLiveStats(ctx.organization.id, sessionId);
    return { ok: true as const, data };
  } catch (error) {
    return actionError(error);
  }
}

export async function getActiveLiveSessionAction() {
  try {
    const ctx = await requirePermission(Permission.ATTENDANCE_READ);
    const data = await getActiveLiveSession(ctx.organization.id);
    return { ok: true as const, data };
  } catch (error) {
    return actionError(error);
  }
}

export async function checkInByQrAction(
  sessionId: string,
  qrToken: string,
  autoCheckInAll?: boolean
) {
  try {
    const ctx = await requirePermission(Permission.ATTENDANCE_WRITE);
    const data = await checkInByQr({
      organizationId: ctx.organization.id,
      sessionId,
      qrToken: z.string().min(1).parse(qrToken),
      actorUserId: ctx.user.id,
      autoCheckInAll,
    });
    revalidatePath("/attendance");
    return { ok: true as const, data };
  } catch (error) {
    return actionError(error);
  }
}

export async function searchMembersAction(query: string, limit?: number) {
  try {
    const ctx = await requirePermission(Permission.ATTENDANCE_WRITE);
    const data = await searchMembersForCheckIn(
      ctx.organization.id,
      query,
      limit
    );
    return { ok: true as const, data };
  } catch (error) {
    return actionError(error);
  }
}

export async function searchHouseholdsAction(query: string, limit?: number) {
  try {
    const ctx = await requirePermission(Permission.ATTENDANCE_WRITE);
    const data = await searchHouseholdsForCheckIn(
      ctx.organization.id,
      query,
      limit
    );
    return { ok: true as const, data };
  } catch (error) {
    return actionError(error);
  }
}

export async function checkInMemberAction(sessionId: string, raw: unknown) {
  try {
    const ctx = await requirePermission(Permission.ATTENDANCE_WRITE);
    const data = z
      .object({
        memberId: z.string().min(1),
        method: z.nativeEnum(AttendanceMethod).optional(),
        householdId: z.string().nullable().optional(),
        notes: z.string().max(500).optional(),
      })
      .parse(raw);
    const record = await checkInMember({
      organizationId: ctx.organization.id,
      sessionId,
      memberId: data.memberId,
      method: data.method ?? AttendanceMethod.SEARCH,
      actorUserId: ctx.user.id,
      householdId: data.householdId,
      notes: data.notes,
    });
    revalidatePath("/attendance");
    return { ok: true as const, data: record };
  } catch (error) {
    return actionError(error);
  }
}

export async function getHouseholdPreviewAction(
  sessionId: string,
  householdId: string
) {
  try {
    const ctx = await requirePermission(Permission.ATTENDANCE_WRITE);
    const data = await getHouseholdCheckInPreview(
      ctx.organization.id,
      sessionId,
      householdId
    );
    return { ok: true as const, data };
  } catch (error) {
    return actionError(error);
  }
}

export async function checkInHouseholdAction(sessionId: string, raw: unknown) {
  try {
    const ctx = await requirePermission(Permission.ATTENDANCE_WRITE);
    const data = z
      .object({
        householdId: z.string().min(1),
        memberIds: z.array(z.string()).min(1),
        method: z.nativeEnum(AttendanceMethod).optional(),
      })
      .parse(raw);
    const result = await checkInHousehold({
      organizationId: ctx.organization.id,
      sessionId,
      householdId: data.householdId,
      memberIds: data.memberIds,
      actorUserId: ctx.user.id,
      method: data.method,
    });
    revalidatePath("/attendance");
    return { ok: true as const, data: result };
  } catch (error) {
    return actionError(error);
  }
}

export async function undoCheckInAction(sessionId: string, memberId: string) {
  try {
    const ctx = await requirePermission(Permission.ATTENDANCE_WRITE);
    await undoCheckIn({
      organizationId: ctx.organization.id,
      sessionId,
      memberId,
      actorUserId: ctx.user.id,
    });
    revalidatePath("/attendance");
    return { ok: true as const };
  } catch (error) {
    return actionError(error);
  }
}

export async function registerVisitorCheckInAction(
  sessionId: string,
  raw: unknown
) {
  try {
    const ctx = await requirePermission(Permission.ATTENDANCE_WRITE);
    const data = z
      .object({
        firstName: z.string().min(1).max(80),
        lastName: z.string().min(1).max(80),
        phone: z.string().max(40).optional(),
        email: z.string().email().optional().or(z.literal("")),
        invitedByMemberId: z.string().optional(),
        familyName: z.string().max(120).optional(),
        childrenCount: z.number().int().min(0).optional(),
        prayerRequest: z.string().max(2000).optional(),
        notes: z.string().max(500).optional(),
      })
      .parse(raw);
    const result = await registerVisitorCheckIn({
      organizationId: ctx.organization.id,
      sessionId,
      actorUserId: ctx.user.id,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone ?? null,
      email: data.email || null,
      invitedByMemberId: data.invitedByMemberId ?? null,
      familyName: data.familyName ?? null,
      childrenCount: data.childrenCount,
      prayerRequest: data.prayerRequest ?? null,
      notes: data.notes ?? null,
    });
    revalidatePath("/attendance");
    return { ok: true as const, data: result };
  } catch (error) {
    return actionError(error);
  }
}

export async function getDashboardAction(raw?: unknown) {
  try {
    const ctx = await requirePermission(Permission.ATTENDANCE_READ);
    const schema = z
      .object({
        from: z.string().datetime().optional(),
        to: z.string().datetime().optional(),
      })
      .optional();
    const input = schema.parse(raw);
    const to = input?.to ? new Date(input.to) : new Date();
    const from = input?.from
      ? new Date(input.from)
      : new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);
    const data = await getDashboard(ctx.organization.id, { from, to });
    return { ok: true as const, data };
  } catch (error) {
    return actionError(error);
  }
}

export async function getAnalyticsAction() {
  try {
    const ctx = await requirePermission(Permission.ATTENDANCE_READ);
    const data = await getAnalytics(ctx.organization.id);
    return { ok: true as const, data };
  } catch (error) {
    return actionError(error);
  }
}

export async function exportSessionCsvAction(sessionId: string) {
  try {
    const ctx = await requirePermission(Permission.ATTENDANCE_EXPORT);
    const data = await exportSessionCsv(ctx.organization.id, sessionId);
    return { ok: true as const, data };
  } catch (error) {
    return actionError(error);
  }
}
