"use server";

import { z } from "zod";
import {
  addMemberNote,
  addVolunteerRole,
  bulkMemberAction,
  checkInByQr,
  createMember,
  createPrayerRequest,
  deleteSavedFilter,
  ensureOrgTags,
  exportMembersCsv,
  getListPreferences,
  getMemberProfile,
  importMembersCsv,
  linkFamily,
  listMembers,
  listSavedFilters,
  logQuickAction,
  recordAttendance,
  refreshMemberInsights,
  saveListPreferences,
  saveMemberFilter,
  softDeleteMember,
  updateMember,
  uploadMemberDocument,
} from "@/application/people/member-service";
import {
  AttendanceMethod,
  DocumentType,
  FamilyRelation,
  MemberLifecycle,
  MemberStatus,
  NoteVisibility,
} from "@/domain/enums/member";
import { Permission } from "@/domain/permissions/rbac";
import { DEFAULT_MEMBER_COLUMNS, type MemberListColumn } from "@/domain/entities/member";
import {
  requirePermission,
} from "@/server/auth/session";
import { AppError } from "@/server/errors";
import { revalidatePath } from "next/cache";
import { assertRateLimit, RateLimits } from "@/server/security/rate-limit";
import {
  publicDownloadPath,
  storePrivateUpload,
} from "@/server/security/uploads";
import { documentRepository } from "@/infrastructure/repositories";
import { httpUrlSchema } from "@/lib/http-url";

function actionError(error: unknown): { ok: false; error: string } {
  if (error instanceof AppError) {
    return { ok: false, error: error.message };
  }
  if (error instanceof z.ZodError) {
    return { ok: false, error: "Invalid input" };
  }
  console.error("[members action]", error);
  return { ok: false, error: "Something went wrong" };
}

const filterSchema = z.object({
  query: z.string().optional(),
  statuses: z.array(z.nativeEnum(MemberStatus)).optional(),
  tagIds: z.array(z.string()).optional(),
  campus: z.string().optional(),
  lifecycle: z.array(z.nativeEnum(MemberLifecycle)).optional(),
  assignedLeaderId: z.string().nullable().optional(),
  hasEmail: z.boolean().optional(),
  joinedAfter: z.string().optional(),
  joinedBefore: z.string().optional(),
});

export async function listMembersAction(input: {
  cursor?: string | null;
  limit?: number;
  filter?: z.infer<typeof filterSchema>;
  sort?: "name" | "joinedAt" | "engagement" | "updatedAt";
  sortDir?: "asc" | "desc";
}) {
  try {
    const ctx = await requirePermission(Permission.PEOPLE_READ);
    const filter = input.filter ? filterSchema.parse(input.filter) : undefined;
    await ensureOrgTags(ctx.organization.id);
    const result = await listMembers({
      organizationId: ctx.organization.id,
      cursor: input.cursor,
      limit: input.limit ?? 40,
      filter,
      sort: input.sort,
      sortDir: input.sortDir,
    });
    return { ok: true as const, data: result };
  } catch (error) {
    return actionError(error);
  }
}

export async function getMemberProfileAction(memberId: string) {
  try {
    const ctx = await requirePermission(Permission.PEOPLE_READ);
    const profile = await getMemberProfile({
      organizationId: ctx.organization.id,
      memberId,
      role: ctx.role,
    });
    return { ok: true as const, data: profile };
  } catch (error) {
    return actionError(error);
  }
}

