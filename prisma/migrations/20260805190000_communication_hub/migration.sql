-- Enterprise Communication Hub

CREATE TYPE "HubChannel" AS ENUM ('EMAIL', 'WHATSAPP', 'SMS', 'PUSH', 'INTERNAL');
CREATE TYPE "HubMessageStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'QUEUED', 'SENDING', 'SENT', 'FAILED', 'ARCHIVED');
CREATE TYPE "HubMessageDirection" AS ENUM ('OUTBOUND', 'INBOUND');
CREATE TYPE "HubAudienceType" AS ENUM ('ALL_MEMBERS', 'VISITORS', 'HOUSEHOLDS', 'CELL_GROUPS', 'VOLUNTEERS', 'MINISTRY', 'EVENT_REGISTRANTS', 'CUSTOM');
CREATE TYPE "HubAutomationTrigger" AS ENUM ('NEW_VISITOR', 'BIRTHDAY', 'ANNIVERSARY', 'EVENT_REMINDER', 'VOLUNTEER_ASSIGNMENT', 'ATTENDANCE_MISSED', 'PRAYER_ASSIGNED', 'MEMBERSHIP_APPROVED', 'FOLLOW_UP_TASK_DUE');
CREATE TYPE "HubDeliveryStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'OPENED', 'CLICKED', 'FAILED', 'BOUNCED');
CREATE TYPE "HubProviderKind" AS ENUM ('RESEND', 'TWILIO', 'WHATSAPP_BUSINESS', 'FIREBASE', 'INTERNAL');
CREATE TYPE "HubActivityType" AS ENUM ('CREATED', 'UPDATED', 'SCHEDULED', 'QUEUED', 'SENT', 'FAILED', 'ARCHIVED', 'TEMPLATE_USED', 'AUTOMATION_FIRED', 'DELIVERY_UPDATED');

CREATE TABLE "communication_templates" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "channel" "HubChannel" NOT NULL,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "variables" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "communication_templates_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "communication_templates_organizationId_slug_key" ON "communication_templates"("organizationId", "slug");
CREATE INDEX "communication_templates_organizationId_channel_idx" ON "communication_templates"("organizationId", "channel");
ALTER TABLE "communication_templates" ADD CONSTRAINT "communication_templates_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "communication_campaigns" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "channel" "HubChannel" NOT NULL,
    "audienceType" "HubAudienceType" NOT NULL DEFAULT 'ALL_MEMBERS',
    "audienceFilter" JSONB,
    "templateId" TEXT,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "status" "HubMessageStatus" NOT NULL DEFAULT 'DRAFT',
    "scheduledFor" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "communication_campaigns_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "communication_campaigns_organizationId_status_idx" ON "communication_campaigns"("organizationId", "status");
CREATE INDEX "communication_campaigns_organizationId_scheduledFor_idx" ON "communication_campaigns"("organizationId", "scheduledFor");
ALTER TABLE "communication_campaigns" ADD CONSTRAINT "communication_campaigns_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "communication_campaigns" ADD CONSTRAINT "communication_campaigns_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "communication_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "communication_messages" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "campaignId" TEXT,
    "templateId" TEXT,
    "channel" "HubChannel" NOT NULL,
    "direction" "HubMessageDirection" NOT NULL DEFAULT 'OUTBOUND',
    "status" "HubMessageStatus" NOT NULL DEFAULT 'DRAFT',
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "audienceType" "HubAudienceType",
    "audienceFilter" JSONB,
    "metadata" JSONB,
    "scheduledFor" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "createdByUserId" TEXT,
    "memberId" TEXT,
    "visitorId" TEXT,
    "householdId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "communication_messages_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "communication_messages_organizationId_status_createdAt_idx" ON "communication_messages"("organizationId", "status", "createdAt");
CREATE INDEX "communication_messages_organizationId_direction_createdAt_idx" ON "communication_messages"("organizationId", "direction", "createdAt");
CREATE INDEX "communication_messages_organizationId_channel_idx" ON "communication_messages"("organizationId", "channel");
CREATE INDEX "communication_messages_campaignId_idx" ON "communication_messages"("campaignId");
CREATE INDEX "communication_messages_memberId_idx" ON "communication_messages"("memberId");
CREATE INDEX "communication_messages_visitorId_idx" ON "communication_messages"("visitorId");
CREATE INDEX "communication_messages_householdId_idx" ON "communication_messages"("householdId");
ALTER TABLE "communication_messages" ADD CONSTRAINT "communication_messages_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "communication_messages" ADD CONSTRAINT "communication_messages_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "communication_campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "communication_messages" ADD CONSTRAINT "communication_messages_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "communication_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "communication_deliveries" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "campaignId" TEXT,
    "channel" "HubChannel" NOT NULL,
    "status" "HubDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "recipientName" TEXT,
    "recipientEmail" TEXT,
    "recipientPhone" TEXT,
    "memberId" TEXT,
    "visitorId" TEXT,
    "householdId" TEXT,
    "provider" "HubProviderKind" NOT NULL DEFAULT 'INTERNAL',
    "externalId" TEXT,
    "metadata" JSONB,
    "errorMessage" TEXT,
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),
    "clickedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "communication_deliveries_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "communication_deliveries_organizationId_status_idx" ON "communication_deliveries"("organizationId", "status");
CREATE INDEX "communication_deliveries_messageId_idx" ON "communication_deliveries"("messageId");
CREATE INDEX "communication_deliveries_campaignId_idx" ON "communication_deliveries"("campaignId");
CREATE INDEX "communication_deliveries_memberId_idx" ON "communication_deliveries"("memberId");
CREATE INDEX "communication_deliveries_visitorId_idx" ON "communication_deliveries"("visitorId");
CREATE INDEX "communication_deliveries_householdId_idx" ON "communication_deliveries"("householdId");
ALTER TABLE "communication_deliveries" ADD CONSTRAINT "communication_deliveries_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "communication_deliveries" ADD CONSTRAINT "communication_deliveries_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "communication_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "communication_deliveries" ADD CONSTRAINT "communication_deliveries_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "communication_campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "communication_automations" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "trigger" "HubAutomationTrigger" NOT NULL,
    "channel" "HubChannel" NOT NULL,
    "templateId" TEXT,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB,
    "lastFiredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "communication_automations_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "communication_automations_organizationId_trigger_isActive_idx" ON "communication_automations"("organizationId", "trigger", "isActive");
ALTER TABLE "communication_automations" ADD CONSTRAINT "communication_automations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "communication_automations" ADD CONSTRAINT "communication_automations_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "communication_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "communication_activities" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "type" "HubActivityType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "actorUserId" TEXT,
    "campaignId" TEXT,
    "messageId" TEXT,
    "metadata" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "communication_activities_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "communication_activities_organizationId_occurredAt_idx" ON "communication_activities"("organizationId", "occurredAt");
CREATE INDEX "communication_activities_campaignId_idx" ON "communication_activities"("campaignId");
CREATE INDEX "communication_activities_messageId_idx" ON "communication_activities"("messageId");
ALTER TABLE "communication_activities" ADD CONSTRAINT "communication_activities_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "communication_activities" ADD CONSTRAINT "communication_activities_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "communication_campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "communication_activities" ADD CONSTRAINT "communication_activities_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "communication_messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "communication_provider_configs" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "provider" "HubProviderKind" NOT NULL,
    "channel" "HubChannel" NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "communication_provider_configs_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "communication_provider_configs_organizationId_provider_channel_key" ON "communication_provider_configs"("organizationId", "provider", "channel");
ALTER TABLE "communication_provider_configs" ADD CONSTRAINT "communication_provider_configs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
