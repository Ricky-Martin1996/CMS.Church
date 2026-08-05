import type {
  ActivityRepository,
  AttendanceRepository,
  DocumentRepository,
  FamilyRepository,
  GivingRepository,
  ListPreferenceRepository,
  NoteRepository,
  PrayerRepository,
  SavedFilterRepository,
  TagRepository,
  VolunteerRepository,
} from "@/application/ports/member-repositories";
import type {
  MemberFilterDefinition,
  MemberListColumn,
} from "@/domain/entities/member";
import { DEFAULT_TAGS } from "@/domain/enums/member";
import { prisma } from "@/infrastructure/db/prisma";
import {
  mapActivity,
  mapDocument,
  mapFamilyMember,
  mapHousehold,
  mapNote,
  mapPrayer,
  mapTag,
  mapVolunteer,
} from "@/infrastructure/repositories/member-mappers";
import type {
  ActivityType as PrismaActivityType,
  AttendanceMethod as PrismaAttendanceMethod,
  DocumentType as PrismaDocumentType,
  FamilyRelation as PrismaFamilyRelation,
  NoteVisibility as PrismaNoteVisibility,
  Prisma,
} from "@prisma/client";
import { format, startOfMonth, subMonths } from "date-fns";
import { randomUUID } from "crypto";

