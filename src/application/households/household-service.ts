import type {
  CreateHouseholdInput,
  ListHouseholdsQuery,
  UpdateHouseholdInput,
} from "@/application/ports/household-repositories";
import type {
  HouseholdFilterDefinition,
  HouseholdListColumn,
  HouseholdProfile,
} from "@/domain/entities/household";
import {
  ActivityType,
  DocumentType,
  FamilyRelation,
  HouseholdActivityType,
  HouseholdStatus,
  NoteVisibility,
} from "@/domain/enums/member";
import { canWriteNoteVisibility, noteVisibilitiesForRole } from "@/domain/permissions/notes";
import type { Role } from "@/domain/enums/role";
import { forbidden, notFound, AppError } from "@/server/errors";
import { requireHouseholdInOrg, requireMemberInOrg } from "@/server/tenant/scope";
import {
  activityRepository,
} from "@/infrastructure/repositories";
import {
  householdActivityRepository,
  householdDocumentRepository,
  householdListPreferenceRepository,
  householdNoteRepository,
  householdSavedFilterRepository,
} from "@/infrastructure/repositories/household-supporting";
import {
  householdAnalyticsBuilder,
  householdRepository,
} from "@/infrastructure/repositories/household-repository";

const MAX_CSV_IMPORT_ROWS = 1000;

async function logHouseholdActivity(input: {
  organizationId: string;
  householdId: string;
  type: HouseholdActivityType;
  title: string;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
  actorUserId?: string | null;
  occurredAt?: Date;
}) {
  await householdActivityRepository.create(input);
}

export async function listHouseholds(query: ListHouseholdsQuery) {
  return householdRepository.list(query);
}

export async function getHouseholdProfile(input: {
  organizationId: string;
  householdId: string;
  role: Role;
}) {
  const visibilities = noteVisibilitiesForRole(input.role);
  const profile = await householdRepository.getProfile(
    input.organizationId,
    input.householdId,
    visibilities
  );
  if (!profile) throw notFound("Household not found");
  return profile;
}

export async function createHousehold(
  input: CreateHouseholdInput & { actorUserId: string }
) {
  const household = await householdRepository.create(input);
  await logHouseholdActivity({
    organizationId: input.organizationId,
    householdId: household.id,
    type: HouseholdActivityType.CREATED,
    title: "Household created",
    description: household.familyName,
    actorUserId: input.actorUserId,
  });

  if (input.initialMemberId) {
    await activityRepository.create({
      organizationId: input.organizationId,
      memberId: input.initialMemberId,
      type: ActivityType.FAMILY_LINKED,
      title: "Family linked",
      description: household.familyName,
      actorUserId: input.actorUserId,
    });
  }

  await refreshHouseholdEngagement(input.organizationId, household.id);
  return household;
}

export async function updateHousehold(input: {
  organizationId: string;
  householdId: string;
  actorUserId: string;
  data: UpdateHouseholdInput;
}) {
  const existing = await householdRepository.getById(
    input.organizationId,
    input.householdId
  );
  if (!existing) throw notFound("Household not found");

  const household = await householdRepository.update(
    input.organizationId,
    input.householdId,
    input.data
  );

  const statusChanged =
    input.data.status !== undefined && input.data.status !== existing.status;

  await logHouseholdActivity({
    organizationId: input.organizationId,
    householdId: household.id,
    type: statusChanged
      ? HouseholdActivityType.STATUS_CHANGED
      : HouseholdActivityType.EDITED,
    title: statusChanged ? "Status changed" : "Household updated",
    description: statusChanged
      ? `${existing.status} → ${input.data.status}`
      : household.familyName,
    actorUserId: input.actorUserId,
    metadata: statusChanged
      ? { from: existing.status, to: input.data.status }
      : null,
  });

  if (input.data.assignedCellLeaderId !== undefined &&
      input.data.assignedCellLeaderId !== existing.assignedCellLeaderId) {
    await logHouseholdActivity({
      organizationId: input.organizationId,
      householdId: household.id,
      type: HouseholdActivityType.CELL_LEADER_ASSIGNED,
      title: "Cell leader assigned",
      actorUserId: input.actorUserId,
      metadata: { leaderId: input.data.assignedCellLeaderId },
    });
  }

  return household;
}

