CREATE TYPE "VisitorPipelineStage" AS ENUM (
  'FIRST_VISIT', 'WELCOME_SENT', 'ASSIGNED_LEADER', 'CONTACTED',
  'SECOND_VISIT', 'CELL_GROUP_INVITED', 'FOUNDATION_COURSE',
  'MEMBERSHIP_INTERVIEW', 'MEMBER'
);

CREATE TYPE "FollowUpTaskType" AS ENUM (
  'CALL', 'WHATSAPP', 'EMAIL_WELCOME', 'INVITE_SERVICE', 'INVITE_CELL', 'HOME_VISIT', 'CUSTOM'
);

CREATE TYPE "FollowUpTaskStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'DONE', 'CANCELLED', 'SNOOZED');
CREATE TYPE "FollowUpPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
CREATE TYPE "CommunicationChannel" AS ENUM ('PHONE', 'EMAIL', 'WHATSAPP', 'SMS', 'IN_PERSON', 'NOTE');
CREATE TYPE "CommunicationDirection" AS ENUM ('OUTBOUND', 'INBOUND');
CREATE TYPE "VisitorActivityType" AS ENUM (
  'CREATED', 'STAGE_CHANGED', 'LEADER_ASSIGNED', 'TASK_CREATED', 'TASK_COMPLETED',
  'COMMUNICATION', 'ATTENDED', 'NOTE_ADDED', 'CONVERTED', 'AUTOMATION'
);

ALTER TABLE "visitors" ADD COLUMN IF NOT EXISTS "status" "VisitorPipelineStage" NOT NULL DEFAULT 'FIRST_VISIT';
ALTER TABLE "visitors" ADD COLUMN IF NOT EXISTS "assignedLeaderId" TEXT;
ALTER TABLE "visitors" ADD COLUMN IF NOT EXISTS "assignedUserId" TEXT;
ALTER TABLE "visitors" ADD COLUMN IF NOT EXISTS "stageEnteredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "visitors" ADD COLUMN IF NOT EXISTS "source" TEXT;
ALTER TABLE "visitors" ADD COLUMN IF NOT EXISTS "preferredChannel" "CommunicationChannel";

CREATE INDEX IF NOT EXISTS "visitors_organizationId_status_idx" ON "visitors"("organizationId", "status");
CREATE INDEX IF NOT EXISTS "visitors_assignedLeaderId_idx" ON "visitors"("assignedLeaderId");
CREATE INDEX IF NOT EXISTS "visitors_assignedUserId_idx" ON "visitors"("assignedUserId");

CREATE TABLE "visitor_journeys" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "currentStage" "VisitorPipelineStage" NOT NULL DEFAULT 'FIRST_VISIT',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "convertedAt" TIMESTAMP(3),
    "conversionMemberId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "visitor_journeys_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "visitor_journeys_visitorId_key" ON "visitor_journeys"("visitorId");
CREATE INDEX "visitor_journeys_organizationId_currentStage_idx" ON "visitor_journeys"("organizationId", "currentStage");
ALTER TABLE "visitor_journeys" ADD CONSTRAINT "visitor_journeys_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "visitor_journeys" ADD CONSTRAINT "visitor_journeys_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "visitors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "visitor_stage_configs" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "stageKey" "VisitorPipelineStage" NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "autoTaskTypes" JSONB,
    "slaHours" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "visitor_stage_configs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "visitor_stage_configs_organizationId_stageKey_key" ON "visitor_stage_configs"("organizationId", "stageKey");
CREATE INDEX "visitor_stage_configs_organizationId_sortOrder_idx" ON "visitor_stage_configs"("organizationId", "sortOrder");
ALTER TABLE "visitor_stage_configs" ADD CONSTRAINT "visitor_stage_configs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "follow_up_tasks" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "type" "FollowUpTaskType" NOT NULL DEFAULT 'CUSTOM',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "ownerUserId" TEXT,
    "dueAt" TIMESTAMP(3),
    "priority" "FollowUpPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "FollowUpTaskStatus" NOT NULL DEFAULT 'OPEN',
    "notes" TEXT,
    "completedAt" TIMESTAMP(3),
    "automationKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "follow_up_tasks_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "follow_up_tasks_organizationId_automationKey_key" ON "follow_up_tasks"("organizationId", "automationKey");
CREATE INDEX "follow_up_tasks_organizationId_status_dueAt_idx" ON "follow_up_tasks"("organizationId", "status", "dueAt");
CREATE INDEX "follow_up_tasks_visitorId_idx" ON "follow_up_tasks"("visitorId");
CREATE INDEX "follow_up_tasks_ownerUserId_idx" ON "follow_up_tasks"("ownerUserId");
ALTER TABLE "follow_up_tasks" ADD CONSTRAINT "follow_up_tasks_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "follow_up_tasks" ADD CONSTRAINT "follow_up_tasks_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "visitors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "communication_logs" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "channel" "CommunicationChannel" NOT NULL,
    "direction" "CommunicationDirection" NOT NULL DEFAULT 'OUTBOUND',
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "actorUserId" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "communication_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "communication_logs_organizationId_visitorId_occurredAt_idx" ON "communication_logs"("organizationId", "visitorId", "occurredAt");
CREATE INDEX "communication_logs_visitorId_idx" ON "communication_logs"("visitorId");
ALTER TABLE "communication_logs" ADD CONSTRAINT "communication_logs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "communication_logs" ADD CONSTRAINT "communication_logs_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "visitors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "visitor_status_history" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "fromStatus" "VisitorPipelineStage",
    "toStatus" "VisitorPipelineStage" NOT NULL,
    "changedByUserId" TEXT,
    "note" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "visitor_status_history_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "visitor_status_history_organizationId_visitorId_occurredAt_idx" ON "visitor_status_history"("organizationId", "visitorId", "occurredAt");
ALTER TABLE "visitor_status_history" ADD CONSTRAINT "visitor_status_history_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "visitor_status_history" ADD CONSTRAINT "visitor_status_history_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "visitors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "visitor_activities" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "type" "VisitorActivityType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "actorUserId" TEXT,
    "metadata" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "visitor_activities_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "visitor_activities_organizationId_visitorId_occurredAt_idx" ON "visitor_activities"("organizationId", "visitorId", "occurredAt");
ALTER TABLE "visitor_activities" ADD CONSTRAINT "visitor_activities_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "visitor_activities" ADD CONSTRAINT "visitor_activities_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "visitors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
