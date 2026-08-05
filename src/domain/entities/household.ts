import type {
  DocumentType,
  FamilyRelation,
  HouseholdActivityType,
  HouseholdStatus,
  NoteVisibility,
} from "@/domain/enums/member";

export type HouseholdEntity = {
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
  status: HouseholdStatus;
  cellGroup: string | null;
  assignedCellLeaderId: string | null;
  engagementScore: number;
  qrToken: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

export type HouseholdListItem = HouseholdEntity & {
  memberCount: number;
  headName: string | null;
  headAvatar: string | null;
};

export type HouseholdMembershipEntity = {
  id: string;
  householdId: string;
  memberId: string;
  relation: FamilyRelation;
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
};

export type HouseholdActivityEntity = {
  id: string;
  organizationId: string;
  householdId: string;
  type: HouseholdActivityType;
  title: string;
  description: string | null;
  metadata: Record<string, unknown> | null;
  actorUserId: string | null;
  occurredAt: Date;
};

export type HouseholdNoteEntity = {
  id: string;
  organizationId: string;
  householdId: string;
  authorUserId: string;
  visibility: NoteVisibility;
  body: string;
  createdAt: Date;
  updatedAt: Date;
};

export type HouseholdDocumentEntity = {
  id: string;
  organizationId: string;
  householdId: string;
  type: DocumentType;
  name: string;
  mimeType: string;
  sizeBytes: number;
  storageKey: string;
  url: string | null;
  createdAt: Date;
};

export type HouseholdAnalytics = {
  attendanceTrend: Array<{ month: string; count: number }>;
  givingTrend: Array<{ month: string; amountCents: number }>;
  engagementScore: number;
  volunteerCount: number;
  openPrayers: number;
  memberCount: number;
  growthTimeline: Array<{ month: string; memberCount: number }>;
};

export type HouseholdProfile = Omit<HouseholdEntity, "notes"> & {
  summaryNotes: string | null;
  memberships: HouseholdMembershipEntity[];
  activities: HouseholdActivityEntity[];
  notes: HouseholdNoteEntity[];
  documents: HouseholdDocumentEntity[];
  analytics: HouseholdAnalytics;
};

export type HouseholdFilterDefinition = {
  query?: string;
  statuses?: HouseholdStatus[];
  cellGroup?: string;
  assignedCellLeaderId?: string | null;
  minMembers?: number;
  maxMembers?: number;
  minEngagement?: number;
  hasAddress?: boolean;
};

export type HouseholdListColumn =
  | "familyName"
  | "householdCode"
  | "members"
  | "head"
  | "status"
  | "cellGroup"
  | "engagement"
  | "city"
  | "updatedAt";

export const DEFAULT_HOUSEHOLD_COLUMNS: HouseholdListColumn[] = [
  "familyName",
  "householdCode",
  "members",
  "head",
  "status",
  "engagement",
  "city",
];