export const activityRepository: ActivityRepository = {
  async create(input) {
    await prisma.memberActivity.create({
      data: {
        organizationId: input.organizationId,
        memberId: input.memberId,
        type: input.type as PrismaActivityType,
        title: input.title,
        description: input.description ?? null,
        metadata: (input.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
        actorUserId: input.actorUserId ?? null,
        occurredAt: input.occurredAt ?? new Date(),
      },
    });
  },

  async listForMember(organizationId, memberId, limit = 50) {
    const activities = await prisma.memberActivity.findMany({
      where: { organizationId, memberId },
      orderBy: { occurredAt: "desc" },
      take: limit,
    });
    return activities.map(mapActivity);
  },
};

export const tagRepository: TagRepository = {
  async list(organizationId) {
    const tags = await prisma.tag.findMany({
      where: { organizationId },
      orderBy: { name: "asc" },
    });
    return tags.map(mapTag);
  },

  async ensureDefaults(organizationId) {
    for (const tag of DEFAULT_TAGS) {
      await prisma.tag.upsert({
        where: {
          organizationId_slug: {
            organizationId,
            slug: tag.slug,
          },
        },
        create: {
          organizationId,
          name: tag.name,
          slug: tag.slug,
          color: tag.color,
        },
        update: {},
      });
    }

    return this.list(organizationId);
  },

  async create(organizationId, input) {
    const slug = input.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const tag = await prisma.tag.create({
      data: {
        organizationId,
        name: input.name,
        slug: slug || `tag-${Date.now()}`,
        color: input.color ?? "#0d9488",
      },
    });

    return mapTag(tag);
  },
};

export const noteRepository: NoteRepository = {
  async create(input) {
    const note = await prisma.memberNote.create({
      data: {
        organizationId: input.organizationId,
        memberId: input.memberId,
        authorUserId: input.authorUserId,
        visibility: input.visibility as PrismaNoteVisibility,
        body: input.body,
      },
    });
    return mapNote(note);
  },

  async listForMember(organizationId, memberId, visibilities) {
    const notes = await prisma.memberNote.findMany({
      where: {
        organizationId,
        memberId,
        visibility: { in: visibilities as PrismaNoteVisibility[] },
      },
      orderBy: { createdAt: "desc" },
    });
    return notes.map(mapNote);
  },
};

export const documentRepository: DocumentRepository = {
  async create(input) {
    const document = await prisma.memberDocument.create({
      data: {
        organizationId: input.organizationId,
        memberId: input.memberId,
        type: input.type as PrismaDocumentType,
        name: input.name,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
        storageKey: input.storageKey,
        url: input.url ?? null,
        uploadedById: input.uploadedById ?? null,
      },
    });
    return mapDocument(document);
  },

  async listForMember(organizationId, memberId) {
    const documents = await prisma.memberDocument.findMany({
      where: { organizationId, memberId },
      orderBy: { createdAt: "desc" },
    });
    return documents.map(mapDocument);
  },

  async delete(organizationId, id) {
    await prisma.memberDocument.deleteMany({
      where: { id, organizationId },
    });
  },
};

function generateHouseholdCode(id?: string): string {
  const slice = (id ?? randomUUID().replace(/-/g, ""))
    .replace(/-/g, "")
    .slice(0, 8)
    .toUpperCase();
  return `HH-${slice}`;
}

export const familyRepository: FamilyRepository = {
  async getForMember(organizationId, memberId) {
    const link = await prisma.householdMembership.findFirst({
      where: {
        memberId,
        household: { organizationId, deletedAt: null },
      },
      include: {
        household: {
          include: {
            memberships: {
              include: {
                member: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    avatarUrl: true,
                    email: true,
                    phone: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!link) {
      return { household: null, members: [] };
    }

    return {
      household: mapHousehold(link.household),
      members: link.household.memberships.map(mapFamilyMember),
    };
  },

  async upsertHousehold(input) {
    const existingLink = await prisma.householdMembership.findFirst({
      where: {
        memberId: input.memberId,
        household: { organizationId: input.organizationId, deletedAt: null },
      },
      include: { household: true },
    });

    let householdId: string;

    if (existingLink) {
      await prisma.household.update({
        where: { id: existingLink.householdId },
        data: {
          familyName: input.name,
          addressLine1: input.addressLine1 ?? null,
          city: input.city ?? null,
          state: input.state ?? null,
          postalCode: input.postalCode ?? null,
          country: input.country ?? null,
        },
      });

      await prisma.householdMembership.update({
        where: { id: existingLink.id },
        data: {
          relation: input.relation as PrismaFamilyRelation,
          isPrimary: input.isPrimary ?? false,
        },
      });

      householdId = existingLink.householdId;
    } else {
      const household = await prisma.household.create({
        data: {
          organizationId: input.organizationId,
          familyName: input.name,
          householdCode: generateHouseholdCode(),
          addressLine1: input.addressLine1 ?? null,
          city: input.city ?? null,
          state: input.state ?? null,
          postalCode: input.postalCode ?? null,
          country: input.country ?? null,
        },
      });

      await prisma.householdMembership.create({
        data: {
          householdId: household.id,
          memberId: input.memberId,
          relation: input.relation as PrismaFamilyRelation,
          isPrimary: input.isPrimary ?? true,
        },
      });

      householdId = household.id;
    }

    if (input.emergencyName !== undefined || input.emergencyPhone !== undefined) {
      await prisma.member.updateMany({
        where: {
          id: input.memberId,
          organizationId: input.organizationId,
          deletedAt: null,
        },
        data: {
          ...(input.emergencyName !== undefined
            ? { emergencyName: input.emergencyName }
            : {}),
          ...(input.emergencyPhone !== undefined
            ? { emergencyPhone: input.emergencyPhone }
            : {}),
        },
      });
    }

    const household = await prisma.household.findFirstOrThrow({
      where: { id: householdId, organizationId: input.organizationId, deletedAt: null },
      include: {
        memberships: {
          include: {
            member: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    return {
      household: mapHousehold(household),
      members: household.memberships.map(mapFamilyMember),
    };
  },

  async linkMember(input) {
    await prisma.householdMembership.upsert({
      where: {
        householdId_memberId: {
          householdId: input.householdId,
          memberId: input.memberId,
        },
      },
      create: {
        householdId: input.householdId,
        memberId: input.memberId,
        relation: input.relation as PrismaFamilyRelation,
        isPrimary: input.isPrimary ?? false,
      },
      update: {
        relation: input.relation as PrismaFamilyRelation,
        isPrimary: input.isPrimary ?? false,
      },
    });
  },
};

export const attendanceRepository: AttendanceRepository = {
  async create(input) {
    await prisma.attendanceRecord.create({
      data: {
        organizationId: input.organizationId,
        memberId: input.memberId,
        eventName: input.eventName,
        attendedAt: input.attendedAt,
        method: (input.method ?? "MANUAL") as PrismaAttendanceMethod,
        notes: input.notes ?? null,
      },
    });
  },

  async trend(organizationId, memberId) {
    const monthKeys: string[] = [];
    const now = new Date();

    for (let i = 5; i >= 0; i -= 1) {
      monthKeys.push(format(startOfMonth(subMonths(now, i)), "yyyy-MM"));
    }

    const sixMonthsAgo = startOfMonth(subMonths(now, 5));
    const records = await prisma.attendanceRecord.findMany({
      where: {
        organizationId,
        memberId,
        attendedAt: { gte: sixMonthsAgo },
      },
      select: { attendedAt: true },
    });

    const byMonth = new Map<string, number>(
      monthKeys.map((key) => [key, 0])
    );

    for (const record of records) {
      const key = format(startOfMonth(record.attendedAt), "yyyy-MM");
      if (byMonth.has(key)) {
        byMonth.set(key, (byMonth.get(key) ?? 0) + 1);
      }
    }

    return monthKeys.map((month) => ({
      month,
      count: byMonth.get(month) ?? 0,
    }));
  },
};

export const givingRepository: GivingRepository = {
  async trend(organizationId, memberId) {
    const monthKeys: string[] = [];
    const now = new Date();

    for (let i = 5; i >= 0; i -= 1) {
      monthKeys.push(format(startOfMonth(subMonths(now, i)), "yyyy-MM"));
    }

    const sixMonthsAgo = startOfMonth(subMonths(now, 5));
    const records = await prisma.givingRecord.findMany({
      where: {
        organizationId,
        memberId,
        givenAt: { gte: sixMonthsAgo },
      },
      select: { givenAt: true, amountCents: true },
    });

    const byMonth = new Map<string, number>(
      monthKeys.map((key) => [key, 0])
    );

    for (const record of records) {
      const key = format(startOfMonth(record.givenAt), "yyyy-MM");
      if (byMonth.has(key)) {
        byMonth.set(key, (byMonth.get(key) ?? 0) + record.amountCents);
      }
    }

    return monthKeys.map((month) => ({
      month,
      amountCents: byMonth.get(month) ?? 0,
    }));
  },
};

export const prayerRepository: PrayerRepository = {
  async create(input) {
    const prayer = await prisma.prayerRequest.create({
      data: {
        organizationId: input.organizationId,
        memberId: input.memberId,
        request: input.request,
      },
    });
    return mapPrayer(prayer);
  },

  async listForMember(organizationId, memberId) {
    const prayers = await prisma.prayerRequest.findMany({
      where: { organizationId, memberId },
      orderBy: { createdAt: "desc" },
    });
    return prayers.map(mapPrayer);
  },
};

export const volunteerRepository: VolunteerRepository = {
  async create(input) {
    const volunteer = await prisma.volunteerAssignment.create({
      data: {
        organizationId: input.organizationId,
        memberId: input.memberId,
        roleName: input.roleName,
        team: input.team ?? null,
      },
    });
    return mapVolunteer(volunteer);
  },

  async listForMember(organizationId, memberId) {
    const volunteers = await prisma.volunteerAssignment.findMany({
      where: { organizationId, memberId },
      orderBy: { startedAt: "desc" },
    });
    return volunteers.map(mapVolunteer);
  },
};

function parseFilterDefinition(value: Prisma.JsonValue): MemberFilterDefinition {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {};
  }
  return value as MemberFilterDefinition;
}

export const savedFilterRepository: SavedFilterRepository = {
  async list(organizationId, userId) {
    const filters = await prisma.savedMemberFilter.findMany({
      where: { organizationId, userId },
      orderBy: { createdAt: "asc" },
    });

    return filters.map((filter) => ({
      id: filter.id,
      name: filter.name,
      definition: parseFilterDefinition(filter.definition),
      isDefault: filter.isDefault,
    }));
  },

  async create(input) {
    if (input.isDefault) {
      await prisma.savedMemberFilter.updateMany({
        where: {
          organizationId: input.organizationId,
          userId: input.userId,
          isDefault: true,
        },
        data: { isDefault: false },
      });
    }

    const filter = await prisma.savedMemberFilter.create({
      data: {
        organizationId: input.organizationId,
        userId: input.userId,
        name: input.name,
        definition: input.definition as Prisma.InputJsonValue,
        isDefault: input.isDefault ?? false,
      },
    });

    return { id: filter.id, name: filter.name };
  },

  async delete(organizationId, userId, id) {
    await prisma.savedMemberFilter.deleteMany({
      where: { id, organizationId, userId },
    });
  },
};

export const listPreferenceRepository: ListPreferenceRepository = {
  async get(organizationId, userId) {
    const preference = await prisma.memberListPreference.findUnique({
      where: {
        organizationId_userId: { organizationId, userId },
      },
    });

    if (!preference) {
      return null;
    }

    const columns = Array.isArray(preference.columns)
      ? (preference.columns as MemberListColumn[])
      : [];

    return {
      columns,
      density: preference.density,
      viewMode: preference.viewMode,
    };
  },

  async upsert(input) {
    await prisma.memberListPreference.upsert({
      where: {
        organizationId_userId: {
          organizationId: input.organizationId,
          userId: input.userId,
        },
      },
      create: {
        organizationId: input.organizationId,
        userId: input.userId,
        columns: input.columns as Prisma.InputJsonValue,
        density: input.density,
        viewMode: input.viewMode,
      },
      update: {
        columns: input.columns as Prisma.InputJsonValue,
        density: input.density,
        viewMode: input.viewMode,
      },
    });
  },
};
