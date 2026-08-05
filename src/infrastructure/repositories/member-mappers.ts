import type {
  AiInsights,
  AttendanceEntity,
  FamilyMemberEntity,
  GivingEntity,
  HouseholdEntity,
  MemberActivityEntity,
  MemberDocumentEntity,
  MemberEntity,
  MemberListItem,
  MemberNoteEntity,
  PrayerEntity,
  TagEntity,
  VolunteerEntity,
} from "@/domain/entities/member";
import type {
  ActivityType,
  AttendanceMethod,
  DocumentType,
  FamilyRelation,
  Gender,
  MaritalStatus,
  MemberLifecycle,
  MemberStatus,
  NoteVisibility,
  PrayerStatus,
  VolunteerStatus,
} from "@/domain/enums/member";
import type {
  AttendanceRecord,
  GivingRecord,
  Household,
  HouseholdMembership,
  Member,
  MemberActivity,
  MemberDocument,
  MemberNote,
  MemberTag,
  PrayerRequest,
  Tag,
  VolunteerAssignment,
} from "@prisma/client";
import type { Prisma } from "@prisma/client";

type MemberWithTags = Member & {
  tags?: Array<MemberTag & { tag: Tag }>;
};

type HouseholdMembershipWithMember = HouseholdMembership & {
  member?: Pick<
    Member,
    "id" | "firstName" | "lastName" | "avatarUrl" | "email" | "phone"
  >;
};

export function parseAiInsights(value: Prisma.JsonValue | null): AiInsights | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const obj = value as Record<string, unknown>;

  if (
    typeof obj.summary !== "string" ||
    typeof obj.engagementAnalysis !== "string" ||
    typeof obj.riskScore !== "number" ||
    typeof obj.riskReason !== "string" ||
    typeof obj.generatedAt !== "string" ||
    !Array.isArray(obj.followUps) ||
    !obj.followUps.every((item) => typeof item === "string") ||
    !Array.isArray(obj.nextActions) ||
    !obj.nextActions.every((item) => typeof item === "string")
  ) {
    return null;
  }

  return {
    summary: obj.summary,
    engagementAnalysis: obj.engagementAnalysis,
    riskScore: obj.riskScore,
    riskReason: obj.riskReason,
    followUps: obj.followUps,
    nextActions: obj.nextActions,
    generatedAt: obj.generatedAt,
  };
}

export function mapTag(tag: Tag): TagEntity {
  return {
    id: tag.id,
    organizationId: tag.organizationId,
    name: tag.name,
    slug: tag.slug,
    color: tag.color,
  };
}

export function mapMember(member: Member): MemberEntity {
  return {
    id: member.id,
    organizationId: member.organizationId,
    firstName: member.firstName,
    lastName: member.lastName,
    email: member.email,
    phone: member.phone,
    whatsapp: member.whatsapp,
    avatarUrl: member.avatarUrl,
    coverUrl: member.coverUrl,
    status: member.status as MemberStatus,
    lifecycle: member.lifecycle as MemberLifecycle,
    gender: member.gender as Gender | null,
    maritalStatus: member.maritalStatus as MaritalStatus,
    dateOfBirth: member.dateOfBirth,
    baptismDate: member.baptismDate,
    joinedAt: member.joinedAt,
    campus: member.campus,
    ministryRole: member.ministryRole,
    addressLine1: member.addressLine1,
    addressLine2: member.addressLine2,
    city: member.city,
    state: member.state,
    postalCode: member.postalCode,
    country: member.country,
    emergencyName: member.emergencyName,
    emergencyPhone: member.emergencyPhone,
    emergencyRelation: member.emergencyRelation,
    assignedLeaderId: member.assignedLeaderId,
    engagementScore: member.engagementScore,
    growthScore: member.growthScore,
    riskScore: member.riskScore,
    aiSummary: member.aiSummary,
    aiInsights: parseAiInsights(member.aiInsights),
    qrToken: member.qrToken,
    createdAt: member.createdAt,
    updatedAt: member.updatedAt,
  };
}

