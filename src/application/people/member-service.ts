import { generateMemberInsights } from "@/application/people/ai-insights";
import type {
  CreateMemberInput,
  ListMembersQuery,
  UpdateMemberInput,
} from "@/application/ports/member-repositories";
import type { MemberFilterDefinition, MemberProfile } from "@/domain/entities/member";
import {
  ActivityType,
  AttendanceMethod,
  DocumentType,
  FamilyRelation,
  MemberStatus,
  NoteVisibility,
  type MemberLifecycle,
} from "@/domain/enums/member";
import { canWriteNoteVisibility, noteVisibilitiesForRole } from "@/domain/permissions/notes";
import type { Role } from "@/domain/enums/role";
import { forbidden, notFound, AppError } from "@/server/errors";
import { requireMemberInOrg } from "@/server/tenant/scope";
import {
  activityRepository,
  attendanceRepository,
  documentRepository,
  familyRepository,
  listPreferenceRepository,
  memberRepository,
  noteRepository,
  prayerRepository,
  savedFilterRepository,
  tagRepository,
  volunteerRepository,
} from "@/infrastructure/repositories";
import { slugify } from "@/lib/slug";

const MAX_CSV_IMPORT_ROWS = 1000;

export async function ensureOrgTags(organizationId: string) {
  return tagRepository.ensureDefaults(organizationId);
}

export async function listMembers(query: ListMembersQuery) {
  return memberRepository.list(query);
}

export async function getMemberProfile(input: {
  organizationId: string;
  memberId: string;
  role: Role;
}) {
  const visibilities = noteVisibilitiesForRole(input.role);
  const profile = await memberRepository.getProfile(
    input.organizationId,
    input.memberId,
    visibilities
  );
  if (!profile) throw notFound("Member not found");
  return profile;
}

export async function createMember(
  input: CreateMemberInput & { actorUserId: string }
) {
  const member = await memberRepository.create(input);
  await activityRepository.create({
    organizationId: input.organizationId,
    memberId: member.id,
    type: ActivityType.CREATED,
    title: "Member created",
    description: `${member.firstName} ${member.lastName} added to the directory`,
    actorUserId: input.actorUserId,
  });
  await refreshMemberInsights(input.organizationId, member.id);
  return member;
}

export async function updateMember(input: {
  organizationId: string;
  memberId: string;
  actorUserId: string;
  data: UpdateMemberInput;
}) {
  const existing = await memberRepository.getById(
    input.organizationId,
    input.memberId
  );
  if (!existing) throw notFound("Member not found");

  const member = await memberRepository.update(
    input.organizationId,
    input.memberId,
    input.data
  );

  const statusChanged =
    input.data.status && input.data.status !== existing.status;

  await activityRepository.create({
    organizationId: input.organizationId,
    memberId: member.id,
    type: statusChanged ? ActivityType.STATUS_CHANGED : ActivityType.EDITED,
    title: statusChanged ? "Status changed" : "Profile updated",
    description: statusChanged
      ? `${existing.status} → ${input.data.status}`
      : "Member profile fields were edited",
    actorUserId: input.actorUserId,
    metadata: statusChanged
      ? { from: existing.status, to: input.data.status }
      : null,
  });

  if (input.data.assignedLeaderId && input.data.assignedLeaderId !== existing.assignedLeaderId) {
    await activityRepository.create({
      organizationId: input.organizationId,
      memberId: member.id,
      type: ActivityType.LEADER_ASSIGNED,
      title: "Leader assigned",
      actorUserId: input.actorUserId,
      metadata: { leaderId: input.data.assignedLeaderId },
    });
  }

  if (input.data.baptismDate && !existing.baptismDate) {
    await activityRepository.create({
      organizationId: input.organizationId,
      memberId: member.id,
      type: ActivityType.BAPTIZED,
      title: "Baptized",
      occurredAt: input.data.baptismDate,
      actorUserId: input.actorUserId,
    });
  }

  await refreshMemberInsights(input.organizationId, member.id);
  return member;
}

export async function softDeleteMember(input: {
  organizationId: string;
  memberId: string;
  actorUserId: string;
}) {
  await memberRepository.softDelete(input.organizationId, input.memberId);
  await activityRepository.create({
    organizationId: input.organizationId,
    memberId: input.memberId,
    type: ActivityType.EDITED,
    title: "Member archived",
    actorUserId: input.actorUserId,
  });
}

