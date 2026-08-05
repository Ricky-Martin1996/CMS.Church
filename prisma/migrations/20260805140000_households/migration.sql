-- Expand FamilyRelation enum
ALTER TYPE "FamilyRelation" ADD VALUE IF NOT EXISTS 'HUSBAND';
ALTER TYPE "FamilyRelation" ADD VALUE IF NOT EXISTS 'WIFE';
ALTER TYPE "FamilyRelation" ADD VALUE IF NOT EXISTS 'SON';
ALTER TYPE "FamilyRelation" ADD VALUE IF NOT EXISTS 'DAUGHTER';
ALTER TYPE "FamilyRelation" ADD VALUE IF NOT EXISTS 'GRANDPARENT';
ALTER TYPE "FamilyRelation" ADD VALUE IF NOT EXISTS 'GUARDIAN';
ALTER TYPE "FamilyRelation" ADD VALUE IF NOT EXISTS 'RELATIVE';

-- CreateEnum
CREATE TYPE "HouseholdStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "HouseholdActivityType" AS ENUM (
  'CREATED', 'EDITED', 'MEMBER_ADDED', 'MEMBER_REMOVED', 'MEMBER_MOVED',
  'RELATION_CHANGED', 'HEAD_CHANGED', 'MERGED', 'SPLIT', 'VISITED',
  'EMAIL_SENT', 'WHATSAPP_SENT', 'PRAYER_REQUESTED', 'CELL_LEADER_ASSIGNED',
  'HOME_VISIT_SCHEDULED', 'NOTE_ADDED', 'DOCUMENT_UPLOADED', 'IMPORTED', 'STATUS_CHANGED'
);

-- Expand households table
ALTER TABLE "households" RENAME COLUMN "name" TO "familyName";

ALTER TABLE "households" ADD COLUMN IF NOT EXISTS "householdCode" TEXT;
ALTER TABLE "households" ADD COLUMN IF NOT EXISTS "geoLatitude" DOUBLE PRECISION;
ALTER TABLE "households" ADD COLUMN IF NOT EXISTS "geoLongitude" DOUBLE PRECISION;
ALTER TABLE "households" ADD COLUMN IF NOT EXISTS "preferredLanguage" TEXT;
ALTER TABLE "households" ADD COLUMN IF NOT EXISTS "anniversaryDate" TIMESTAMP(3);
ALTER TABLE "households" ADD COLUMN IF NOT EXISTS "emergencyContact" TEXT;
ALTER TABLE "households" ADD COLUMN IF NOT EXISTS "emergencyPhone" TEXT;
ALTER TABLE "households" ADD COLUMN IF NOT EXISTS "photoUrl" TEXT;
ALTER TABLE "households" ADD COLUMN IF NOT EXISTS "notes" TEXT;
ALTER TABLE "households" ADD COLUMN IF NOT EXISTS "status" "HouseholdStatus" NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "households" ADD COLUMN IF NOT EXISTS "cellGroup" TEXT;
ALTER TABLE "households" ADD COLUMN IF NOT EXISTS "assignedCellLeaderId" TEXT;
ALTER TABLE "households" ADD COLUMN IF NOT EXISTS "engagementScore" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "households" ADD COLUMN IF NOT EXISTS "qrToken" TEXT;
ALTER TABLE "households" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

-- Backfill household codes and QR tokens
UPDATE "households"
SET "householdCode" = 'HH-' || UPPER(SUBSTRING(REPLACE("id", '-', '') FROM 1 FOR 8))
WHERE "householdCode" IS NULL;

UPDATE "households"
SET "qrToken" = "id"
WHERE "qrToken" IS NULL;

ALTER TABLE "households" ALTER COLUMN "householdCode" SET NOT NULL;
ALTER TABLE "households" ALTER COLUMN "qrToken" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "households_qrToken_key" ON "households"("qrToken");
CREATE UNIQUE INDEX IF NOT EXISTS "households_organizationId_householdCode_key" ON "households"("organizationId", "householdCode");
CREATE INDEX IF NOT EXISTS "households_organizationId_status_idx" ON "households"("organizationId", "status");
CREATE INDEX IF NOT EXISTS "households_organizationId_familyName_idx" ON "households"("organizationId", "familyName");
CREATE INDEX IF NOT EXISTS "households_organizationId_deletedAt_idx" ON "households"("organizationId", "deletedAt");
CREATE INDEX IF NOT EXISTS "households_qrToken_idx" ON "households"("qrToken");