export async function createMemberAction(raw: unknown) {
  try {
    const ctx = await requirePermission(Permission.PEOPLE_WRITE);
    const schema = z.object({
      firstName: z.string().min(1).max(80),
      lastName: z.string().min(1).max(80),
      email: z.string().email().optional().or(z.literal("")),
      phone: z.string().max(40).optional(),
      whatsapp: z.string().max(40).optional(),
      status: z.nativeEnum(MemberStatus).optional(),
      lifecycle: z.nativeEnum(MemberLifecycle).optional(),
      campus: z.string().max(80).optional(),
      ministryRole: z.string().max(80).optional(),
      tagIds: z.array(z.string()).optional(),
    });
    const data = schema.parse(raw);
    const member = await createMember({
      organizationId: ctx.organization.id,
      actorUserId: ctx.user.id,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email || null,
      phone: data.phone || null,
      whatsapp: data.whatsapp || null,
      status: data.status,
      lifecycle: data.lifecycle,
      campus: data.campus || null,
      ministryRole: data.ministryRole || null,
      tagIds: data.tagIds,
      joinedAt: new Date(),
    });
    revalidatePath("/people");
    return { ok: true as const, data: member };
  } catch (error) {
    return actionError(error);
  }
}

export async function updateMemberAction(memberId: string, raw: unknown) {
  try {
    const ctx = await requirePermission(Permission.PEOPLE_WRITE);
    const schema = z.object({
      firstName: z.string().min(1).max(80).optional(),
      lastName: z.string().min(1).max(80).optional(),
      email: z.string().email().nullable().optional().or(z.literal("")),
      phone: z.string().max(40).nullable().optional(),
      whatsapp: z.string().max(40).nullable().optional(),
      status: z.nativeEnum(MemberStatus).optional(),
      lifecycle: z.nativeEnum(MemberLifecycle).optional(),
      campus: z.string().max(80).nullable().optional(),
      ministryRole: z.string().max(80).nullable().optional(),
      avatarUrl: httpUrlSchema.nullable().optional(),
      coverUrl: httpUrlSchema.nullable().optional(),
      addressLine1: z.string().nullable().optional(),
      city: z.string().nullable().optional(),
      state: z.string().nullable().optional(),
      postalCode: z.string().nullable().optional(),
      country: z.string().nullable().optional(),
      emergencyName: z.string().nullable().optional(),
      emergencyPhone: z.string().nullable().optional(),
      emergencyRelation: z.string().nullable().optional(),
      assignedLeaderId: z.string().nullable().optional(),
      baptismDate: z.string().datetime().nullable().optional(),
      dateOfBirth: z.string().datetime().nullable().optional(),
      tagIds: z.array(z.string()).optional(),
    });
    const data = schema.parse(raw);
    const { baptismDate, dateOfBirth, email, ...rest } = data;
    const member = await updateMember({
      organizationId: ctx.organization.id,
      memberId,
      actorUserId: ctx.user.id,
      data: {
        ...rest,
        email: email === "" ? null : email,
        baptismDate:
          baptismDate === undefined
            ? undefined
            : baptismDate
              ? new Date(baptismDate)
              : null,
        dateOfBirth:
          dateOfBirth === undefined
            ? undefined
            : dateOfBirth
              ? new Date(dateOfBirth)
              : null,
      },
    });
    revalidatePath("/people");
    revalidatePath(`/people/${memberId}`);
    return { ok: true as const, data: member };
  } catch (error) {
    return actionError(error);
  }
}

export async function deleteMemberAction(memberId: string) {
  try {
    const ctx = await requirePermission(Permission.PEOPLE_WRITE);
    await softDeleteMember({
      organizationId: ctx.organization.id,
      memberId,
      actorUserId: ctx.user.id,
    });
    revalidatePath("/people");
    return { ok: true as const };
  } catch (error) {
    return actionError(error);
  }
}

