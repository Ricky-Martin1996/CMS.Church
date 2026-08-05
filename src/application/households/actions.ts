"use server";

import {
  addHouseholdNote,
  addMemberToHousehold,
  assignRelation,
  changeHouseholdHead,
  createHousehold,
  deleteHousehold,
  deleteHouseholdSavedFilter,
  exportHouseholdsCsv,
  getHouseholdListPreferences,
  getHouseholdProfile,
  importHouseholdsCsv,
  listHouseholdSavedFilters,
  listHouseholds,
  logHouseholdQuickAction,
  mergeHouseholds,
  moveMemberBetweenHouseholds,
  refreshHouseholdEngagement,
  removeMemberFromHousehold,
  saveHouseholdFilter,
  saveHouseholdListPreferences,
  splitHousehold,
  updateHousehold,
  uploadHouseholdDocument,
} from "@/application/households/household-service";
import {
  DEFAULT_HOUSEHOLD_COLUMNS,
  type HouseholdListColumn,
} from "@/domain/entities/household";
import {
  DocumentType,
  FamilyRelation,
  HouseholdStatus,
  NoteVisibility,
} from "@/domain/enums/member";
import { Permission } from "@/domain/permissions/rbac";
import {
  requirePermission,
  requireTenantContext,
} from "@/server/auth/session";
import { AppError } from "@/server/errors";
import { revalidatePath } from "next/cache";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { z } from "zod";

function actionError(error: unknown): { ok: false; error: string } {
  if (error instanceof AppError) {
    return { ok: false, error: error.message };
  }
  if (error instanceof z.ZodError) {
    return { ok: false, error: "Invalid input" };
  }
  console.error("[households action]", error);
  return { ok: false, error: "Something went wrong" };
}

const filterSchema = z.object({
  query: z.string().optional(),
  statuses: z.array(z.nativeEnum(HouseholdStatus)).optional(),
  cellGroup: z.string().optional(),
  assignedCellLeaderId: z.string().nullable().optional(),
  minMembers: z.number().optional(),
  maxMembers: z.number().optional(),
  minEngagement: z.number().optional(),
  hasAddress: z.boolean().optional(),
});

