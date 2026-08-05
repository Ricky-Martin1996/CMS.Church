import type {
  ActivityType,
  AttendanceMethod,
  DocumentType,
  FamilyRelation,
  Gender,
  MemberLifecycle,
  MemberStatus,
  MaritalStatus,
  NoteVisibility,
  PrayerStatus,
  VolunteerStatus,
} from "@/domain/enums/member";

export type TagEntity = {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  color: string;
};

export type MemberEntity = {
  id: string;
  organizationId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  status: MemberStatus;
  lifecycle: MemberLifecycle;
  gender: Gender | null;
  maritalStatus: MaritalStatus;
  dateOfBirth: Date | null;
  baptismDate: Date | null;
  joinedAt: Date | null;
  campus: string | null;
  ministryRole: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  emergencyName: string | null;
  emergencyPhone: string | null;
  emergencyRelation: string | null;
  assignedLeaderId: string | null;
  engagementScore: number;
  growthScore: number;
  riskScore: number;
  aiSummary: string | null;
  aiInsights: AiInsights | null;
  qrToken: string;
  createdAt: Date;
  updatedAt: Date;
};

export type MemberListItem = MemberEntity & {
  tags: TagEntity[];
  displayName: string;
};

export type MemberActivityEntity = {
  id: string;
  organizationId: string;
  memberId: string;
  type: ActivityType;
  title: string;
  description: string | null;
  metadata: Record<string, unknown> | null;
  actorUserId: string | null;
  occurredAt: Date;
};

export type MemberNoteEntity = {
  id: string;
  organizationId: string;
  memberId: string;
  authorUserId: string;
  visibility: NoteVisibility;
  body: string;
  createdAt: Date;
  updatedAt: Date;
};

export type MemberDocumentEntity = {
  id: string;
  organizationId: string;
  memberId: string;
  type: DocumentType;
  name: string;
  mimeType: string;
  sizeBytes: number;
  storageKey: string;
  url: string | null;
  createdAt: Date;
};

export type HouseholdEntity = {
  id: string;
  organizationId: string;
  name: string;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
};

export type FamilyMemberEntity = {
  id: string;
  householdId: string;
  memberId: string;
  relation: FamilyRelation;
  isPrimary: boolean;
  member?: Pick<MemberEntity, "id" | "firstName" | "lastName" | "avatarUrl" | "email" | "phone">;
};

export type AttendanceEntity = {
  id: string;
  organizationId: string;
  memberId: string;
  eventName: string;
  attendedAt: Date;
  method: AttendanceMethod;
};

export type GivingEntity = {
  id: string;
  organizationId: string;
  memberId: string;
  amountCents: number;
  fund: string;
  givenAt: Date;
};

export type PrayerEntity = {
  id: string;
  organizationId: string;
  memberId: string;
  request: string;
  status: PrayerStatus;
  createdAt: Date;
  answeredAt: Date | null;
};

export type VolunteerEntity = {
  id: string;
  organizationId: string;
  memberId: string;
  roleName: string;
  team: string | null;
  status: VolunteerStatus;
  startedAt: Date;
  endedAt: Date | null;
};

export type AiInsights = {
  summary: string;
  engagementAnalysis: string;
  riskScore: number;
  riskReason: string;
  followUps: string[];
  nextActions: string[];
  generatedAt: string;
};

export type MemberAnalytics = {
  attendanceTrend: Array<{ month: string; count: number }>;
  givingTrend: Array<{ month: string; amountCents: number }>;
  engagementScore: number;
  growthScore: number;
  riskScore: number;
  attendanceCount90d: number;
  givingTotalCents90d: number;
  openPrayers: number;
  activeVolunteerRoles: number;
};

export type MemberProfile = MemberEntity & {
  tags: TagEntity[];
  activities: MemberActivityEntity[];
  notes: MemberNoteEntity[];
  documents: MemberDocumentEntity[];
  family: {
    household: HouseholdEntity | null;
    members: FamilyMemberEntity[];
  };
  attendance: AttendanceEntity[];
  giving: GivingEntity[];
  prayers: PrayerEntity[];
  volunteers: VolunteerEntity[];
  assignedLeader: Pick<MemberEntity, "id" | "firstName" | "lastName" | "avatarUrl"> | null;
  analytics: MemberAnalytics;
  displayName: string;
};

export type MemberFilterDefinition = {
  query?: string;
  statuses?: MemberStatus[];
  tagIds?: string[];
  campus?: string;
  lifecycle?: MemberLifecycle[];
  assignedLeaderId?: string | null;
  hasEmail?: boolean;
  joinedAfter?: string;
  joinedBefore?: string;
};

export type MemberListColumn =
  | "name"
  | "email"
  | "phone"
  | "status"
  | "campus"
  | "ministryRole"
  | "tags"
  | "engagement"
  | "joinedAt"
  | "leader";

export const DEFAULT_MEMBER_COLUMNS: MemberListColumn[] = [
  "name",
  "email",
  "status",
  "campus",
  "tags",
  "engagement",
  "joinedAt",
];