export async function bulkMembersAction(raw: unknown) {
  try {
    const ctx = await requirePermission(Permission.PEOPLE_WRITE);
    const schema = z.object({
      ids: z.array(z.string()).min(1),
      action: z.discriminatedUnion("type", [
        z.object({
          type: z.literal("status"),
          status: z.nativeEnum(MemberStatus),
        }),
        z.object({
          type: z.literal("assignLeader"),
          leaderId: z.string().nullable(),
        }),
        z.object({
          type: z.literal("addTag"),
          tagId: z.string(),
        }),
        z.object({ type: z.literal("delete") }),
      ]),
    });
    const data = schema.parse(raw);
    const result = await bulkMemberAction({
      organizationId: ctx.organization.id,
      actorUserId: ctx.user.id,
      ids: data.ids,
      action: data.action,
    });
    revalidatePath("/people");
    return { ok: true as const, data: result };
  } catch (error) {
    return actionError(error);
  }
}

export async function exportMembersCsvAction(filter?: z.infer<typeof filterSchema>) {
  try {
    const ctx = await requirePermission(Permission.PEOPLE_EXPORT);
    const csv = await exportMembersCsv({
      organizationId: ctx.organization.id,
      filter: filter ? filterSchema.parse(filter) : undefined,
    });
    return { ok: true as const, data: csv };
  } catch (error) {
    return actionError(error);
  }
}

export async function importMembersCsvAction(csvText: string) {
  try {
    const ctx = await requirePermission(Permission.PEOPLE_IMPORT);
    assertRateLimit(`csv:members:${ctx.user.id}`, RateLimits.csvImport);
    const text = z.string().max(2_000_000).parse(csvText);
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) {
      return { ok: false as const, error: "CSV has no data rows" };
    }
    if (lines.length - 1 > 1000) {
      return {
        ok: false as const,
        error: "CSV import is limited to 1000 rows per upload",
      };
    }
    const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
    const rows = lines.slice(1).map((line) => {
      const cols = parseCsvLine(line);
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => {
        obj[h] = cols[i] ?? "";
      });
      return {
        firstName: obj.firstName || obj.FirstName || "",
        lastName: obj.lastName || obj.LastName || "",
        email: obj.email || obj.Email,
        phone: obj.phone || obj.Phone,
        status: obj.status || obj.Status,
        campus: obj.campus || obj.Campus,
        ministryRole: obj.ministryRole || obj.role || obj.Role,
        tags: obj.tags || obj.Tags,
      };
    });
    const result = await importMembersCsv({
      organizationId: ctx.organization.id,
      actorUserId: ctx.user.id,
      rows,
    });
    revalidatePath("/people");
    return { ok: true as const, data: result };
  } catch (error) {
    return actionError(error);
  }
}

export async function addNoteAction(memberId: string, raw: unknown) {
  try {
    const ctx = await requirePermission(Permission.PEOPLE_WRITE);
    const data = z
      .object({
        body: z.string().min(1).max(8000),
        visibility: z.nativeEnum(NoteVisibility),
      })
      .parse(raw);
    const note = await addMemberNote({
      organizationId: ctx.organization.id,
      memberId,
      authorUserId: ctx.user.id,
      role: ctx.role,
      visibility: data.visibility,
      body: data.body,
    });
    revalidatePath(`/people/${memberId}`);
    return { ok: true as const, data: note };
  } catch (error) {
    return actionError(error);
  }
}

export async function uploadDocumentAction(memberId: string, formData: FormData) {
  try {
    const ctx = await requirePermission(Permission.PEOPLE_DOCUMENTS);
    assertRateLimit(`upload:members:${ctx.user.id}`, RateLimits.upload);
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return { ok: false as const, error: "File required" };
    }
    const typeRaw = String(formData.get("type") ?? "OTHER");
    const type = (Object.values(DocumentType) as string[]).includes(typeRaw)
      ? (typeRaw as DocumentType)
      : DocumentType.OTHER;

    const stored = await storePrivateUpload({
      kind: "members",
      organizationId: ctx.organization.id,
      ownerId: memberId,
      file,
    });

    const doc = await uploadMemberDocument({
      organizationId: ctx.organization.id,
      memberId,
      actorUserId: ctx.user.id,
      type,
      name: stored.name,
      mimeType: stored.mimeType,
      sizeBytes: stored.sizeBytes,
      storageKey: stored.storageKey,
      url: null,
    });

    const url = publicDownloadPath("members", doc.id);
    await documentRepository.updateUrl(ctx.organization.id, doc.id, url);

    revalidatePath(`/people/${memberId}`);
    return { ok: true as const, data: { ...doc, url } };
  } catch (error) {
    return actionError(error);
  }
}