export async function bulkMemberAction(input: {
  organizationId: string;
  actorUserId: string;
  ids: string[];
  action:
    | { type: "status"; status: MemberStatus }
    | { type: "assignLeader"; leaderId: string | null }
    | { type: "addTag"; tagId: string }
    | { type: "delete" };
}) {
  const { organizationId, ids, actorUserId } = input;
  if (ids.length === 0) return { affected: 0 };

  switch (input.action.type) {
    case "status": {
      const affected = await memberRepository.bulkUpdateStatus(
        organizationId,
        ids,
        input.action.status
      );
      await Promise.all(
        ids.map((memberId) =>
          activityRepository.create({
            organizationId,
            memberId,
            type: ActivityType.STATUS_CHANGED,
            title: "Bulk status update",
            description: `Status set to ${input.action.type === "status" ? input.action.status : ""}`,
            actorUserId,
          })
        )
      );
      return { affected };
    }
    case "assignLeader": {
      const affected = await memberRepository.bulkAssignLeader(
        organizationId,
        ids,
        input.action.leaderId
      );
      await Promise.all(
        ids.map((memberId) =>
          activityRepository.create({
            organizationId,
            memberId,
            type: ActivityType.LEADER_ASSIGNED,
            title: "Leader assigned (bulk)",
            actorUserId,
            metadata: { leaderId: input.action.type === "assignLeader" ? input.action.leaderId : null },
          })
        )
      );
      return { affected };
    }
    case "addTag": {
      const affected = await memberRepository.bulkAddTag(
        organizationId,
        ids,
        input.action.tagId
      );
      await Promise.all(
        ids.map((memberId) =>
          activityRepository.create({
            organizationId,
            memberId,
            type: ActivityType.TAG_ADDED,
            title: "Tag added (bulk)",
            actorUserId,
            metadata: { tagId: input.action.type === "addTag" ? input.action.tagId : null },
          })
        )
      );
      return { affected };
    }
    case "delete": {
      await Promise.all(
        ids.map((id) => memberRepository.softDelete(organizationId, id))
      );
      return { affected: ids.length };
    }
  }
}

export async function addMemberNote(input: {
  organizationId: string;
  memberId: string;
  authorUserId: string;
  role: Role;
  visibility: NoteVisibility;
  body: string;
}) {
  await requireMemberInOrg(input.organizationId, input.memberId);
  if (!canWriteNoteVisibility(input.role, input.visibility)) {
    throw forbidden("You cannot write notes at this visibility");
  }
  const note = await noteRepository.create({
    organizationId: input.organizationId,
    memberId: input.memberId,
    authorUserId: input.authorUserId,
    visibility: input.visibility,
    body: input.body,
  });
  await activityRepository.create({
    organizationId: input.organizationId,
    memberId: input.memberId,
    type: ActivityType.NOTE_ADDED,
    title: "Note added",
    description: `${input.visibility.toLowerCase()} note`,
    actorUserId: input.authorUserId,
  });
  return note;
}

export async function uploadMemberDocument(input: {
  organizationId: string;
  memberId: string;
  actorUserId: string;
  type: DocumentType;
  name: string;
  mimeType: string;
  sizeBytes: number;
  storageKey: string;
  url?: string | null;
}) {
  await requireMemberInOrg(input.organizationId, input.memberId);
  const doc = await documentRepository.create({
    ...input,
    uploadedById: input.actorUserId,
  });
  await activityRepository.create({
    organizationId: input.organizationId,
    memberId: input.memberId,
    type: ActivityType.DOCUMENT_UPLOADED,
    title: "Document uploaded",
    description: input.name,
    actorUserId: input.actorUserId,
    metadata: { type: input.type },
  });
  return doc;
}

export async function logQuickAction(input: {
  organizationId: string;
  memberId: string;
  actorUserId: string;
  action: "email" | "call" | "whatsapp" | "visit" | "foundation";
  detail?: string;
}) {
  await requireMemberInOrg(input.organizationId, input.memberId);
  const map = {
    email: {
      type: ActivityType.EMAIL_SENT,
      title: "Email sent",
    },
    call: {
      type: ActivityType.CALL_LOGGED,
      title: "Call logged",
    },
    whatsapp: {
      type: ActivityType.WHATSAPP_SENT,
      title: "WhatsApp message",
    },
    visit: {
      type: ActivityType.VISITED,
      title: "Visit scheduled / logged",
    },
    foundation: {
      type: ActivityType.FOUNDATION_COURSE_COMPLETED,
      title: "Foundation course completed",
    },
  } as const;

  const cfg = map[input.action];
  await activityRepository.create({
    organizationId: input.organizationId,
    memberId: input.memberId,
    type: cfg.type,
    title: cfg.title,
    description: input.detail ?? null,
    actorUserId: input.actorUserId,
  });
  await refreshMemberInsights(input.organizationId, input.memberId);
}

