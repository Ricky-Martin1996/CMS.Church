import type {
  AiInsights,
  MemberAnalytics,
  MemberEntity,
  MemberFilterDefinition,
  MemberListColumn,
  MemberListItem,
  MemberProfile,
  TagEntity,
} from "@/domain/entities/member";
import type {
  ActivityType,
  AttendanceMethod,
  DocumentType,
  FamilyRelation,
  MemberLifecycle,
  MemberStatus,
  NoteVisibility,
} from "@/domain/enums/member";

export type CreateMemberInput = {
  organizationId: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  status?: MemberStatus;
  lifecycle?: MemberLifecycle;
  campus?: string | null;
  ministryRole?: string | null;
  joinedAt?: Date | null;
  tagIds?: string[];
};

export type UpdateMemberInput = Partial<
  Omit<CreateMemberInput, "organizationId" | "tagIds">
> & {
  avatarUrl?: string | null;
  coverUrl?: string | null;
  gender?: MemberEntity["gender"];
  maritalStatus?: MemberEntity["maritalStatus"];
  dateOfBirth?: Date | null;
  baptismDate?: Date | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
  emergencyName?: string | null;
  emergencyPhone?: string | null;
  emergencyRelation?: string | null;
  assignedLeaderId?: string | null;
  tagIds?: string[];
};

export type ListMembersQuery = {
  organizationId: string;
  cursor?: string | null;
  limit?: number;
  filter?: MemberFilterDefinition;
  sort?: "name" | "joinedAt" | "engagement" | "updatedAt";
  sortDir?: "asc" | "desc";
};

export type ListMembersResult = {
  items: MemberListItem[];
  nextCursor: string | null;
  total: number;
};

export type MemberRepository = {
  list(query: ListMembersQuery): Promise<ListMembersResult>;
  getById(organizationId: string, id: string): Promise<MemberEntity | null>;
  getProfile(
    organizationId: string,
    id: string,
    noteVisibilities: NoteVisibility[]
  ): Promise<MemberProfile | null>;
  create(input: CreateMemberInput): Promise<MemberEntity>;
  update(
    organizationId: string,
    id: string,
    input: UpdateMemberInput
  ): Promise<MemberEntity>;
  softDelete(organizationId: string, id: string): Promise<void>;
  bulkUpdateStatus(
    organizationId: string,
    ids: string[],
    status: MemberStatus
  ): Promise<number>;
  bulkAssignLeader(
    organizationId: string,
    ids: string[],
    leaderId: string | null
  ): Promise<number>;
  bulkAddTag(
    organizationId: string,
    ids: string[],
    tagId: string
  ): Promise<number>;
  findByIds(organizationId: string, ids: string[]): Promise<MemberEntity[]>;
  findByQrToken(
    organizationId: string,
    qrToken: string
  ): Promise<MemberEntity | null>;
  updateScores(
    organizationId: string,
    id: string,
    scores: {
      engagementScore: number;
      growthScore: number;
      riskScore: number;
      aiSummary: string;
      aiInsights: AiInsights;
    }
  ): Promise<void>;
  listForExport(
    organizationId: string,
    filter?: MemberFilterDefinition
  ): Promise<MemberListItem[]>;
};

export type ActivityRepository = {
  create(input: {
    organizationId: string;
    memberId: string;
    type: ActivityType;
    title: string;
    description?: string | null;
    metadata?: Record<string, unknown> | null;
    actorUserId?: string | null;
    occurredAt?: Date;
  }): Promise<void>;
  listForMember(
    organizationId: string,
    memberId: string,
    limit?: number
  ): Promise<MemberProfile["activities"]>;
};

export type TagRepository = {
  list(organizationId: string): Promise<TagEntity[]>;
  ensureDefaults(organizationId: string): Promise<TagEntity[]>;
  create(
    organizationId: string,
    input: { name: string; color?: string }
  ): Promise<TagEntity>;
};

export type NoteRepository = {
  create(input: {
    organizationId: string;
    memberId: string;
    authorUserId: string;
    visibility: NoteVisibility;
    body: string;
  }): Promise<MemberProfile["notes"][number]>;
  listForMember(
    organizationId: string,
    memberId: string,
    visibilities: NoteVisibility[]
  ): Promise<MemberProfile["notes"]>;
};

export type DocumentRepository = {
  create(input: {
    organizationId: string;
    memberId: string;
    type: DocumentType;
    name: string;
    mimeType: string;
    sizeBytes: number;
    storageKey: string;
    url?: string | null;
    uploadedById?: string | null;
  }): Promise<MemberProfile["documents"][number]>;
  getById(
    organizationId: string,
    id: string
  ): Promise<MemberProfile["documents"][number] | null>;
  updateUrl(
    organizationId: string,
    id: string,
    url: string
  ): Promise<void>;
  listForMember(
    organizationId: string,
    memberId: string
  ): Promise<MemberProfile["documents"]>;
  delete(organizationId: string, id: string): Promise<void>;
};

export type FamilyRepository = {
  getForMember(
    organizationId: string,
    memberId: string
  ): Promise<MemberProfile["family"]>;
  upsertHousehold(input: {
    organizationId: string;
    memberId: string;
    name: string;
    relation: FamilyRelation;
    isPrimary?: boolean;
    addressLine1?: string | null;
    city?: string | null;
    state?: string | null;
    postalCode?: string | null;
    country?: string | null;
    emergencyName?: string | null;
    emergencyPhone?: string | null;
  }): Promise<MemberProfile["family"]>;
  linkMember(input: {
    householdId: string;
    memberId: string;
    relation: FamilyRelation;
    isPrimary?: boolean;
  }): Promise<void>;
};

export type AttendanceRepository = {
  create(input: {
    organizationId: string;
    memberId: string;
    eventName: string;
    attendedAt: Date;
    method?: AttendanceMethod;
    notes?: string | null;
  }): Promise<void>;
  trend(
    organizationId: string,
    memberId: string
  ): Promise<MemberAnalytics["attendanceTrend"]>;
};

export type GivingRepository = {
  trend(
    organizationId: string,
    memberId: string
  ): Promise<MemberAnalytics["givingTrend"]>;
};

export type PrayerRepository = {
  create(input: {
    organizationId: string;
    memberId: string;
    request: string;
  }): Promise<MemberProfile["prayers"][number]>;
  listForMember(
    organizationId: string,
    memberId: string
  ): Promise<MemberProfile["prayers"]>;
};

export type VolunteerRepository = {
  create(input: {
    organizationId: string;
    memberId: string;
    roleName: string;
    team?: string | null;
  }): Promise<MemberProfile["volunteers"][number]>;
  listForMember(
    organizationId: string,
    memberId: string
  ): Promise<MemberProfile["volunteers"]>;
};

export type SavedFilterRepository = {
  list(organizationId: string, userId: string): Promise<
    Array<{
      id: string;
      name: string;
      definition: MemberFilterDefinition;
      isDefault: boolean;
    }>
  >;
  create(input: {
    organizationId: string;
    userId: string;
    name: string;
    definition: MemberFilterDefinition;
    isDefault?: boolean;
  }): Promise<{ id: string; name: string }>;
  delete(organizationId: string, userId: string, id: string): Promise<void>;
};

export type ListPreferenceRepository = {
  get(
    organizationId: string,
    userId: string
  ): Promise<{
    columns: MemberListColumn[];
    density: string;
    viewMode: string;
  } | null>;
  upsert(input: {
    organizationId: string;
    userId: string;
    columns: MemberListColumn[];
    density: string;
    viewMode: string;
  }): Promise<void>;
};