export async function deleteHousehold(input: {
  organizationId: string;
  householdId: string;
  actorUserId: string;
}) {
  const existing = await householdRepository.getById(
    input.organizationId,
    input.householdId
  );
  if (!existing) throw notFound("Household not found");

  await logHouseholdActivity({
    organizationId: input.organizationId,
    householdId: input.householdId,
    type: HouseholdActivityType.STATUS_CHANGED,
    title: "Household archived",
    actorUserId: input.actorUserId,
  });

  await householdRepository.softDelete(input.organizationId, input.householdId);
}

export async function addMemberToHousehold(input: {
  organizationId: string;
  householdId: string;
  memberId: string;
  relation: FamilyRelation;
  isPrimary?: boolean;
  actorUserId: string;
}) {
  await requireHouseholdInOrg(input.organizationId, input.householdId);
  await requireMemberInOrg(input.organizationId, input.memberId);
  const membership = await householdRepository.addMember({
    organizationId: input.organizationId,
    householdId: input.householdId,
    memberId: input.memberId,
    relation: input.relation,
    isPrimary: input.isPrimary,
  });

  await logHouseholdActivity({
    organizationId: input.organizationId,
    householdId: input.householdId,
    type: HouseholdActivityType.MEMBER_ADDED,
    title: "Member added",
    actorUserId: input.actorUserId,
    metadata: { memberId: input.memberId, relation: input.relation },
  });

  await activityRepository.create({
    organizationId: input.organizationId,
    memberId: input.memberId,
    type: ActivityType.FAMILY_LINKED,
    title: "Family linked",
    actorUserId: input.actorUserId,
    metadata: { householdId: input.householdId },
  });

  await refreshHouseholdEngagement(input.organizationId, input.householdId);
  return membership;
}

export async function removeMemberFromHousehold(input: {
  organizationId: string;
  householdId: string;
  memberId: string;
  actorUserId: string;
}) {
  await householdRepository.removeMember(
    input.organizationId,
    input.householdId,
    input.memberId
  );

  await logHouseholdActivity({
    organizationId: input.organizationId,
    householdId: input.householdId,
    type: HouseholdActivityType.MEMBER_REMOVED,
    title: "Member removed",
    actorUserId: input.actorUserId,
    metadata: { memberId: input.memberId },
  });

  await refreshHouseholdEngagement(input.organizationId, input.householdId);
}

export async function moveMemberBetweenHouseholds(input: {
  organizationId: string;
  memberId: string;
  fromHouseholdId: string;
  toHouseholdId: string;
  relation?: FamilyRelation;
  actorUserId: string;
}) {
  await householdRepository.moveMember({
    organizationId: input.organizationId,
    memberId: input.memberId,
    fromHouseholdId: input.fromHouseholdId,
    toHouseholdId: input.toHouseholdId,
    relation: input.relation,
  });

  await Promise.all([
    logHouseholdActivity({
      organizationId: input.organizationId,
      householdId: input.fromHouseholdId,
      type: HouseholdActivityType.MEMBER_MOVED,
      title: "Member moved out",
      actorUserId: input.actorUserId,
      metadata: { memberId: input.memberId, toHouseholdId: input.toHouseholdId },
    }),
    logHouseholdActivity({
      organizationId: input.organizationId,
      householdId: input.toHouseholdId,
      type: HouseholdActivityType.MEMBER_ADDED,
      title: "Member moved in",
      actorUserId: input.actorUserId,
      metadata: { memberId: input.memberId, fromHouseholdId: input.fromHouseholdId },
    }),
    activityRepository.create({
      organizationId: input.organizationId,
      memberId: input.memberId,
      type: ActivityType.FAMILY_LINKED,
      title: "Family moved",
      actorUserId: input.actorUserId,
      metadata: {
        fromHouseholdId: input.fromHouseholdId,
        toHouseholdId: input.toHouseholdId,
      },
    }),
  ]);

  await Promise.all([
    refreshHouseholdEngagement(input.organizationId, input.fromHouseholdId),
    refreshHouseholdEngagement(input.organizationId, input.toHouseholdId),
  ]);
}

