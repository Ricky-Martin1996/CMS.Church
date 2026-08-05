import type {
  AttendanceAnalytics,
  AttendanceDashboard,
  AttendanceRecordEntity,
  AttendanceSessionEntity,
  CheckInHouseholdResult,
  CreateSessionInput,
  HouseholdCheckInPreview,
  HouseholdCheckInSearchResult,
  ListSessionsQuery,
  MemberCheckInSearchResult,
  QrCheckInResult,
  SessionLiveStats,
  UpdateSessionInput,
  VisitorAttendanceEntity,
  VisitorEntity,
} from "@/domain/entities/attendance";
import type {
  AttendanceCheckStatus,
  AttendanceMethod,
  AttendanceSessionStatus,
} from "@/domain/enums/member";

export type AttendanceSessionRepository = {
  listSessions(query: ListSessionsQuery): Promise<AttendanceSessionEntity[]>;
  getSession(
    organizationId: string,
    sessionId: string
  ): Promise<AttendanceSessionEntity | null>;
  getActiveLiveSession(
    organizationId: string
  ): Promise<AttendanceSessionEntity | null>;
  createSession(input: CreateSessionInput): Promise<AttendanceSessionEntity>;
  updateSession(
    organizationId: string,
    sessionId: string,
    input: UpdateSessionInput
  ): Promise<AttendanceSessionEntity>;
  setSessionStatus(
    organizationId: string,
    sessionId: string,
    status: AttendanceSessionStatus
  ): Promise<AttendanceSessionEntity>;
};

export type AttendanceRecordRepository = {
  getLiveStats(
    organizationId: string,
    sessionId: string
  ): Promise<SessionLiveStats>;
  checkInMember(input: {
    organizationId: string;
    sessionId: string;
    memberId: string;
    method: AttendanceMethod;
    actorUserId: string;
    householdId?: string | null;
    notes?: string | null;
    attendanceStatus?: AttendanceCheckStatus;
  }): Promise<AttendanceRecordEntity>;
  checkInByQrToken(input: {
    organizationId: string;
    sessionId: string;
    qrToken: string;
    actorUserId: string;
    autoCheckInAll?: boolean;
  }): Promise<QrCheckInResult>;
  searchMembersForCheckIn(
    organizationId: string,
    query: string,
    limit?: number
  ): Promise<MemberCheckInSearchResult[]>;
  searchHouseholdsForCheckIn(
    organizationId: string,
    query: string,
    limit?: number
  ): Promise<HouseholdCheckInSearchResult[]>;
  getHouseholdCheckInPreview(
    organizationId: string,
    sessionId: string,
    householdId: string
  ): Promise<HouseholdCheckInPreview>;
  checkInHousehold(input: {
    organizationId: string;
    sessionId: string;
    householdId: string;
    memberIds: string[];
    actorUserId: string;
    method?: AttendanceMethod;
  }): Promise<CheckInHouseholdResult>;
  undoCheckIn(
    organizationId: string,
    sessionId: string,
    memberId: string
  ): Promise<void>;
  getDashboard(
    organizationId: string,
    range: { from: Date; to: Date }
  ): Promise<AttendanceDashboard>;
  getAnalytics(organizationId: string): Promise<AttendanceAnalytics>;
  listMemberAttendanceHistory(
    organizationId: string,
    memberId: string,
    limit?: number
  ): Promise<AttendanceRecordEntity[]>;
  listHouseholdAttendanceHistory(
    organizationId: string,
    householdId: string,
    limit?: number
  ): Promise<AttendanceRecordEntity[]>;
  exportSessionCsv(
    organizationId: string,
    sessionId: string
  ): Promise<string>;
};

export type VisitorRepository = {
  registerVisitor(input: {
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
  }): Promise<VisitorEntity>;
  checkInVisitor(input: {
    organizationId: string;
    sessionId: string;
    visitorId: string;
    invitedByMemberId?: string | null;
    notes?: string | null;
  }): Promise<VisitorAttendanceEntity>;
};
