-- Ministry & Volunteer Management

CREATE TYPE "MinistryStatus" AS ENUM ('ACTIVE', 'PAUSED', 'ARCHIVED');
CREATE TYPE "TrainingStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'EXPIRED');
CREATE TYPE "ScheduleEventType" AS ENUM ('SUNDAY_SERVICE', 'CONFERENCE', 'YOUTH_NIGHT', 'PRAYER_MEETING', 'SPECIAL_EVENT', 'OTHER');
CREATE TYPE "ScheduleAssignmentStatus" AS ENUM ('ASSIGNED', 'CONFIRMED', 'DECLINED', 'CANCELLED', 'COMPLETED', 'NO_SHOW');
CREATE TYPE "SwapRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED');
CREATE TYPE "VolunteerCheckInStatus" AS ENUM ('CHECKED_IN', 'LATE', 'ABSENT', 'EXCUSED');
CREATE TYPE "VolunteerMessageChannel" AS ENUM ('EMAIL', 'WHATSAPP', 'SMS', 'IN_APP');
CREATE TYPE "VolunteerActivityType" AS ENUM ('CREATED', 'UPDATED', 'ASSIGNED', 'CONFIRMED', 'DECLINED', 'SWAP_REQUESTED', 'SWAP_ACCEPTED', 'CHECKED_IN', 'MESSAGE_SENT', 'TRAINING_UPDATED');
CREATE TYPE "Weekday" AS ENUM ('SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT');

CREATE TABLE "ministries" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT NOT NULL DEFAULT '#0d9488',
    "icon" TEXT,
    "status" "MinistryStatus" NOT NULL DEFAULT 'ACTIVE',
    "leaderMemberId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ministries_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ministries_organizationId_slug_key" ON "ministries"("organizationId", "slug");
CREATE INDEX "ministries_organizationId_status_idx" ON "ministries"("organizationId", "status");
ALTER TABLE "ministries" ADD CONSTRAINT "ministries_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ministry_roles" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "ministryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "slotsNeeded" INTEGER NOT NULL DEFAULT 1,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ministry_roles_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ministry_roles_organizationId_ministryId_idx" ON "ministry_roles"("organizationId", "ministryId");
ALTER TABLE "ministry_roles" ADD CONSTRAINT "ministry_roles_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ministry_roles" ADD CONSTRAINT "ministry_roles_ministryId_fkey" FOREIGN KEY ("ministryId") REFERENCES "ministries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "volunteer_profiles" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "experienceYears" INTEGER,
    "trainingStatus" "TrainingStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "preferredService" TEXT,
    "emergencyName" TEXT,
    "emergencyPhone" TEXT,
    "notes" TEXT,
    "reliabilityScore" INTEGER NOT NULL DEFAULT 80,
    "totalHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "volunteer_profiles_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "volunteer_profiles_memberId_key" ON "volunteer_profiles"("memberId");
CREATE INDEX "volunteer_profiles_organizationId_isActive_idx" ON "volunteer_profiles"("organizationId", "isActive");
ALTER TABLE "volunteer_profiles" ADD CONSTRAINT "volunteer_profiles_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "volunteer_profiles" ADD CONSTRAINT "volunteer_profiles_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "volunteer_skills" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "volunteerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "volunteer_skills_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "volunteer_skills_volunteerId_idx" ON "volunteer_skills"("volunteerId");
ALTER TABLE "volunteer_skills" ADD CONSTRAINT "volunteer_skills_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "volunteer_skills" ADD CONSTRAINT "volunteer_skills_volunteerId_fkey" FOREIGN KEY ("volunteerId") REFERENCES "volunteer_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "volunteer_certifications" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "volunteerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "issuer" TEXT,
    "issuedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "volunteer_certifications_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "volunteer_certifications_volunteerId_idx" ON "volunteer_certifications"("volunteerId");
ALTER TABLE "volunteer_certifications" ADD CONSTRAINT "volunteer_certifications_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "volunteer_certifications" ADD CONSTRAINT "volunteer_certifications_volunteerId_fkey" FOREIGN KEY ("volunteerId") REFERENCES "volunteer_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "volunteer_availabilities" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "volunteerId" TEXT NOT NULL,
    "weekday" "Weekday" NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "volunteer_availabilities_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "volunteer_availabilities_volunteerId_idx" ON "volunteer_availabilities"("volunteerId");
ALTER TABLE "volunteer_availabilities" ADD CONSTRAINT "volunteer_availabilities_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "volunteer_availabilities" ADD CONSTRAINT "volunteer_availabilities_volunteerId_fkey" FOREIGN KEY ("volunteerId") REFERENCES "volunteer_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "volunteer_ministry_preferences" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "volunteerId" TEXT NOT NULL,
    "ministryId" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "volunteer_ministry_preferences_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "volunteer_ministry_preferences_volunteerId_ministryId_key" ON "volunteer_ministry_preferences"("volunteerId", "ministryId");
ALTER TABLE "volunteer_ministry_preferences" ADD CONSTRAINT "volunteer_ministry_preferences_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "volunteer_ministry_preferences" ADD CONSTRAINT "volunteer_ministry_preferences_volunteerId_fkey" FOREIGN KEY ("volunteerId") REFERENCES "volunteer_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "volunteer_ministry_preferences" ADD CONSTRAINT "volunteer_ministry_preferences_ministryId_fkey" FOREIGN KEY ("ministryId") REFERENCES "ministries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "schedule_events" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "ministryId" TEXT,
    "title" TEXT NOT NULL,
    "eventType" "ScheduleEventType" NOT NULL DEFAULT 'SUNDAY_SERVICE',
    "campus" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "location" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "schedule_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "schedule_events_organizationId_startsAt_idx" ON "schedule_events"("organizationId", "startsAt");