export async function quickActionLog(memberId: string, action: "email" | "call" | "whatsapp" | "visit" | "foundation", detail?: string) {
  try {
    const ctx = await requirePermission(Permission.PEOPLE_WRITE);
    const parsed = z
      .object({
        memberId: z.string().min(1),
        action: z.enum(["email", "call", "whatsapp", "visit", "foundation"]),
        detail: z.string().max(500).optional(),
      })
      .parse({ memberId, action, detail });
    await logQuickAction({
      organizationId: ctx.organization.id,
      memberId: parsed.memberId,
      actorUserId: ctx.user.id,
      action: parsed.action,
      detail: parsed.detail,
    });
    revalidatePath(`/people/${parsed.memberId}`);
    return { ok: true as const };
  } catch (error) {
    return actionError(error);
  }
}

export async function recordAttendanceAction(memberId: string, raw: unknown) {
  try {
    const ctx = await requirePermission(Permission.PEOPLE_WRITE);
    const data = z
      .object({
        eventName: z.string().min(1).max(120),
        attendedAt: z.string().datetime().optional(),
        method: z.nativeEnum(AttendanceMethod).optional(),
      })
      .parse(raw);
    await recordAttendance({
      organizationId: ctx.organization.id,
      memberId,
      actorUserId: ctx.user.id,
      eventName: data.eventName,
      attendedAt: data.attendedAt ? new Date(data.attendedAt) : undefined,
      method: data.method,
    });
    revalidatePath(`/people/${memberId}`);
    return { ok: true as const };
  } catch (error) {
    return actionError(error);
  }
}

export async function qrCheckInAction(qrToken: string, eventName: string) {
  try {
    const ctx = await requirePermission(Permission.PEOPLE_WRITE);
    assertRateLimit(`checkin:people:${ctx.user.id}`, RateLimits.checkIn);
    const parsed = z
      .object({
        qrToken: z.string().min(1).max(120),
        eventName: z.string().min(1).max(120),
      })
      .parse({ qrToken, eventName });
    const member = await checkInByQr({
      organizationId: ctx.organization.id,
      qrToken: parsed.qrToken,
      eventName: parsed.eventName,
      actorUserId: ctx.user.id,
    });
    revalidatePath(`/people/${member.id}`);
    return { ok: true as const, data: { memberId: member.id } };
  } catch (error) {
    return actionError(error);
  }
}

export async function createPrayerAction(memberId: string, request: string) {
  try {
    const ctx = await requirePermission(Permission.PEOPLE_WRITE);
    const prayer = await createPrayerRequest({
      organizationId: ctx.organization.id,
      memberId,
      actorUserId: ctx.user.id,
      request: z.string().min(1).max(2000).parse(request),
    });
    revalidatePath(`/people/${memberId}`);
    return { ok: true as const, data: prayer };
  } catch (error) {
    return actionError(error);
  }
}

export async function addVolunteerAction(memberId: string, raw: unknown) {
  try {
    const ctx = await requirePermission(Permission.PEOPLE_WRITE);
    const data = z
      .object({
        roleName: z.string().min(1).max(120),
        team: z.string().max(120).optional(),
      })
      .parse(raw);
    const role = await addVolunteerRole({
      organizationId: ctx.organization.id,
      memberId,
      actorUserId: ctx.user.id,
      roleName: data.roleName,
      team: data.team,
    });
    revalidatePath(`/people/${memberId}`);
    return { ok: true as const, data: role };
  } catch (error) {
    return actionError(error);
  }
}