export function memberDisplayName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`.trim();
}

export function mapMemberListItem(member: MemberWithTags): MemberListItem {
  const tags = (member.tags ?? []).map((mt) => mapTag(mt.tag));

  return {
    ...mapMember(member),
    tags,
    displayName: memberDisplayName(member.firstName, member.lastName),
  };
}

export function mapActivity(activity: MemberActivity): MemberActivityEntity {
  return {
    id: activity.id,
    organizationId: activity.organizationId,
    memberId: activity.memberId,
    type: activity.type as ActivityType,
    title: activity.title,
    description: activity.description,
    metadata: parseMetadata(activity.metadata),
    actorUserId: activity.actorUserId,
    occurredAt: activity.occurredAt,
  };
}

export function mapNote(note: MemberNote): MemberNoteEntity {
  return {
    id: note.id,
    organizationId: note.organizationId,
    memberId: note.memberId,
    authorUserId: note.authorUserId,
    visibility: note.visibility as NoteVisibility,
    body: note.body,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
  };
}

export function mapDocument(document: MemberDocument): MemberDocumentEntity {
  return {
    id: document.id,
    organizationId: document.organizationId,
    memberId: document.memberId,
    type: document.type as DocumentType,
    name: document.name,
    mimeType: document.mimeType,
    sizeBytes: document.sizeBytes,
    storageKey: document.storageKey,
    url: document.url,
    createdAt: document.createdAt,
  };
}

export function mapHousehold(household: Household): HouseholdEntity {
  return {
    id: household.id,
    organizationId: household.organizationId,
    name: household.familyName,
    addressLine1: household.addressLine1,
    addressLine2: household.addressLine2,
    city: household.city,
    state: household.state,
    postalCode: household.postalCode,
    country: household.country,
  };
}

export function mapFamilyMember(
  membership: HouseholdMembershipWithMember
): FamilyMemberEntity {
  return {
    id: membership.id,
    householdId: membership.householdId,
    memberId: membership.memberId,
    relation: membership.relation as FamilyRelation,
    isPrimary: membership.isPrimary,
    member: membership.member
      ? {
          id: membership.member.id,
          firstName: membership.member.firstName,
          lastName: membership.member.lastName,
          avatarUrl: membership.member.avatarUrl,
          email: membership.member.email,
          phone: membership.member.phone,
        }
      : undefined,
  };
}

export function mapAttendance(record: AttendanceRecord): AttendanceEntity {
  return {
    id: record.id,
    organizationId: record.organizationId,
    memberId: record.memberId,
    eventName: record.eventName,
    attendedAt: record.attendedAt,
    method: record.method as AttendanceMethod,
  };
}

export function mapGiving(record: GivingRecord): GivingEntity {
  return {
    id: record.id,
    organizationId: record.organizationId,
    memberId: record.memberId,
    amountCents: record.amountCents,
    fund: record.fund,
    givenAt: record.givenAt,
  };
}

export function mapPrayer(prayer: PrayerRequest): PrayerEntity {
  return {
    id: prayer.id,
    organizationId: prayer.organizationId,
    memberId: prayer.memberId,
    request: prayer.request,
    status: prayer.status as PrayerStatus,
    createdAt: prayer.createdAt,
    answeredAt: prayer.answeredAt,
  };
}

export function mapVolunteer(volunteer: VolunteerAssignment): VolunteerEntity {
  return {
    id: volunteer.id,
    organizationId: volunteer.organizationId,
    memberId: volunteer.memberId,
    roleName: volunteer.roleName,
    team: volunteer.team,
    status: volunteer.status as VolunteerStatus,
    startedAt: volunteer.startedAt,
    endedAt: volunteer.endedAt,
  };
}

function parseMetadata(
  value: Prisma.JsonValue | null
): Record<string, unknown> | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}
