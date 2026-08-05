import type {
  HouseholdAnalytics,
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
  HouseholdActivityType,
  HouseholdStatus,
  NoteVisibility,
} from "@/domain/enums/member";

export type CreateHouseholdInput = {
  organizationId: string;
  familyName: string;
  householdCode?: string;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
  geoLatitude?: number | null;
  geoLongitude?: number | null;
  preferredLanguage?: string | null;
  anniversaryDate?: Date | null;
  emergencyContact?: string | null;
  emergencyPhone?: string | null;
  photoUrl?: string | null;
  notes?: string | null;
  status?: HouseholdStatus;
  cellGroup?: string | null;
  assignedCellLeaderId?: string | null;
  initialMemberId?: string;
  initialRelation?: FamilyRelation;
};

export type UpdateHouseholdInput = Partial<
  Omit<CreateHouseholdInput, "organizationId" | "initialMemberId" | "initialRelation">
>;

export type ListHouseholdsQuery = {
  organizationId: string;
  cursor?: string | null;
  limit?: number;
  filter?: HouseholdFilterDefinition;
  sort?: "familyName" | "engagement" | "memberCount" | "updatedAt";
  sortDir?: "asc" | "desc";
};

export type ListHouseholdsResult = {
  items: HouseholdListItem[];
  nextCursor: string | null;
  total: number;
};

export type HouseholdRepository = {
  list(query: ListHouseholdsQuery): Promise<ListHouseholdsResult>;
  getById(organizationId: string, id: string): Promise<HouseholdEntity | null>;
  getProfile(
    organizationId: string,
    id: string,
    noteVisibilities: NoteVisibility[]
  ): Promise<HouseholdProfile | null>;
  create(input: CreateHouseholdInput): Promise<HouseholdEntity>;
  update(
    organizationId: string,
    id: string,
    input: UpdateHouseholdInput
  ): Promise<HouseholdEntity>;
  softDelete(organizationId: string, id: string): Promise<void>;
  addMember(input: {
    organizationId: string;
    householdId: string;
    memberId: string;
    relation: FamilyRelation;
    isPrimary?: boolean;
  }): Promise<HouseholdMembershipEntity>;
  removeMember(
    organizationId: string,
    householdId: string,
    memberId: string
  ): Promise<void>;
  moveMember(input: {
    organizationId: string;
    memberId: string;
    fromHouseholdId: string;
    toHouseholdId: string;
    relation?: FamilyRelation;
  }): Promise<void>;
  setRelation(
    organizationId: string,
    householdId: string,
    memberId: string,
    relation: FamilyRelation
  ): Promise<void>;
  setHead(
    organizationId: string,
    householdId: string,
    memberId: string
  ): Promise<void>;
  merge(
    organizationId: string,
    sourceId: string,
    targetId: string
  ): Promise<HouseholdEntity>;
  split(input: {
    organizationId: string;
    sourceHouseholdId: string;
    memberIds: string[];
    newFamilyName: string;
  }): Promise<{ source: HouseholdEntity; newHousehold: HouseholdEntity }>;
  findByIds(organizationId: string, ids: string[]): Promise<HouseholdEntity[]>;
  listForExport(
    organizationId: string,
    filter?: HouseholdFilterDefinition
  ): Promise<HouseholdListItem[]>;
  updateEngagement(
    organizationId: string,
    id: string,
    score: number
  ): Promise<void>;
  getMemberIds(organizationId: string, householdId: string): Promise<string[]>;
};

export type HouseholdActivityRepository = {
  create(input: {
    organizationId: string;
    householdId: string;
    type: HouseholdActivityType;
    title: string;
    description?: string | null;
    metadata?: Record<string, unknown> | null;
    actorUserId?: string | null;
    occurredAt?: Date;
  }): Promise<void>;
  listForHousehold(
    organizationId: string,
    householdId: string,
    limit?: number
  ): Promise<HouseholdProfile["activities"]>;
};

export type HouseholdNoteRepository = {
  create(input: {
    organizationId: string;
    householdId: string;
    authorUserId: string;
    visibility: NoteVisibility;
    body: string;
  }): Promise<HouseholdNoteEntity>;
  listForHousehold(
    organizationId: string,
    householdId: string,
    visibilities: NoteVisibility[]
  ): Promise<HouseholdNoteEntity[]>;
};

export type HouseholdDocumentRepository = {
  create(input: {
    organizationId: string;
    householdId: string;
    type: DocumentType;
    name: string;
    mimeType: string;
    sizeBytes: number;
    storageKey: string;
    url?: string | null;
    uploadedById?: string | null;
  }): Promise<HouseholdDocumentEntity>;
  getById(
    organizationId: string,
    id: string
  ): Promise<HouseholdDocumentEntity | null>;
  updateUrl(
    organizationId: string,
    id: string,
    url: string
  ): Promise<void>;
  listForHousehold(
    organizationId: string,
    householdId: string
  ): Promise<HouseholdDocumentEntity[]>;
  delete(organizationId: string, id: string): Promise<void>;
};

export type HouseholdSavedFilterRepository = {
  list(organizationId: string, userId: string): Promise<
    Array<{
      id: string;
      name: string;
      definition: HouseholdFilterDefinition;
      isDefault: boolean;
    }>
  >;
  create(input: {
    organizationId: string;
    userId: string;
    name: string;
    definition: HouseholdFilterDefinition;
    isDefault?: boolean;
  }): Promise<{ id: string; name: string }>;
  delete(organizationId: string, userId: string, id: string): Promise<void>;
};

export type HouseholdListPreferenceRepository = {
  get(
    organizationId: string,
    userId: string
  ): Promise<{
    columns: HouseholdListColumn[];
    density: string;
    viewMode: string;
  } | null>;
  upsert(input: {
    organizationId: string;
    userId: string;
    columns: HouseholdListColumn[];
    density: string;
    viewMode: string;
  }): Promise<void>;
};

export type HouseholdAnalyticsBuilder = {
  build(
    organizationId: string,
    memberIds: string[],
    engagementScore: number
  ): Promise<HouseholdAnalytics>;
};