export async function recordAttendance(input: {
  organizationId: string;
  memberId: string;
  actorUserId?: string | null;
  eventName: string;
  attendedAt?: Date;
  method?: AttendanceMethod;
}) {
  await requireMemberInOrg(input.organizationId, input.memberId);
  await attendanceRepository.create({
    organizationId: input.organizationId,
    memberId: input.memberId,
    eventName: input.eventName,
    attendedAt: input.attendedAt ?? new Date(),
    method: input.method ?? AttendanceMethod.MANUAL,
  });
  await activityRepository.create({
    organizationId: input.organizationId,
    memberId: input.memberId,
    type: ActivityType.ATTENDED,
    title: "Attended",
    description: input.eventName,
    actorUserId: input.actorUserId ?? null,
    occurredAt: input.attendedAt ?? new Date(),
  });
  await refreshMemberInsights(
    input.organizationId,
    input.memberId
  );
}

export async function checkInByQr(input: {
  organizationId: string;
  qrToken: string;
  eventName: string;
  actorUserId?: string | null;
}) {
  const member = await memberRepository.findByQrToken(
    input.organizationId,
    input.qrToken
  );
  if (!member) throw notFound("Invalid QR code");
  await recordAttendance({
    organizationId: input.organizationId,
    memberId: member.id,
    actorUserId: input.actorUserId,
    eventName: input.eventName,
    method: AttendanceMethod.QR,
  });
  return member;
}

export async function createPrayerRequest(input: {
  organizationId: string;
  memberId: string;
  actorUserId: string;
  request: string;
}) {
  await requireMemberInOrg(input.organizationId, input.memberId);
  const prayer = await prayerRepository.create(input);
  await activityRepository.create({
    organizationId: input.organizationId,
    memberId: input.memberId,
    type: ActivityType.PRAYER_REQUESTED,
    title: "Prayer requested",
    description: input.request.slice(0, 160),
    actorUserId: input.actorUserId,
  });
  await refreshMemberInsights(input.organizationId, input.memberId);
  return prayer;
}

export async function addVolunteerRole(input: {
  organizationId: string;
  memberId: string;
  actorUserId: string;
  roleName: string;
  team?: string | null;
}) {
  await requireMemberInOrg(input.organizationId, input.memberId);
  const role = await volunteerRepository.create(input);
  await activityRepository.create({
    organizationId: input.organizationId,
    memberId: input.memberId,
    type: ActivityType.VOLUNTEER_JOINED,
    title: "Volunteer joined",
    description: input.roleName,
    actorUserId: input.actorUserId,
  });
  await refreshMemberInsights(input.organizationId, input.memberId);
  return role;
}

export async function linkFamily(input: {
  organizationId: string;
  memberId: string;
  actorUserId: string;
  name: string;
  relation: FamilyRelation;
  addressLine1?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
  emergencyName?: string | null;
  emergencyPhone?: string | null;
  relatedMemberId?: string | null;
  relatedRelation?: FamilyRelation;
}) {
  await requireMemberInOrg(input.organizationId, input.memberId);
  if (input.relatedMemberId) {
    await requireMemberInOrg(input.organizationId, input.relatedMemberId);
  }
  const family = await familyRepository.upsertHousehold({
    organizationId: input.organizationId,
    memberId: input.memberId,
    name: input.name,
    relation: input.relation,
    isPrimary: input.relation === FamilyRelation.HEAD,
    addressLine1: input.addressLine1,
    city: input.city,
    state: input.state,
    postalCode: input.postalCode,
    country: input.country,
    emergencyName: input.emergencyName,
    emergencyPhone: input.emergencyPhone,
  });

  if (input.relatedMemberId && family.household) {
    await familyRepository.linkMember({
      householdId: family.household.id,
      memberId: input.relatedMemberId,
      relation: input.relatedRelation ?? FamilyRelation.OTHER,
    });
  }

  await activityRepository.create({
    organizationId: input.organizationId,
    memberId: input.memberId,
    type: ActivityType.FAMILY_LINKED,
    title: "Family linked",
    description: input.name,
    actorUserId: input.actorUserId,
  });

  return family;
}

export async function refreshMemberInsights(
  organizationId: string,
  memberId: string
) {
  const profile = await memberRepository.getProfile(
    organizationId,
    memberId,
    Object.values(NoteVisibility)
  );
  if (!profile) return null;

  const lastActivity = profile.activities[0]?.occurredAt ?? null;
  const insights = generateMemberInsights({
    member: profile,
    analytics: {
      ...profile.analytics,
      engagementScore: profile.engagementScore,
      growthScore: profile.growthScore,
      riskScore: profile.riskScore,
    },
    tagNames: profile.tags.map((t) => t.name),
    openPrayers: profile.analytics.openPrayers,
    lastActivityAt: lastActivity,
  });

  const engagementScore = Math.max(
    0,
    Math.min(
      100,
      profile.analytics.attendanceCount90d * 12 +
        (profile.analytics.givingTotalCents90d > 0 ? 15 : 0) +
        profile.analytics.activeVolunteerRoles * 18 -
        (insights.riskScore > 60 ? 15 : 0)
    )
  );

  const growthScore = Math.max(
    0,
    Math.min(
      100,
      (profile.baptismDate ? 25 : 0) +
        profile.analytics.activeVolunteerRoles * 15 +
        (profile.analytics.attendanceCount90d >= 6
          ? 25
          : profile.analytics.attendanceCount90d * 4) +
        (profile.tags.some((t) => t.slug === "new-member") ? 10 : 5)
    )
  );

  await memberRepository.updateScores(organizationId, memberId, {
    engagementScore,
    growthScore,
    riskScore: insights.riskScore,
    aiSummary: insights.summary,
    aiInsights: insights,
  });

  return insights;
}

