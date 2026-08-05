import type {
  CreateSessionInput,
  ListSessionsQuery,
  UpdateSessionInput,
} from "@/domain/entities/attendance";
import {
  ActivityType,
  AttendanceMethod,
  AttendanceSessionStatus,
} from "@/domain/enums/member";
import { notFound } from "@/server/errors";
import {
  activityRepository,
  attendanceRecordRepository,
  attendanceSessionRepository,
  visitorRepository,
} from "@/infrastructure/repositories";

async function logMemberAttended(input: {
  organizationId: string;
  memberId: string;
  eventName: string;
  actorUserId: string;
  occurredAt?: Date;
  metadata?: Record<string, unknown> | null;
}) {
  await activityRepository.create({
    organizationId: input.organizationId,
    memberId: input.memberId,
    type: ActivityType.ATTENDED,
    title: "Attended",
    description: input.eventName,
    actorUserId: input.actorUserId,
    occurredAt: input.occurredAt ?? new Date(),
    metadata: input.metadata ?? null,
  });
}

export async function listSessions(query: ListSessionsQuery) {
  return attendanceSessionRepository.listSessions(query);
}

export async function getSession(organizationId: string, sessionId: string) {
  const session = await attendanceSessionRepository.getSession(
    organizationId,
    sessionId
  );
  if (!session) throw notFound("Attendance session not found");
  return session;
}

export async function getActiveLiveSession(organizationId: string) {
  return attendanceSessionRepository.getActiveLiveSession(organizationId);
}

export async function createSession(
  input: CreateSessionInput & { actorUserId: string }
) {
  return attendanceSessionRepository.createSession(input);
}

export async function updateSession(input: {
  organizationId: string;
  sessionId: string;
  data: UpdateSessionInput;
}) {
  return attendanceSessionRepository.updateSession(
    input.organizationId,
    input.sessionId,
    input.data
  );
}

export async function startSession(input: {
  organizationId: string;
  sessionId: string;
  actorUserId: string;
}) {
  return attendanceSessionRepository.setSessionStatus(
    input.organizationId,
    input.sessionId,
    AttendanceSessionStatus.LIVE
  );
}

export async function closeSession(input: {
  organizationId: string;
  sessionId: string;
  actorUserId: string;
}) {
  return attendanceSessionRepository.setSessionStatus(
    input.organizationId,
    input.sessionId,
    AttendanceSessionStatus.CLOSED
  );
}

export async function getLiveStats(organizationId: string, sessionId: string) {
  return attendanceRecordRepository.getLiveStats(organizationId, sessionId);
}

export async function checkInMember(input: {
  organizationId: string;
  sessionId: string;
  memberId: string;
  method: AttendanceMethod;
  actorUserId: string;
  householdId?: string | null;
  notes?: string | null;
}) {
  const session = await getSession(input.organizationId, input.sessionId);
  const record = await attendanceRecordRepository.checkInMember(input);
  await logMemberAttended({
    organizationId: input.organizationId,
    memberId: input.memberId,
    eventName: session.serviceName,
    actorUserId: input.actorUserId,
    occurredAt: record.attendedAt,
    metadata: {
      sessionId: input.sessionId,
      method: input.method,
      householdId: record.householdId,
    },
  });
  return record;
}

export async function checkInByQr(input: {
  organizationId: string;
  sessionId: string;
  qrToken: string;
  actorUserId: string;
  autoCheckInAll?: boolean;
}) {
  const session = await getSession(input.organizationId, input.sessionId);
  const result = await attendanceRecordRepository.checkInByQrToken(input);

  if (result.kind === "member") {
    await logMemberAttended({
      organizationId: input.organizationId,
      memberId: result.member.id,
      eventName: session.serviceName,
      actorUserId: input.actorUserId,
      occurredAt: result.record.attendedAt,
      metadata: {
        sessionId: input.sessionId,
        method: AttendanceMethod.QR,
      },
    });
    return result;
  }

  if (result.autoCheckedIn) {
    await Promise.all(
      result.autoCheckedIn.checkedIn.map((record) =>
        logMemberAttended({
          organizationId: input.organizationId,
          memberId: record.memberId,
          eventName: session.serviceName,
          actorUserId: input.actorUserId,
          occurredAt: record.attendedAt,
          metadata: {
            sessionId: input.sessionId,
            method: AttendanceMethod.QR,
            householdId: record.householdId,
          },
        })
      )
    );
  }

  return result;
}