export async function assignRelation(input: {
  organizationId: string;
  householdId: string;
  memberId: string;
  relation: FamilyRelation;
  actorUserId: string;
}) {
  await householdRepository.setRelation(
    input.organizationId,
    input.householdId,
    input.memberId,
    input.relation
  );

  await logHouseholdActivity({
    organizationId: input.organizationId,
    householdId: input.householdId,
    type: HouseholdActivityType.RELATION_CHANGED,
    title: "Relation changed",
    actorUserId: input.actorUserId,
    metadata: { memberId: input.memberId, relation: input.relation },
  });
}

export async function changeHouseholdHead(input: {
  organizationId: string;
  householdId: string;
  memberId: string;
  actorUserId: string;
}) {
  await householdRepository.setHead(
    input.organizationId,
    input.householdId,
    input.memberId
  );

  await logHouseholdActivity({
    organizationId: input.organizationId,
    householdId: input.householdId,
    type: HouseholdActivityType.HEAD_CHANGED,
    title: "Head of household changed",
    actorUserId: input.actorUserId,
    metadata: { memberId: input.memberId },
  });
}

export async function mergeHouseholds(input: {
  organizationId: string;
  sourceId: string;
  targetId: string;
  actorUserId: string;
}) {
  const merged = await householdRepository.merge(
    input.organizationId,
    input.sourceId,
    input.targetId
  );

  await Promise.all([
    logHouseholdActivity({
      organizationId: input.organizationId,
      householdId: input.targetId,
      type: HouseholdActivityType.MERGED,
      title: "Households merged",
      description: `Merged into ${merged.familyName}`,
      actorUserId: input.actorUserId,
      metadata: { sourceId: input.sourceId, targetId: input.targetId },
    }),
    logHouseholdActivity({
      organizationId: input.organizationId,
      householdId: input.sourceId,
      type: HouseholdActivityType.MERGED,
      title: "Household merged away",
      actorUserId: input.actorUserId,
      metadata: { targetId: input.targetId },
    }),
  ]);

  await refreshHouseholdEngagement(input.organizationId, input.targetId);
  return merged;
}

export async function splitHousehold(input: {
  organizationId: string;
  sourceHouseholdId: string;
  memberIds: string[];
  newFamilyName: string;
  actorUserId: string;
}) {
  const result = await householdRepository.split({
    organizationId: input.organizationId,
    sourceHouseholdId: input.sourceHouseholdId,
    memberIds: input.memberIds,
    newFamilyName: input.newFamilyName,
  });

  await Promise.all([
    logHouseholdActivity({
      organizationId: input.organizationId,
      householdId: input.sourceHouseholdId,
      type: HouseholdActivityType.SPLIT,
      title: "Household split",
      actorUserId: input.actorUserId,
      metadata: {
        newHouseholdId: result.newHousehold.id,
        memberIds: input.memberIds,
      },
    }),
    logHouseholdActivity({
      organizationId: input.organizationId,
      householdId: result.newHousehold.id,
      type: HouseholdActivityType.CREATED,
      title: "Household created from split",
      actorUserId: input.actorUserId,
      metadata: { sourceHouseholdId: input.sourceHouseholdId },
    }),
    ...input.memberIds.map((memberId) =>
      activityRepository.create({
        organizationId: input.organizationId,
        memberId,
        type: ActivityType.FAMILY_LINKED,
        title: "Family split",
        actorUserId: input.actorUserId,
        metadata: { newHouseholdId: result.newHousehold.id },
      })
    ),
  ]);

  await Promise.all([
    refreshHouseholdEngagement(input.organizationId, input.sourceHouseholdId),
    refreshHouseholdEngagement(input.organizationId, result.newHousehold.id),
  ]);

  return result;
}