CREATE INDEX "schedule_events_ministryId_idx" ON "schedule_events"("ministryId");
ALTER TABLE "schedule_events" ADD CONSTRAINT "schedule_events_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "schedule_events" ADD CONSTRAINT "schedule_events_ministryId_fkey" FOREIGN KEY ("ministryId") REFERENCES "ministries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "schedule_slots" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "roleId" TEXT,
    "title" TEXT NOT NULL,
    "needed" INTEGER NOT NULL DEFAULT 1,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "schedule_slots_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "schedule_slots_organizationId_eventId_idx" ON "schedule_slots"("organizationId", "eventId");
ALTER TABLE "schedule_slots" ADD CONSTRAINT "schedule_slots_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "schedule_slots" ADD CONSTRAINT "schedule_slots_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "schedule_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "schedule_slots" ADD CONSTRAINT "schedule_slots_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "ministry_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "schedule_assignments" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "slotId" TEXT NOT NULL,
    "volunteerId" TEXT NOT NULL,
    "status" "ScheduleAssignmentStatus" NOT NULL DEFAULT 'ASSIGNED',
    "notes" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "schedule_assignments_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "schedule_assignments_slotId_volunteerId_key" ON "schedule_assignments"("slotId", "volunteerId");
CREATE INDEX "schedule_assignments_organizationId_volunteerId_idx" ON "schedule_assignments"("organizationId", "volunteerId");
CREATE INDEX "schedule_assignments_slotId_status_idx" ON "schedule_assignments"("slotId", "status");
ALTER TABLE "schedule_assignments" ADD CONSTRAINT "schedule_assignments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "schedule_assignments" ADD CONSTRAINT "schedule_assignments_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "schedule_slots"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "schedule_assignments" ADD CONSTRAINT "schedule_assignments_volunteerId_fkey" FOREIGN KEY ("volunteerId") REFERENCES "volunteer_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "schedule_swap_requests" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "fromAssignmentId" TEXT NOT NULL,
    "toAssignmentId" TEXT,
    "fromVolunteerId" TEXT NOT NULL,
    "toVolunteerId" TEXT,
    "status" "SwapRequestStatus" NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    CONSTRAINT "schedule_swap_requests_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "schedule_swap_requests_organizationId_status_idx" ON "schedule_swap_requests"("organizationId", "status");
ALTER TABLE "schedule_swap_requests" ADD CONSTRAINT "schedule_swap_requests_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "schedule_swap_requests" ADD CONSTRAINT "schedule_swap_requests_fromAssignmentId_fkey" FOREIGN KEY ("fromAssignmentId") REFERENCES "schedule_assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "schedule_swap_requests" ADD CONSTRAINT "schedule_swap_requests_toAssignmentId_fkey" FOREIGN KEY ("toAssignmentId") REFERENCES "schedule_assignments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "schedule_swap_requests" ADD CONSTRAINT "schedule_swap_requests_fromVolunteerId_fkey" FOREIGN KEY ("fromVolunteerId") REFERENCES "volunteer_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "schedule_swap_requests" ADD CONSTRAINT "schedule_swap_requests_toVolunteerId_fkey" FOREIGN KEY ("toVolunteerId") REFERENCES "volunteer_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "volunteer_check_ins" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "volunteerId" TEXT NOT NULL,
    "assignmentId" TEXT,
    "status" "VolunteerCheckInStatus" NOT NULL DEFAULT 'CHECKED_IN',
    "checkedInAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "volunteer_check_ins_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "volunteer_check_ins_organizationId_volunteerId_checkedInAt_idx" ON "volunteer_check_ins"("organizationId", "volunteerId", "checkedInAt");
ALTER TABLE "volunteer_check_ins" ADD CONSTRAINT "volunteer_check_ins_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "volunteer_check_ins" ADD CONSTRAINT "volunteer_check_ins_volunteerId_fkey" FOREIGN KEY ("volunteerId") REFERENCES "volunteer_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "volunteer_check_ins" ADD CONSTRAINT "volunteer_check_ins_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "schedule_assignments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "volunteer_messages" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "volunteerId" TEXT,
    "ministryId" TEXT,
    "channel" "VolunteerMessageChannel" NOT NULL DEFAULT 'IN_APP',
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "actorUserId" TEXT,
    "metadata" JSONB,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "volunteer_messages_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "volunteer_messages_organizationId_sentAt_idx" ON "volunteer_messages"("organizationId", "sentAt");
ALTER TABLE "volunteer_messages" ADD CONSTRAINT "volunteer_messages_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "volunteer_messages" ADD CONSTRAINT "volunteer_messages_volunteerId_fkey" FOREIGN KEY ("volunteerId") REFERENCES "volunteer_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "volunteer_messages" ADD CONSTRAINT "volunteer_messages_ministryId_fkey" FOREIGN KEY ("ministryId") REFERENCES "ministries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "volunteer_activities" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "volunteerId" TEXT NOT NULL,
    "type" "VolunteerActivityType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "actorUserId" TEXT,
    "metadata" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "volunteer_activities_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "volunteer_activities_organizationId_volunteerId_occurredAt_idx" ON "volunteer_activities"("organizationId", "volunteerId", "occurredAt");
ALTER TABLE "volunteer_activities" ADD CONSTRAINT "volunteer_activities_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "volunteer_activities" ADD CONSTRAINT "volunteer_activities_volunteerId_fkey" FOREIGN KEY ("volunteerId") REFERENCES "volunteer_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
