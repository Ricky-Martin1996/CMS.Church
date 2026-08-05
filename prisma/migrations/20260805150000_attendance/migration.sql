-- Expand AttendanceMethod
ALTER TYPE "AttendanceMethod" ADD VALUE IF NOT EXISTS 'SEARCH';
ALTER TYPE "AttendanceMethod" ADD VALUE IF NOT EXISTS 'HOUSEHOLD';
ALTER TYPE "AttendanceMethod" ADD VALUE IF NOT EXISTS 'VISITOR';
ALTER TYPE "AttendanceMethod" ADD VALUE IF NOT EXISTS 'VOLUNTEER';

CREATE TYPE "AttendanceSessionType" AS ENUM ('SUNDAY', 'YOUTH', 'PRAYER', 'CELL_GROUP', 'EVENT', 'VOLUNTEER', 'OTHER');
CREATE TYPE "AttendanceSessionStatus" AS ENUM ('SCHEDULED', 'LIVE', 'CLOSED', 'CANCELLED');
CREATE TYPE "AttendanceCheckStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED');

CREATE TABLE "attendance_sessions" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "serviceName" TEXT NOT NULL,
    "campus" TEXT,
    "ministry" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "attendanceType" "AttendanceSessionType" NOT NULL DEFAULT 'SUNDAY',
    "status" "AttendanceSessionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "expectedCount" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "attendance_sessions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "attendance_sessions_organizationId_date_idx" ON "attendance_sessions"("organizationId", "date");
CREATE INDEX "attendance_sessions_organizationId_status_idx" ON "attendance_sessions"("organizationId", "status");
CREATE INDEX "attendance_sessions_organizationId_attendanceType_idx" ON "attendance_sessions"("organizationId", "attendanceType");

ALTER TABLE "attendance_sessions"
  ADD CONSTRAINT "attendance_sessions_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Evolve attendance_records
ALTER TABLE "attendance_records" ADD COLUMN IF NOT EXISTS "sessionId" TEXT;
ALTER TABLE "attendance_records" ADD COLUMN IF NOT EXISTS "householdId" TEXT;
ALTER TABLE "attendance_records" ADD COLUMN IF NOT EXISTS "checkedInByUserId" TEXT;
ALTER TABLE "attendance_records" ADD COLUMN IF NOT EXISTS "attendanceStatus" "AttendanceCheckStatus" NOT NULL DEFAULT 'PRESENT';

CREATE UNIQUE INDEX IF NOT EXISTS "attendance_records_sessionId_memberId_key"
  ON "attendance_records"("sessionId", "memberId");
CREATE INDEX IF NOT EXISTS "attendance_records_organizationId_sessionId_idx"
  ON "attendance_records"("organizationId", "sessionId");
CREATE INDEX IF NOT EXISTS "attendance_records_householdId_idx"
  ON "attendance_records"("householdId");

ALTER TABLE "attendance_records"
  DROP CONSTRAINT IF EXISTS "attendance_records_sessionId_fkey";
ALTER TABLE "attendance_records"
  ADD CONSTRAINT "attendance_records_sessionId_fkey"
  FOREIGN KEY ("sessionId") REFERENCES "attendance_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "attendance_records"
  DROP CONSTRAINT IF EXISTS "attendance_records_householdId_fkey";
ALTER TABLE "attendance_records"
  ADD CONSTRAINT "attendance_records_householdId_fkey"
  FOREIGN KEY ("householdId") REFERENCES "households"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Visitors
CREATE TABLE "visitors" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "invitedByMemberId" TEXT,
    "householdId" TEXT,
    "familyName" TEXT,
    "childrenCount" INTEGER NOT NULL DEFAULT 0,
    "prayerRequest" TEXT,
    "notes" TEXT,
    "convertedMemberId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "visitors_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "visitors_organizationId_idx" ON "visitors"("organizationId");
CREATE INDEX "visitors_organizationId_email_idx" ON "visitors"("organizationId", "email");
CREATE INDEX "visitors_organizationId_phone_idx" ON "visitors"("organizationId", "phone");

ALTER TABLE "visitors"
  ADD CONSTRAINT "visitors_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "visitor_attendances" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "invitedByMemberId" TEXT,
    "isFirstVisit" BOOLEAN NOT NULL DEFAULT true,
    "isSecondVisit" BOOLEAN NOT NULL DEFAULT false,
    "convertedToMember" BOOLEAN NOT NULL DEFAULT false,
    "checkedInAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "visitor_attendances_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "visitor_attendances_sessionId_visitorId_key" ON "visitor_attendances"("sessionId", "visitorId");
CREATE INDEX "visitor_attendances_organizationId_sessionId_idx" ON "visitor_attendances"("organizationId", "sessionId");
CREATE INDEX "visitor_attendances_visitorId_idx" ON "visitor_attendances"("visitorId");

ALTER TABLE "visitor_attendances"
  ADD CONSTRAINT "visitor_attendances_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "visitor_attendances"
  ADD CONSTRAINT "visitor_attendances_visitorId_fkey"
  FOREIGN KEY ("visitorId") REFERENCES "visitors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "visitor_attendances"
  ADD CONSTRAINT "visitor_attendances_sessionId_fkey"
  FOREIGN KEY ("sessionId") REFERENCES "attendance_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