export async function linkFamilyAction(memberId: string, raw: unknown) {
  try {
    const ctx = await requirePermission(Permission.PEOPLE_WRITE);
    const data = z
      .object({
        name: z.string().min(1).max(120),
        relation: z.nativeEnum(FamilyRelation),
        addressLine1: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        postalCode: z.string().optional(),
        country: z.string().optional(),
        emergencyName: z.string().optional(),
        emergencyPhone: z.string().optional(),
        relatedMemberId: z.string().optional(),
        relatedRelation: z.nativeEnum(FamilyRelation).optional(),
      })
      .parse(raw);
    const family = await linkFamily({
      organizationId: ctx.organization.id,
      memberId,
      actorUserId: ctx.user.id,
      ...data,
    });
    revalidatePath(`/people/${memberId}`);
    return { ok: true as const, data: family };
  } catch (error) {
    return actionError(error);
  }
}

export async function regenerateInsightsAction(memberId: string) {
  try {
    const ctx = await requirePermission(Permission.PEOPLE_READ);
    const insights = await refreshMemberInsights(
      ctx.organization.id,
      memberId
    );
    revalidatePath(`/people/${memberId}`);
    return { ok: true as const, data: insights };
  } catch (error) {
    return actionError(error);
  }
}

export async function listTagsAction() {
  try {
    const ctx = await requirePermission(Permission.PEOPLE_READ);
    const tags = await ensureOrgTags(ctx.organization.id);
    return { ok: true as const, data: tags };
  } catch (error) {
    return actionError(error);
  }
}

export async function listSavedFiltersAction() {
  try {
    const ctx = await requirePermission(Permission.PEOPLE_READ);
    const filters = await listSavedFilters(ctx.organization.id, ctx.user.id);
    return { ok: true as const, data: filters };
  } catch (error) {
    return actionError(error);
  }
}

export async function saveFilterAction(name: string, definition: z.infer<typeof filterSchema>) {
  try {
    const ctx = await requirePermission(Permission.PEOPLE_READ);
    const filter = await saveMemberFilter({
      organizationId: ctx.organization.id,
      userId: ctx.user.id,
      name: z.string().min(1).max(80).parse(name),
      definition: filterSchema.parse(definition),
    });
    return { ok: true as const, data: filter };
  } catch (error) {
    return actionError(error);
  }
}

export async function deleteFilterAction(id: string) {
  try {
    const ctx = await requirePermission(Permission.PEOPLE_READ);
    await deleteSavedFilter({
      organizationId: ctx.organization.id,
      userId: ctx.user.id,
      id: z.string().min(1).parse(id),
    });
    return { ok: true as const };
  } catch (error) {
    return actionError(error);
  }
}

export async function getPreferencesAction() {
  try {
    const ctx = await requirePermission(Permission.PEOPLE_READ);
    const prefs = await getListPreferences(ctx.organization.id, ctx.user.id);
    return {
      ok: true as const,
      data: prefs ?? {
        columns: DEFAULT_MEMBER_COLUMNS,
        density: "comfortable",
        viewMode: "table",
      },
    };
  } catch (error) {
    return actionError(error);
  }
}

export async function savePreferencesAction(raw: unknown) {
  try {
    const ctx = await requirePermission(Permission.PEOPLE_READ);
    const data = z
      .object({
        columns: z.array(z.string()).min(1),
        density: z.enum(["compact", "comfortable", "spacious"]),
        viewMode: z.enum(["table", "grid", "card", "compact"]),
      })
      .parse(raw);
    await saveListPreferences({
      organizationId: ctx.organization.id,
      userId: ctx.user.id,
      columns: data.columns as MemberListColumn[],
      density: data.density,
      viewMode: data.viewMode,
    });
    return { ok: true as const };
  } catch (error) {
    return actionError(error);
  }
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result.map((s) => s.trim());
}
