-- CreateEnum
CREATE TYPE "MemberStatus" AS ENUM ('ACTIVE', 'VISITOR', 'INACTIVE', 'NEW_MEMBER', 'TRANSFERRED', 'DECEASED');

-- CreateEnum
CREATE TYPE "MemberLifecycle" AS ENUM ('PROSPECT', 'VISITOR', 'REGULAR', 'MEMBER', 'LEADER', 'ALUMNI');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('FEMALE', 'MALE', 'OTHER', 'PREFER_NOT_TO_SAY');

-- CreateEnum
CREATE TYPE "MaritalStatus" AS ENUM ('SINGLE', 'MARRIED', 'WIDOWED', 'DIVORCED', 'SEPARATED', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "NoteVisibility" AS ENUM ('PRIVATE', 'PASTORAL', 'LEADER');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('ID', 'CERTIFICATE', 'BAPTISM', 'MEMBERSHIP', 'OTHER');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('CREATED', 'EDITED', 'VISITED', 'ATTENDED', 'PRAYER_REQUESTED', 'BAPTIZED', 'FOUNDATION_COURSE_COMPLETED', 'VOLUNTEER_JOINED', 'NOTE_ADDED', 'DOCUMENT_UPLOADED', 'TAG_ADDED', 'TAG_REMOVED', 'FAMILY_LINKED', 'EMAIL_SENT', 'CALL_LOGGED', 'WHATSAPP_SENT', 'LEADER_ASSIGNED', 'STATUS_CHANGED', 'IMPORTED');

-- CreateEnum
CREATE TYPE "FamilyRelation" AS ENUM ('HEAD', 'SPOUSE', 'CHILD', 'PARENT', 'SIBLING', 'OTHER');

-- CreateEnum
CREATE TYPE "AttendanceMethod" AS ENUM ('MANUAL', 'QR', 'IMPORT');

-- CreateEnum
CREATE TYPE "PrayerStatus" AS ENUM ('OPEN', 'PRAYING', 'ANSWERED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "VolunteerStatus" AS ENUM ('ACTIVE', 'PAUSED', 'ENDED');

-- CreateTable
CREATE TABLE "members" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "whatsapp" TEXT,
    "avatarUrl" TEXT,
    "coverUrl" TEXT,
    "status" "MemberStatus" NOT NULL DEFAULT 'VISITOR',
    "lifecycle" "MemberLifecycle" NOT NULL DEFAULT 'VISITOR',
    "gender" "Gender",
    "maritalStatus" "MaritalStatus" NOT NULL DEFAULT 'UNKNOWN',
    "dateOfBirth" TIMESTAMP(3),
    "baptismDate" TIMESTAMP(3),
    "joinedAt" TIMESTAMP(3),
    "campus" TEXT,
    "ministryRole" TEXT,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "country" TEXT,
    "emergencyName" TEXT,
    "emergencyPhone" TEXT,
    "emergencyRelation" TEXT,
    "assignedLeaderId" TEXT,
    "linkedUserId" TEXT,
    "engagementScore" INTEGER NOT NULL DEFAULT 0,
    "growthScore" INTEGER NOT NULL DEFAULT 0,
    "riskScore" INTEGER NOT NULL DEFAULT 0,
    "aiSummary" TEXT,
    "aiInsights" JSONB,
    "qrToken" TEXT NOT NULL,
    "customFields" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#0d9488',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member_tags" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "member_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "households" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "country" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "households_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "family_members" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "relation" "FamilyRelation" NOT NULL DEFAULT 'OTHER',
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "family_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member_notes" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "authorUserId" TEXT NOT NULL,
    "visibility" "NoteVisibility" NOT NULL DEFAULT 'PRIVATE',
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "member_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member_documents" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL DEFAULT 'OTHER',
    "name" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "storageKey" TEXT NOT NULL,
    "url" TEXT,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "member_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member_activities" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "type" "ActivityType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "actorUserId" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "member_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_records" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "attendedAt" TIMESTAMP(3) NOT NULL,
    "method" "AttendanceMethod" NOT NULL DEFAULT 'MANUAL',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendance_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "giving_records" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "fund" TEXT NOT NULL DEFAULT 'General',
    "givenAt" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "giving_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prayer_requests" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "request" TEXT NOT NULL,
    "status" "PrayerStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "answeredAt" TIMESTAMP(3),

    CONSTRAINT "prayer_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "volunteer_assignments" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "roleName" TEXT NOT NULL,
    "team" TEXT,
    "status" "VolunteerStatus" NOT NULL DEFAULT 'ACTIVE',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "volunteer_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_member_filters" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "definition" JSONB NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saved_member_filters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member_list_preferences" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "columns" JSONB NOT NULL,
    "density" TEXT NOT NULL DEFAULT 'comfortable',
    "viewMode" TEXT NOT NULL DEFAULT 'table',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "member_list_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "members_qrToken_key" ON "members"("qrToken");
CREATE INDEX "members_organizationId_idx" ON "members"("organizationId");
CREATE INDEX "members_organizationId_status_idx" ON "members"("organizationId", "status");
CREATE INDEX "members_organizationId_lastName_firstName_idx" ON "members"("organizationId", "lastName", "firstName");
CREATE INDEX "members_organizationId_email_idx" ON "members"("organizationId", "email");
CREATE INDEX "members_organizationId_deletedAt_idx" ON "members"("organizationId", "deletedAt");
CREATE INDEX "members_assignedLeaderId_idx" ON "members"("assignedLeaderId");
CREATE INDEX "members_qrToken_idx" ON "members"("qrToken");

CREATE UNIQUE INDEX "tags_organizationId_slug_key" ON "tags"("organizationId", "slug");
CREATE INDEX "tags_organizationId_idx" ON "tags"("organizationId");

CREATE UNIQUE INDEX "member_tags_memberId_tagId_key" ON "member_tags"("memberId", "tagId");
CREATE INDEX "member_tags_tagId_idx" ON "member_tags"("tagId");

CREATE INDEX "households_organizationId_idx" ON "households"("organizationId");

CREATE UNIQUE INDEX "family_members_householdId_memberId_key" ON "family_members"("householdId", "memberId");
CREATE INDEX "family_members_memberId_idx" ON "family_members"("memberId");

CREATE INDEX "member_notes_organizationId_memberId_idx" ON "member_notes"("organizationId", "memberId");
CREATE INDEX "member_notes_memberId_visibility_idx" ON "member_notes"("memberId", "visibility");

CREATE INDEX "member_documents_organizationId_memberId_idx" ON "member_documents"("organizationId", "memberId");

CREATE INDEX "member_activities_organizationId_memberId_occurredAt_idx" ON "member_activities"("organizationId", "memberId", "occurredAt");
CREATE INDEX "member_activities_memberId_type_idx" ON "member_activities"("memberId", "type");

CREATE INDEX "attendance_records_organizationId_memberId_attendedAt_idx" ON "attendance_records"("organizationId", "memberId", "attendedAt");
CREATE INDEX "giving_records_organizationId_memberId_givenAt_idx" ON "giving_records"("organizationId", "memberId", "givenAt");
CREATE INDEX "prayer_requests_organizationId_memberId_idx" ON "prayer_requests"("organizationId", "memberId");
CREATE INDEX "volunteer_assignments_organizationId_memberId_idx" ON "volunteer_assignments"("organizationId", "memberId");
CREATE INDEX "saved_member_filters_organizationId_userId_idx" ON "saved_member_filters"("organizationId", "userId");
CREATE UNIQUE INDEX "member_list_preferences_organizationId_userId_key" ON "member_list_preferences"("organizationId", "userId");

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "members" ADD CONSTRAINT "members_assignedLeaderId_fkey" FOREIGN KEY ("assignedLeaderId") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "tags" ADD CONSTRAINT "tags_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "member_tags" ADD CONSTRAINT "member_tags_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "member_tags" ADD CONSTRAINT "member_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "households" ADD CONSTRAINT "households_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "family_members" ADD CONSTRAINT "family_members_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "family_members" ADD CONSTRAINT "family_members_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "member_notes" ADD CONSTRAINT "member_notes_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "member_notes" ADD CONSTRAINT "member_notes_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "member_notes" ADD CONSTRAINT "member_notes_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "member_documents" ADD CONSTRAINT "member_documents_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "member_documents" ADD CONSTRAINT "member_documents_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "member_activities" ADD CONSTRAINT "member_activities_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "member_activities" ADD CONSTRAINT "member_activities_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "member_activities" ADD CONSTRAINT "member_activities_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "giving_records" ADD CONSTRAINT "giving_records_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "giving_records" ADD CONSTRAINT "giving_records_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "prayer_requests" ADD CONSTRAINT "prayer_requests_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "prayer_requests" ADD CONSTRAINT "prayer_requests_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "volunteer_assignments" ADD CONSTRAINT "volunteer_assignments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "volunteer_assignments" ADD CONSTRAINT "volunteer_assignments_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "saved_member_filters" ADD CONSTRAINT "saved_member_filters_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "saved_member_filters" ADD CONSTRAINT "saved_member_filters_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "member_list_preferences" ADD CONSTRAINT "member_list_preferences_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "member_list_preferences" ADD CONSTRAINT "member_list_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
