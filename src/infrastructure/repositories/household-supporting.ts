import type {
  HouseholdActivityRepository,
  HouseholdDocumentRepository,
  HouseholdListPreferenceRepository,
  HouseholdNoteRepository,
  HouseholdSavedFilterRepository,
} from "@/application/ports/household-repositories";
import type {
  HouseholdFilterDefinition,
  HouseholdListColumn,
} from "@/domain/entities/household";
import { prisma } from "@/infrastructure/db/prisma";
import {
  mapHouseholdActivity,
  mapHouseholdDocument,
  mapHouseholdNote,
} from "@/infrastructure/repositories/household-repository";
import type {
  DocumentType as PrismaDocumentType,
  HouseholdActivityType as PrismaHouseholdActivityType,
  NoteVisibility as PrismaNoteVisibility,
  Prisma,
} from "@prisma/client";

function parseFilterDefinition(value: Prisma.JsonValue): HouseholdFilterDefinition {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {};
  }
  return value as HouseholdFilterDefinition;
}

export const householdActivityRepository: HouseholdActivityRepository = {
  async create(input) {
    await prisma.householdActivity.create({
      data: {
        organizationId: input.organizationId,
        householdId: input.householdId,
        type: input.type as PrismaHouseholdActivityType,
        title: input.title,
        description: input.description ?? null,
        metadata: (input.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
        actorUserId: input.actorUserId ?? null,
        occurredAt: input.occurredAt ?? new Date(),
      },
    });
  },

  async listForHousehold(organizationId, householdId, limit = 50) {
    const activities = await prisma.householdActivity.findMany({
      where: { organizationId, householdId },
      orderBy: { occurredAt: "desc" },
      take: limit,
    });
    return activities.map(mapHouseholdActivity);
  },
};

export const householdNoteRepository: HouseholdNoteRepository = {
  async create(input) {
    const note = await prisma.householdNote.create({
      data: {
        organizationId: input.organizationId,
        householdId: input.householdId,
        authorUserId: input.authorUserId,
        visibility: input.visibility as PrismaNoteVisibility,
        body: input.body,
      },
    });
    return mapHouseholdNote(note);
  },

  async listForHousehold(organizationId, householdId, visibilities) {
    const notes = await prisma.householdNote.findMany({
      where: {
        organizationId,
        householdId,
        visibility: { in: visibilities as PrismaNoteVisibility[] },
      },
      orderBy: { createdAt: "desc" },
    });
    return notes.map(mapHouseholdNote);
  },
};

export const householdDocumentRepository: HouseholdDocumentRepository = {
  async create(input) {
    const document = await prisma.householdDocument.create({
      data: {
        organizationId: input.organizationId,
        householdId: input.householdId,
        type: input.type as PrismaDocumentType,
        name: input.name,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
        storageKey: input.storageKey,
        url: input.url ?? null,
        uploadedById: input.uploadedById ?? null,
      },
    });
    return mapHouseholdDocument(document);
  },

  async listForHousehold(organizationId, householdId) {
    const documents = await prisma.householdDocument.findMany({
      where: { organizationId, householdId },
      orderBy: { createdAt: "desc" },
    });
    return documents.map(mapHouseholdDocument);
  },

  async delete(organizationId, id) {
    await prisma.householdDocument.deleteMany({
      where: { id, organizationId },
    });
  },
};

export const householdSavedFilterRepository: HouseholdSavedFilterRepository = {
  async list(organizationId, userId) {
    const filters = await prisma.savedHouseholdFilter.findMany({
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
      await prisma.savedHouseholdFilter.updateMany({
        where: {
          organizationId: input.organizationId,
          userId: input.userId,
          isDefault: true,
        },
        data: { isDefault: false },
      });
    }

    const filter = await prisma.savedHouseholdFilter.create({
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
    await prisma.savedHouseholdFilter.deleteMany({
      where: { id, organizationId, userId },
    });
  },
};

export const householdListPreferenceRepository: HouseholdListPreferenceRepository = {
  async get(organizationId, userId) {
    const preference = await prisma.householdListPreference.findUnique({
      where: { organizationId_userId: { organizationId, userId } },
    });
    if (!preference) return null;

    const columns = Array.isArray(preference.columns)
      ? (preference.columns as HouseholdListColumn[])
      : [];

    return {
      columns,
      density: preference.density,
      viewMode: preference.viewMode,
    };
  },

  async upsert(input) {
    await prisma.householdListPreference.upsert({
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