export async function searchMembersForCheckIn(
  organizationId: string,
  query: string,
  limit?: number
) {
  return attendanceRecordRepository.searchMembersForCheckIn(
    organizationId,
    query,
    limit
  );
}

export async function searchHouseholdsForCheckIn(
  organizationId: string,
  query: string,
  limit?: number
) {
  return attendanceRecordRepository.searchHouseholdsForCheckIn(
    organizationId,
    query,
    limit
  );
}

export async function getHouseholdCheckInPreview(
  organizationId: string,
  sessionId: string,
  householdId: string
) {
  return attendanceRecordRepository.getHouseholdCheckInPreview(
    organizationId,
    sessionId,
    householdId
  );
}

export async function checkInHousehold(input: {
  organizationId: string;
  sessionId: string;
  householdId: string;
  memberIds: string[];
  actorUserId: string;
  method?: AttendanceMethod;
}) {
  const session = await getSession(input.organizationId, input.sessionId);
  const result = await attendanceRecordRepository.checkInHousehold(input);

  await Promise.all(
    result.checkedIn.map((record) =>
      logMemberAttended({
        organizationId: input.organizationId,
        memberId: record.memberId,
        eventName: session.serviceName,
        actorUserId: input.actorUserId,
        occurredAt: record.attendedAt,
        metadata: {
          sessionId: input.sessionId,
          method: input.method ?? AttendanceMethod.HOUSEHOLD,
          householdId: record.householdId,
        },
      })
    )
  );

  return result;
}

export async function undoCheckIn(input: {
  organizationId: string;
  sessionId: string;
  memberId: string;
  actorUserId: string;
}) {
  await attendanceRecordRepository.undoCheckIn(
    input.organizationId,
    input.sessionId,
    input.memberId
  );
}

export async function registerVisitor(input: {
  organizationId: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  email?: string | null;
  invitedByMemberId?: string | null;
  householdId?: string | null;
  familyName?: string | null;
  childrenCount?: number;
  prayerRequest?: string | null;
  notes?: string | null;
}) {
  return visitorRepository.registerVisitor(input);
}

export async function registerVisitorCheckIn(input: {
  organizationId: string;
  sessionId: string;
  actorUserId: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  email?: string | null;
  invitedByMemberId?: string | null;
  familyName?: string | null;
  childrenCount?: number;
  prayerRequest?: string | null;
  notes?: string | null;
}) {
  const visitor = await visitorRepository.registerVisitor({
    organizationId: input.organizationId,
    firstName: input.firstName,
    lastName: input.lastName,
    phone: input.phone,
    email: input.email,
    invitedByMemberId: input.invitedByMemberId,
    familyName: input.familyName,
    childrenCount: input.childrenCount,
    prayerRequest: input.prayerRequest,
    notes: input.notes,
  });

  try {
    const { bootstrapVisitorJourney } = await import(
      "@/application/visitors/visitor-journey-service"
    );
    await bootstrapVisitorJourney({
      organizationId: input.organizationId,
      visitorId: visitor.id,
      actorUserId: input.actorUserId,
    });
  } catch (error) {
    console.error("[visitor-journey] bootstrap failed", error);
  }

  const attendance = await visitorRepository.checkInVisitor({
    organizationId: input.organizationId,
    sessionId: input.sessionId,
    visitorId: visitor.id,
    invitedByMemberId: input.invitedByMemberId,
    notes: input.notes,
  });

  return { visitor, attendance };
}

export async function getDashboard(
  organizationId: string,
  range: { from: Date; to: Date }
) {
  return attendanceRecordRepository.getDashboard(organizationId, range);
}

export async function getAnalytics(organizationId: string) {
  return attendanceRecordRepository.getAnalytics(organizationId);
}

export async function listMemberAttendanceHistory(
  organizationId: string,
  memberId: string,
  limit?: number
) {
  return attendanceRecordRepository.listMemberAttendanceHistory(
    organizationId,
    memberId,
    limit
  );
}

export async function listHouseholdAttendanceHistory(
  organizationId: string,
  householdId: string,
  limit?: number
) {
  return attendanceRecordRepository.listHouseholdAttendanceHistory(
    organizationId,
    householdId,
    limit
  );
}

export async function exportSessionCsv(
  organizationId: string,
  sessionId: string
) {
  return attendanceRecordRepository.exportSessionCsv(organizationId, sessionId);
}