export async function exportMembersCsv(input: {
  organizationId: string;
  filter?: MemberFilterDefinition;
}) {
  const rows = await memberRepository.listForExport(
    input.organizationId,
    input.filter
  );
  const header = [
    "firstName",
    "lastName",
    "email",
    "phone",
    "whatsapp",
    "status",
    "lifecycle",
    "campus",
    "ministryRole",
    "tags",
    "joinedAt",
    "engagementScore",
    "growthScore",
    "riskScore",
  ];
  const lines = [
    header.join(","),
    ...rows.map((r) =>
      [
        r.firstName,
        r.lastName,
        r.email ?? "",
        r.phone ?? "",
        r.whatsapp ?? "",
        r.status,
        r.lifecycle,
        r.campus ?? "",
        r.ministryRole ?? "",
        r.tags.map((t) => t.name).join("|"),
        r.joinedAt?.toISOString().slice(0, 10) ?? "",
        String(r.engagementScore),
        String(r.growthScore),
        String(r.riskScore),
      ]
        .map(csvEscape)
        .join(",")
    ),
  ];
  return lines.join("\n");
}

export type CsvMemberRow = {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  status?: string;
  campus?: string;
  ministryRole?: string;
  tags?: string;
};

export async function importMembersCsv(input: {
  organizationId: string;
  actorUserId: string;
  rows: CsvMemberRow[];
}) {
  if (input.rows.length > MAX_CSV_IMPORT_ROWS) {
    throw new AppError(
      `CSV import is limited to ${MAX_CSV_IMPORT_ROWS} rows per upload`,
      "VALIDATION",
      400
    );
  }
  let created = 0;
  const tags = await tagRepository.ensureDefaults(input.organizationId);
  const tagBySlug = new Map(tags.map((t) => [t.slug, t]));

  for (const row of input.rows) {
    if (!row.firstName?.trim() || !row.lastName?.trim()) continue;
    const tagIds =
      row.tags
        ?.split(/[|,]/)
        .map((t) => t.trim())
        .filter(Boolean)
        .map((name) => {
          const slug = slugify(name);
          return tagBySlug.get(slug)?.id;
        })
        .filter((id): id is string => Boolean(id)) ?? [];

    const status = parseStatus(row.status);
    const member = await memberRepository.create({
      organizationId: input.organizationId,
      firstName: row.firstName.trim(),
      lastName: row.lastName.trim(),
      email: row.email?.trim() || null,
      phone: row.phone?.trim() || null,
      status,
      campus: row.campus?.trim() || null,
      ministryRole: row.ministryRole?.trim() || null,
      tagIds,
      joinedAt: new Date(),
    });
    await activityRepository.create({
      organizationId: input.organizationId,
      memberId: member.id,
      type: ActivityType.IMPORTED,
      title: "Imported from CSV",
      actorUserId: input.actorUserId,
    });
    created += 1;
  }

  return { created };
}

export async function listSavedFilters(organizationId: string, userId: string) {
  return savedFilterRepository.list(organizationId, userId);
}

export async function saveMemberFilter(input: {
  organizationId: string;
  userId: string;
  name: string;
  definition: MemberFilterDefinition;
}) {
  return savedFilterRepository.create(input);
}

export async function deleteSavedFilter(input: {
  organizationId: string;
  userId: string;
  id: string;
}) {
  return savedFilterRepository.delete(input.organizationId, input.userId, input.id);
}

export async function getListPreferences(organizationId: string, userId: string) {
  return listPreferenceRepository.get(organizationId, userId);
}

export async function saveListPreferences(input: {
  organizationId: string;
  userId: string;
  columns: import("@/domain/entities/member").MemberListColumn[];
  density: string;
  viewMode: string;
}) {
  return listPreferenceRepository.upsert(input);
}

function csvEscape(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}

function parseStatus(raw?: string): MemberStatus {
  if (!raw) return MemberStatus.VISITOR;
  const key = raw.trim().toUpperCase().replace(/\s+/g, "_");
  return (Object.values(MemberStatus) as string[]).includes(key)
    ? (key as MemberStatus)
    : MemberStatus.VISITOR;
}

export type { MemberLifecycle, MemberProfile };