export async function logHouseholdQuickAction(input: {
  organizationId: string;
  householdId: string;
  actorUserId: string;
  action: "email" | "whatsapp" | "visit" | "prayer" | "homeVisit";
  detail?: string;
}) {
  await requireHouseholdInOrg(input.organizationId, input.householdId);
  const map = {
    email: {
      type: HouseholdActivityType.EMAIL_SENT,
      memberType: ActivityType.EMAIL_SENT,
      title: "Email sent",
    },
    whatsapp: {
      type: HouseholdActivityType.WHATSAPP_SENT,
      memberType: ActivityType.WHATSAPP_SENT,
      title: "WhatsApp message",
    },
    visit: {
      type: HouseholdActivityType.VISITED,
      memberType: ActivityType.VISITED,
      title: "Visit logged",
    },
    prayer: {
      type: HouseholdActivityType.PRAYER_REQUESTED,
      memberType: ActivityType.PRAYER_REQUESTED,
      title: "Prayer requested",
    },
    homeVisit: {
      type: HouseholdActivityType.HOME_VISIT_SCHEDULED,
      memberType: ActivityType.VISITED,
      title: "Home visit scheduled",
    },
  } as const;

  const cfg = map[input.action];

  await logHouseholdActivity({
    organizationId: input.organizationId,
    householdId: input.householdId,
    type: cfg.type,
    title: cfg.title,
    description: input.detail ?? null,
    actorUserId: input.actorUserId,
  });

  const memberIds = await householdRepository.getMemberIds(
    input.organizationId,
    input.householdId
  );
  await Promise.all(
    memberIds.map((memberId) =>
      activityRepository.create({
        organizationId: input.organizationId,
        memberId,
        type: cfg.memberType,
        title: cfg.title,
        description: input.detail ?? null,
        actorUserId: input.actorUserId,
      })
    )
  );

  await refreshHouseholdEngagement(input.organizationId, input.householdId);
}

export async function addHouseholdNote(input: {
  organizationId: string;
  householdId: string;
  authorUserId: string;
  role: Role;
  visibility: NoteVisibility;
  body: string;
}) {
  await requireHouseholdInOrg(input.organizationId, input.householdId);
  if (!canWriteNoteVisibility(input.role, input.visibility)) {
    throw forbidden("You cannot write notes at this visibility");
  }

  const note = await householdNoteRepository.create({
    organizationId: input.organizationId,
    householdId: input.householdId,
    authorUserId: input.authorUserId,
    visibility: input.visibility,
    body: input.body,
  });

  await logHouseholdActivity({
    organizationId: input.organizationId,
    householdId: input.householdId,
    type: HouseholdActivityType.NOTE_ADDED,
    title: "Note added",
    description: `${input.visibility.toLowerCase()} note`,
    actorUserId: input.authorUserId,
  });

  return note;
}

export async function uploadHouseholdDocument(input: {
  organizationId: string;
  householdId: string;
  actorUserId: string;
  type: DocumentType;
  name: string;
  mimeType: string;
  sizeBytes: number;
  storageKey: string;
  url?: string | null;
}) {
  await requireHouseholdInOrg(input.organizationId, input.householdId);
  const doc = await householdDocumentRepository.create({
    ...input,
    uploadedById: input.actorUserId,
  });

  await logHouseholdActivity({
    organizationId: input.organizationId,
    householdId: input.householdId,
    type: HouseholdActivityType.DOCUMENT_UPLOADED,
    title: "Document uploaded",
    description: input.name,
    actorUserId: input.actorUserId,
    metadata: { type: input.type },
  });

  return doc;
}

export async function refreshHouseholdEngagement(
  organizationId: string,
  householdId: string
) {
  const memberIds = await householdRepository.getMemberIds(
    organizationId,
    householdId
  );
  const analytics = await householdAnalyticsBuilder.build(
    organizationId,
    memberIds,
    0
  );

  const attendanceScore = Math.min(
    100,
    analytics.attendanceTrend.reduce((sum, m) => sum + m.count, 0) * 4
  );
  const givingScore = analytics.givingTrend.some((m) => m.amountCents > 0)
    ? 20
    : 0;
  const volunteerScore = Math.min(30, analytics.volunteerCount * 10);
  const prayerPenalty = analytics.openPrayers > 0 ? 5 : 0;
  const memberBonus = Math.min(20, memberIds.length * 5);

  const engagementScore = Math.max(
    0,
    Math.min(100, attendanceScore + givingScore + volunteerScore + memberBonus - prayerPenalty)
  );

  await householdRepository.updateEngagement(
    organizationId,
    householdId,
    engagementScore
  );

  return engagementScore;
}