export async function listHouseholdsAction(input: {
  cursor?: string | null;
  limit?: number;
  filter?: z.infer<typeof filterSchema>;
  sort?: "familyName" | "engagement" | "memberCount" | "updatedAt";
  sortDir?: "asc" | "desc";
}) {
  try {
    const ctx = await requirePermission(Permission.HOUSEHOLDS_READ);
    const filter = input.filter ? filterSchema.parse(input.filter) : undefined;
    const result = await listHouseholds({
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

export async function getHouseholdProfileAction(householdId: string) {
  try {
    const ctx = await requirePermission(Permission.HOUSEHOLDS_READ);
    const profile = await getHouseholdProfile({
      organizationId: ctx.organization.id,
      householdId,
      role: ctx.role,
    });
    return { ok: true as const, data: profile };
  } catch (error) {
    return actionError(error);
  }
}

export async function createHouseholdAction(raw: unknown) {
  try {
    const ctx = await requirePermission(Permission.HOUSEHOLDS_WRITE);
    const schema = z.object({
      familyName: z.string().min(1).max(120),
      householdCode: z.string().max(20).optional(),
      addressLine1: z.string().max(200).optional(),
      addressLine2: z.string().max(200).optional(),
      city: z.string().max(80).optional(),
      state: z.string().max(80).optional(),
      postalCode: z.string().max(20).optional(),
      country: z.string().max(80).optional(),
      preferredLanguage: z.string().max(40).optional(),
      emergencyContact: z.string().max(120).optional(),
      emergencyPhone: z.string().max(40).optional(),
      photoUrl: z.string().url().optional(),
      notes: z.string().max(4000).optional(),
      status: z.nativeEnum(HouseholdStatus).optional(),
      cellGroup: z.string().max(80).optional(),
      assignedCellLeaderId: z.string().optional(),
      initialMemberId: z.string().optional(),
      initialRelation: z.nativeEnum(FamilyRelation).optional(),
    });
    const data = schema.parse(raw);
    const household = await createHousehold({
      organizationId: ctx.organization.id,
      actorUserId: ctx.user.id,
      familyName: data.familyName,
      householdCode: data.householdCode,
      addressLine1: data.addressLine1 || null,
      addressLine2: data.addressLine2 || null,
      city: data.city || null,
      state: data.state || null,
      postalCode: data.postalCode || null,
      country: data.country || null,
      preferredLanguage: data.preferredLanguage || null,
      emergencyContact: data.emergencyContact || null,
      emergencyPhone: data.emergencyPhone || null,
      photoUrl: data.photoUrl || null,
      notes: data.notes || null,
      status: data.status,
      cellGroup: data.cellGroup || null,
      assignedCellLeaderId: data.assignedCellLeaderId || null,
      initialMemberId: data.initialMemberId,
      initialRelation: data.initialRelation,
    });
    revalidatePath("/households");
    return { ok: true as const, data: household };
  } catch (error) {
    return actionError(error);
  }
}

export async function updateHouseholdAction(householdId: string, raw: unknown) {
  try {
    const ctx = await requirePermission(Permission.HOUSEHOLDS_WRITE);
    const schema = z.object({
      familyName: z.string().min(1).max(120).optional(),
      addressLine1: z.string().nullable().optional(),
      addressLine2: z.string().nullable().optional(),
      city: z.string().nullable().optional(),
      state: z.string().nullable().optional(),
      postalCode: z.string().nullable().optional(),
      country: z.string().nullable().optional(),
      preferredLanguage: z.string().nullable().optional(),
      anniversaryDate: z.string().datetime().nullable().optional(),
      emergencyContact: z.string().nullable().optional(),
      emergencyPhone: z.string().nullable().optional(),
      photoUrl: z.string().url().nullable().optional(),
      notes: z.string().nullable().optional(),
      status: z.nativeEnum(HouseholdStatus).optional(),
      cellGroup: z.string().nullable().optional(),
      assignedCellLeaderId: z.string().nullable().optional(),
    });
    const data = schema.parse(raw);
    const { anniversaryDate, ...rest } = data;
    const household = await updateHousehold({
      organizationId: ctx.organization.id,
      householdId,
      actorUserId: ctx.user.id,
      data: {
        ...rest,
        anniversaryDate:
          anniversaryDate === undefined
            ? undefined
            : anniversaryDate
              ? new Date(anniversaryDate)
              : null,
      },
    });
    revalidatePath("/households");
    revalidatePath(`/households/${householdId}`);
    return { ok: true as const, data: household };
  } catch (error) {
    return actionError(error);
  }
}

export async function deleteHouseholdAction(householdId: string) {
  try {
    const ctx = await requirePermission(Permission.HOUSEHOLDS_DELETE);
    await deleteHousehold({
      organizationId: ctx.organization.id,
      householdId,
      actorUserId: ctx.user.id,
    });
    revalidatePath("/households");
    return { ok: true as const };
  } catch (error) {
    return actionError(error);
  }
}

export async function addMemberToHouseholdAction(householdId: string, raw: unknown) {
  try {
    const ctx = await requirePermission(Permission.HOUSEHOLDS_WRITE);
    const data = z
      .object({
        memberId: z.string(),
        relation: z.nativeEnum(FamilyRelation),
        isPrimary: z.boolean().optional(),
      })
      .parse(raw);
    const membership = await addMemberToHousehold({
      organizationId: ctx.organization.id,
      householdId,
      memberId: data.memberId,
      relation: data.relation,
      isPrimary: data.isPrimary,
      actorUserId: ctx.user.id,
    });
    revalidatePath(`/households/${householdId}`);
    revalidatePath(`/people/${data.memberId}`);
    return { ok: true as const, data: membership };
  } catch (error) {
    return actionError(error);
  }
}

export async function removeMemberFromHouseholdAction(
  householdId: string,
  memberId: string
) {
  try {
    const ctx = await requirePermission(Permission.HOUSEHOLDS_WRITE);
    await removeMemberFromHousehold({
      organizationId: ctx.organization.id,
      householdId,
      memberId,
      actorUserId: ctx.user.id,
    });
    revalidatePath(`/households/${householdId}`);
    revalidatePath(`/people/${memberId}`);
    return { ok: true as const };
  } catch (error) {
    return actionError(error);
  }
}

export async function moveMemberBetweenHouseholdsAction(raw: unknown) {
  try {
    const ctx = await requirePermission(Permission.HOUSEHOLDS_WRITE);
    const data = z
      .object({
        memberId: z.string(),
        fromHouseholdId: z.string(),
        toHouseholdId: z.string(),
        relation: z.nativeEnum(FamilyRelation).optional(),
      })
      .parse(raw);
    await moveMemberBetweenHouseholds({
      organizationId: ctx.organization.id,
      ...data,
      actorUserId: ctx.user.id,
    });
    revalidatePath(`/households/${data.fromHouseholdId}`);
    revalidatePath(`/households/${data.toHouseholdId}`);
    revalidatePath(`/people/${data.memberId}`);
    return { ok: true as const };
  } catch (error) {
    return actionError(error);
  }
}

export async function assignRelationAction(
  householdId: string,
  memberId: string,
  relation: FamilyRelation
) {
  try {
    const ctx = await requirePermission(Permission.HOUSEHOLDS_WRITE);
    await assignRelation({
      organizationId: ctx.organization.id,
      householdId,
      memberId,
      relation,
      actorUserId: ctx.user.id,
    });
    revalidatePath(`/households/${householdId}`);
    return { ok: true as const };
  } catch (error) {
    return actionError(error);
  }
}

export async function changeHouseholdHeadAction(
  householdId: string,
  memberId: string
) {
  try {
    const ctx = await requirePermission(Permission.HOUSEHOLDS_WRITE);
    await changeHouseholdHead({
      organizationId: ctx.organization.id,
      householdId,
      memberId,
      actorUserId: ctx.user.id,
    });
    revalidatePath(`/households/${householdId}`);
    return { ok: true as const };
  } catch (error) {
    return actionError(error);
  }
}

export async function mergeHouseholdsAction(raw: unknown) {
  try {
    const ctx = await requirePermission(Permission.HOUSEHOLDS_MERGE);
    const data = z
      .object({
        sourceId: z.string(),
        targetId: z.string(),
      })
      .parse(raw);
    const merged = await mergeHouseholds({
      organizationId: ctx.organization.id,
      sourceId: data.sourceId,
      targetId: data.targetId,
      actorUserId: ctx.user.id,
    });
    revalidatePath("/households");
    revalidatePath(`/households/${data.targetId}`);
    return { ok: true as const, data: merged };
  } catch (error) {
    return actionError(error);
  }
}

export async function splitHouseholdAction(raw: unknown) {
  try {
    const ctx = await requirePermission(Permission.HOUSEHOLDS_WRITE);
    const data = z
      .object({
        sourceHouseholdId: z.string(),
        memberIds: z.array(z.string()).min(1),
        newFamilyName: z.string().min(1).max(120),
      })
      .parse(raw);
    const result = await splitHousehold({
      organizationId: ctx.organization.id,
      ...data,
      actorUserId: ctx.user.id,
    });
    revalidatePath("/households");
    revalidatePath(`/households/${data.sourceHouseholdId}`);
    revalidatePath(`/households/${result.newHousehold.id}`);
    return { ok: true as const, data: result };
  } catch (error) {
    return actionError(error);
  }
}

export async function householdQuickAction(
  householdId: string,
  action: "email" | "whatsapp" | "visit" | "prayer" | "homeVisit",
  detail?: string
) {
  try {
    const ctx = await requirePermission(Permission.HOUSEHOLDS_WRITE);
    await logHouseholdQuickAction({
      organizationId: ctx.organization.id,
      householdId,
      actorUserId: ctx.user.id,
      action,
      detail,
    });
    revalidatePath(`/households/${householdId}`);
    return { ok: true as const };
  } catch (error) {
    return actionError(error);
  }
}

export async function exportHouseholdsCsvAction(
  filter?: z.infer<typeof filterSchema>
) {
  try {
    const ctx = await requirePermission(Permission.HOUSEHOLDS_EXPORT);
    const csv = await exportHouseholdsCsv({
      organizationId: ctx.organization.id,
      filter: filter ? filterSchema.parse(filter) : undefined,
    });
    return { ok: true as const, data: csv };
  } catch (error) {
    return actionError(error);
  }
}

export async function importHouseholdsCsvAction(csvText: string) {
  try {
    const ctx = await requirePermission(Permission.HOUSEHOLDS_IMPORT);
    const lines = csvText.trim().split(/\r?\n/);
    if (lines.length < 2) {
      return { ok: false as const, error: "CSV has no data rows" };
    }
    const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
    const rows = lines.slice(1).map((line) => {
      const cols = parseCsvLine(line);
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => {
        obj[h] = cols[i] ?? "";
      });
      return {
        familyName: obj.familyName || obj.FamilyName || "",
        householdCode: obj.householdCode || obj.HouseholdCode,
        status: obj.status || obj.Status,
        addressLine1: obj.addressLine1 || obj.Address,
        city: obj.city || obj.City,
        state: obj.state || obj.State,
        postalCode: obj.postalCode || obj.PostalCode,
        country: obj.country || obj.Country,
        cellGroup: obj.cellGroup || obj.CellGroup,
      };
    });
    const result = await importHouseholdsCsv({
      organizationId: ctx.organization.id,
      actorUserId: ctx.user.id,
      rows,
    });
    revalidatePath("/households");
    return { ok: true as const, data: result };
  } catch (error) {
    return actionError(error);
  }
}

export async function addHouseholdNoteAction(householdId: string, raw: unknown) {
  try {
    const ctx = await requirePermission(Permission.HOUSEHOLDS_WRITE);
    const data = z
      .object({
        body: z.string().min(1).max(8000),
        visibility: z.nativeEnum(NoteVisibility),
      })
      .parse(raw);
    const note = await addHouseholdNote({
      organizationId: ctx.organization.id,
      householdId,
      authorUserId: ctx.user.id,
      role: ctx.role,
      visibility: data.visibility,
      body: data.body,
    });
    revalidatePath(`/households/${householdId}`);
    return { ok: true as const, data: note };
  } catch (error) {
    return actionError(error);
  }
}

export async function uploadHouseholdDocumentAction(
  householdId: string,
  formData: FormData
) {
  try {
    const ctx = await requirePermission(Permission.HOUSEHOLDS_WRITE);
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return { ok: false as const, error: "File required" };
    }
    if (file.size > 8 * 1024 * 1024) {
      return { ok: false as const, error: "File too large (max 8MB)" };
    }
    const typeRaw = String(formData.get("type") ?? "OTHER");
    const type = (Object.values(DocumentType) as string[]).includes(typeRaw)
      ? (typeRaw as DocumentType)
      : DocumentType.OTHER;

    const bytes = Buffer.from(await file.arrayBuffer());
    const key = `${ctx.organization.id}/${householdId}/${randomUUID()}-${file.name}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "households");
    await mkdir(uploadDir, { recursive: true });
    const diskPath = path.join(uploadDir, key.replaceAll("/", "__"));
    await writeFile(diskPath, bytes);
    const url = `/uploads/households/${path.basename(diskPath)}`;

    const doc = await uploadHouseholdDocument({
      organizationId: ctx.organization.id,
      householdId,
      actorUserId: ctx.user.id,
      type,
      name: file.name,
      mimeType: file.type || "application/octet-stream",
      sizeBytes: file.size,
      storageKey: key,
      url,
    });
    revalidatePath(`/households/${householdId}`);
    return { ok: true as const, data: doc };
  } catch (error) {
    return actionError(error);
  }
}

export async function refreshHouseholdEngagementAction(householdId: string) {
  try {
    const ctx = await requirePermission(Permission.HOUSEHOLDS_READ);
    const score = await refreshHouseholdEngagement(
      ctx.organization.id,
      householdId
    );
    revalidatePath(`/households/${householdId}`);
    return { ok: true as const, data: { engagementScore: score } };
  } catch (error) {
    return actionError(error);
  }
}

export async function listHouseholdFiltersAction() {
  try {
    const ctx = await requirePermission(Permission.HOUSEHOLDS_READ);
    const filters = await listHouseholdSavedFilters(
      ctx.organization.id,
      ctx.user.id
    );
    return { ok: true as const, data: filters };
  } catch (error) {
    return actionError(error);
  }
}

export async function saveHouseholdFilterAction(
  name: string,
  definition: z.infer<typeof filterSchema>
) {
  try {
    const ctx = await requirePermission(Permission.HOUSEHOLDS_READ);
    const filter = await saveHouseholdFilter({
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

export async function deleteHouseholdFilterAction(id: string) {
  try {
    const ctx = await requireTenantContext();
    await deleteHouseholdSavedFilter({
      organizationId: ctx.organization.id,
      userId: ctx.user.id,
      id,
    });
    return { ok: true as const };
  } catch (error) {
    return actionError(error);
  }
}

export async function getHouseholdPreferencesAction() {
  try {
    const ctx = await requirePermission(Permission.HOUSEHOLDS_READ);
    const prefs = await getHouseholdListPreferences(
      ctx.organization.id,
      ctx.user.id
    );
    return {
      ok: true as const,
      data: prefs ?? {
        columns: DEFAULT_HOUSEHOLD_COLUMNS,
        density: "comfortable",
        viewMode: "table",
      },
    };
  } catch (error) {
    return actionError(error);
  }
}

export async function saveHouseholdPreferencesAction(raw: unknown) {
  try {
    const ctx = await requirePermission(Permission.HOUSEHOLDS_READ);
    const data = z
      .object({
        columns: z.array(z.string()).min(1),
        density: z.enum(["compact", "comfortable", "spacious"]),
        viewMode: z.enum(["table", "grid", "card", "compact"]),
      })
      .parse(raw);
    await saveHouseholdListPreferences({
      organizationId: ctx.organization.id,
      userId: ctx.user.id,
      columns: data.columns as HouseholdListColumn[],
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