-- family_members → HouseholdMembership extras
ALTER TABLE "family_members" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
CREATE INDEX IF NOT EXISTS "family_members_householdId_idx" ON "family_members"("householdId");

-- Enforce one household per member (dedupe first if needed)
DELETE FROM "family_members" a
USING "family_members" b
WHERE a."memberId" = b."memberId" AND a."ctid" < b."ctid";

CREATE UNIQUE INDEX IF NOT EXISTS "family_members_memberId_key" ON "family_members"("memberId");

-- Household activities
CREATE TABLE IF NOT EXISTS "household_activities" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "type" "HouseholdActivityType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "actorUserId" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "household_activities_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "household_activities_organizationId_householdId_occurredAt_idx"
  ON "household_activities"("organizationId", "householdId", "occurredAt");

ALTER TABLE "household_activities"
  DROP CONSTRAINT IF EXISTS "household_activities_organizationId_fkey";
ALTER TABLE "household_activities"
  ADD CONSTRAINT "household_activities_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "household_activities"
  DROP CONSTRAINT IF EXISTS "household_activities_householdId_fkey";
ALTER TABLE "household_activities"
  ADD CONSTRAINT "household_activities_householdId_fkey"
  FOREIGN KEY ("householdId") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Household notes
CREATE TABLE IF NOT EXISTS "household_notes" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "authorUserId" TEXT NOT NULL,
    "visibility" "NoteVisibility" NOT NULL DEFAULT 'PRIVATE',
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "household_notes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "household_notes_organizationId_householdId_idx"
  ON "household_notes"("organizationId", "householdId");

ALTER TABLE "household_notes"
  DROP CONSTRAINT IF EXISTS "household_notes_organizationId_fkey";
ALTER TABLE "household_notes"
  ADD CONSTRAINT "household_notes_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "household_notes"
  DROP CONSTRAINT IF EXISTS "household_notes_householdId_fkey";
ALTER TABLE "household_notes"
  ADD CONSTRAINT "household_notes_householdId_fkey"
  FOREIGN KEY ("householdId") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Household documents
CREATE TABLE IF NOT EXISTS "household_documents" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL DEFAULT 'OTHER',
    "name" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "storageKey" TEXT NOT NULL,
    "url" TEXT,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "household_documents_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "household_documents_organizationId_householdId_idx"
  ON "household_documents"("organizationId", "householdId");

ALTER TABLE "household_documents"
  DROP CONSTRAINT IF EXISTS "household_documents_organizationId_fkey";
ALTER TABLE "household_documents"
  ADD CONSTRAINT "household_documents_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "household_documents"
  DROP CONSTRAINT IF EXISTS "household_documents_householdId_fkey";
ALTER TABLE "household_documents"
  ADD CONSTRAINT "household_documents_householdId_fkey"
  FOREIGN KEY ("householdId") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Saved household filters
CREATE TABLE IF NOT EXISTS "saved_household_filters" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "definition" JSONB NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "saved_household_filters_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "saved_household_filters_organizationId_userId_idx"
  ON "saved_household_filters"("organizationId", "userId");

ALTER TABLE "saved_household_filters"
  DROP CONSTRAINT IF EXISTS "saved_household_filters_organizationId_fkey";
ALTER TABLE "saved_household_filters"
  ADD CONSTRAINT "saved_household_filters_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "saved_household_filters"
  DROP CONSTRAINT IF EXISTS "saved_household_filters_userId_fkey";
ALTER TABLE "saved_household_filters"
  ADD CONSTRAINT "saved_household_filters_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Household list preferences
CREATE TABLE IF NOT EXISTS "household_list_preferences" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "columns" JSONB NOT NULL,
    "density" TEXT NOT NULL DEFAULT 'comfortable',
    "viewMode" TEXT NOT NULL DEFAULT 'table',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "household_list_preferences_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "household_list_preferences_organizationId_userId_key"
  ON "household_list_preferences"("organizationId", "userId");

ALTER TABLE "household_list_preferences"
  DROP CONSTRAINT IF EXISTS "household_list_preferences_organizationId_fkey";
ALTER TABLE "household_list_preferences"
  ADD CONSTRAINT "household_list_preferences_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "household_list_preferences"
  DROP CONSTRAINT IF EXISTS "household_list_preferences_userId_fkey";
ALTER TABLE "household_list_preferences"
  ADD CONSTRAINT "household_list_preferences_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