export async function exportHouseholdsCsv(input: {
  organizationId: string;
  filter?: HouseholdFilterDefinition;
}) {
  const rows = await householdRepository.listForExport(
    input.organizationId,
    input.filter
  );
  const header = [
    "familyName",
    "householdCode",
    "status",
    "memberCount",
    "headName",
    "city",
    "state",
    "cellGroup",
    "engagementScore",
  ];
  const lines = [
    header.join(","),
    ...rows.map((r) =>
      [
        r.familyName,
        r.householdCode,
        r.status,
        String(r.memberCount),
        r.headName ?? "",
        r.city ?? "",
        r.state ?? "",
        r.cellGroup ?? "",
        String(r.engagementScore),
      ]
        .map(csvEscape)
        .join(",")
    ),
  ];
  return lines.join("\n");
}

export type CsvHouseholdRow = {
  familyName: string;
  householdCode?: string;
  status?: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  cellGroup?: string;
};

export async function importHouseholdsCsv(input: {
  organizationId: string;
  actorUserId: string;
  rows: CsvHouseholdRow[];
}) {
  if (input.rows.length > MAX_CSV_IMPORT_ROWS) {
    throw new AppError(
      `CSV import is limited to ${MAX_CSV_IMPORT_ROWS} rows per upload`,
      "VALIDATION",
      400
    );
  }
  let created = 0;

  for (const row of input.rows) {
    if (!row.familyName?.trim()) continue;

    const status = parseHouseholdStatus(row.status);
    const household = await householdRepository.create({
      organizationId: input.organizationId,
      familyName: row.familyName.trim(),
      householdCode: row.householdCode?.trim() || undefined,
      addressLine1: row.addressLine1?.trim() || null,
      city: row.city?.trim() || null,
      state: row.state?.trim() || null,
      postalCode: row.postalCode?.trim() || null,
      country: row.country?.trim() || null,
      cellGroup: row.cellGroup?.trim() || null,
      status,
    });

    await logHouseholdActivity({
      organizationId: input.organizationId,
      householdId: household.id,
      type: HouseholdActivityType.IMPORTED,
      title: "Imported from CSV",
      actorUserId: input.actorUserId,
    });

    created += 1;
  }

  return { created };
}

export async function listHouseholdSavedFilters(
  organizationId: string,
  userId: string
) {
  return householdSavedFilterRepository.list(organizationId, userId);
}

export async function saveHouseholdFilter(input: {
  organizationId: string;
  userId: string;
  name: string;
  definition: HouseholdFilterDefinition;
}) {
  return householdSavedFilterRepository.create(input);
}

export async function deleteHouseholdSavedFilter(input: {
  organizationId: string;
  userId: string;
  id: string;
}) {
  return householdSavedFilterRepository.delete(
    input.organizationId,
    input.userId,
    input.id
  );
}

export async function getHouseholdListPreferences(
  organizationId: string,
  userId: string
) {
  return householdListPreferenceRepository.get(organizationId, userId);
}

export async function saveHouseholdListPreferences(input: {
  organizationId: string;
  userId: string;
  columns: HouseholdListColumn[];
  density: string;
  viewMode: string;
}) {
  return householdListPreferenceRepository.upsert(input);
}

function csvEscape(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}

function parseHouseholdStatus(raw?: string): HouseholdStatus {
  if (!raw) return HouseholdStatus.ACTIVE;
  const key = raw.trim().toUpperCase();
  return (Object.values(HouseholdStatus) as string[]).includes(key)
    ? (key as HouseholdStatus)
    : HouseholdStatus.ACTIVE;
}

export type { HouseholdProfile };
