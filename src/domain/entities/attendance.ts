import type {
  AttendanceCheckStatus,
  AttendanceMethod,
  AttendanceSessionStatus,
  AttendanceSessionType,
} from "@/domain/enums/member";

export type AttendanceSessionEntity = {
  id: string;
  organizationId: string;
  serviceName: string;
  campus: string | null;
  ministry: string | null;
  date: Date;
  startTime: Date | null;
  endTime: Date | null;
  attendanceType: AttendanceSessionType;
  status: AttendanceSessionStatus;
  expectedCount: number | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type AttendanceRecordEntity = {
  id: string;
  organizationId: string;
  sessionId: string | null;
  memberId: string;
  householdId: string | null;
  eventName: string;
  attendedAt: Date;
  checkedInByUserId: string | null;
  method: AttendanceMethod;
  attendanceStatus: AttendanceCheckStatus;
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
};

export type VisitorEntity = {
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
};

export type VisitorAttendanceEntity = {
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
  visitor?: Pick<VisitorEntity, "id" | "firstName" | "lastName" | "phone" | "email">;
};

export type RecentCheckIn = {
  id: string;
  memberId: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  method: AttendanceMethod;
  attendedAt: Date;
  householdId: string | null;
};

export type SessionLiveStats = {
  sessionId: string;
  presentCount: number;
  visitorCount: number;
  firstTimeVisitors: number;
  returningVisitors: number;
  householdCount: number;
  volunteerCount: number;
  expectedCount: number | null;
  recentCheckIns: RecentCheckIn[];
};

export type AttendanceDashboardSessionSummary = {
  id: string;
  serviceName: string;
  date: Date;
  status: AttendanceSessionStatus;
  attendanceType: AttendanceSessionType;
  presentCount: number;
  visitorCount: number;
  expectedCount: number | null;
};

export type AttendanceDashboard = {
  rangeStart: Date;
  rangeEnd: Date;
  totalSessions: number;
  totalPresent: number;
  totalVisitors: number;
  averagePresent: number;
  activeLiveSession: AttendanceSessionEntity | null;
  recentSessions: AttendanceDashboardSessionSummary[];
};

export type AttendanceTrendPoint = {
  label: string;
  presentCount: number;
  visitorCount: number;
};

export type AttendanceAnalytics = {
  weeklyTrend: AttendanceTrendPoint[];
  bySessionType: Array<{
    type: AttendanceSessionType;
    sessionCount: number;
    presentCount: number;
    visitorCount: number;
  }>;
  visitorStats: {
    totalVisitors: number;
    firstTimeVisitors: number;
    secondTimeVisitors: number;
    returningVisitors: number;
  };
  topAttendingHouseholds: Array<{
    householdId: string;
    familyName: string;
    checkInCount: number;
  }>;
};

export type CheckInMemberResult = {
  kind: "member";
  record: AttendanceRecordEntity;
  alreadyCheckedIn: boolean;
};

export type CheckInHouseholdResult = {
  kind: "household";
  householdId: string;
  familyName: string;
  checkedIn: AttendanceRecordEntity[];
  skipped: string[];
};

export type CheckInResult = CheckInMemberResult | CheckInHouseholdResult;

export type HouseholdCheckInMemberPreview = {
  memberId: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  relation: string | null;
  alreadyCheckedIn: boolean;
};

export type HouseholdCheckInPreview = {
  sessionId: string;
  householdId: string;
  familyName: string;
  householdCode: string;
  members: HouseholdCheckInMemberPreview[];
  checkedInCount: number;
  totalCount: number;
};

export type QrCheckInMemberResult = {
  kind: "member";
  member: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
  record: AttendanceRecordEntity;
};

export type QrCheckInHouseholdResult = {
  kind: "household";
  preview: HouseholdCheckInPreview;
  autoCheckedIn?: CheckInHouseholdResult;
};

export type QrCheckInResult = QrCheckInMemberResult | QrCheckInHouseholdResult;

export type MemberCheckInSearchResult = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  status: string;
  householdId: string | null;
  householdName: string | null;
};

export type HouseholdCheckInSearchResult = {
  id: string;
  familyName: string;
  householdCode: string;
  memberCount: number;
  headName: string | null;
};

export type ListSessionsQuery = {
  organizationId: string;
  status?: AttendanceSessionStatus[];
  attendanceType?: AttendanceSessionType[];
  from?: Date;
  to?: Date;
  limit?: number;
};

export type CreateSessionInput = {
  organizationId: string;
  serviceName: string;
  campus?: string | null;
  ministry?: string | null;
  date: Date;
  startTime?: Date | null;
  endTime?: Date | null;
  attendanceType?: AttendanceSessionType;
  expectedCount?: number | null;
  notes?: string | null;
};

export type UpdateSessionInput = Partial<
  Omit<CreateSessionInput, "organizationId">
>;
