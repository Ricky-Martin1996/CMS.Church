-- Enterprise Events & Church Calendar

CREATE TYPE "ChurchEventType" AS ENUM (
  'SUNDAY_SERVICE',
  'YOUTH_SERVICE',
  'PRAYER_MEETING',
  'BIBLE_STUDY',
  'CELL_GROUP',
  'CONFERENCE',
  'RETREAT',
  'WEDDING',
  'FUNERAL',
  'OUTREACH',
  'TRAINING',
  'CHILDREN_EVENT',
  'VOLUNTEER_MEETING',
  'CUSTOM'
);

CREATE TYPE "ChurchEventStatus" AS ENUM (
  'DRAFT',
  'PUBLISHED',
  'CANCELLED',
  'COMPLETED',
  'ARCHIVED'
);

CREATE TYPE "EventVisibility" AS ENUM (
  'PUBLIC',
  'MEMBERS',
  'INVITE_ONLY',
  'PRIVATE'
);

CREATE TYPE "RecurrenceFrequency" AS ENUM (
  'NONE',
  'DAILY',
  'WEEKLY',
  'BIWEEKLY',
  'MONTHLY',
  'YEARLY',
  'CUSTOM'
);

CREATE TYPE "RegistrationStatus" AS ENUM (
  'REGISTERED',
  'WAITLISTED',
  'CANCELLED',
  'CHECKED_IN',
  'NO_SHOW'
);

CREATE TYPE "RegistrantType" AS ENUM (
  'MEMBER',
  'VISITOR',
  'HOUSEHOLD',
  'GUEST',
  'GROUP'
);

CREATE TYPE "EventTicketStatus" AS ENUM (
  'VALID',
  'USED',
  'REVOKED',
  'EXPIRED'
);

CREATE TYPE "EventResourceType" AS ENUM (
  'ROOM',
  'EQUIPMENT',
  'VEHICLE',
  'OTHER'
);

CREATE TYPE "EventActivityType" AS ENUM (
  'CREATED',
  'UPDATED',
  'PUBLISHED',
  'CANCELLED',
  'REGISTRATION',
  'WAITLIST',
  'CHECKED_IN',
  'MESSAGE_QUEUED',
  'VOLUNTEER_LINKED',
  'ATTACHMENT_ADDED'
);

CREATE TYPE "EventMessageChannel" AS ENUM (
  'EMAIL',
  'WHATSAPP',
  'SMS',
  'PUSH',
  'IN_APP'
);

CREATE TABLE "church_events" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "heroImageUrl" TEXT,
    "eventType" "ChurchEventType" NOT NULL DEFAULT 'CUSTOM',
    "status" "ChurchEventStatus" NOT NULL DEFAULT 'DRAFT',
    "visibility" "EventVisibility" NOT NULL DEFAULT 'MEMBERS',
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "allDay" BOOLEAN NOT NULL DEFAULT false,
    "venueName" TEXT,
    "venueAddress" TEXT,
    "campus" TEXT,
    "capacity" INTEGER,
    "registrationOpen" BOOLEAN NOT NULL DEFAULT true,
    "waitlistEnabled" BOOLEAN NOT NULL DEFAULT true,
    "requiresTicket" BOOLEAN NOT NULL DEFAULT true,
    "organizerMemberId" TEXT,
    "organizerUserId" TEXT,
    "recurrence" "RecurrenceFrequency" NOT NULL DEFAULT 'NONE',
    "recurrenceRule" TEXT,
    "recurrenceUntil" TIMESTAMP(3),
    "parentEventId" TEXT,
    "scheduleEventId" TEXT,
    "checkInCode" TEXT NOT NULL,
    "notes" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "church_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "church_events_checkInCode_key" ON "church_events"("checkInCode");
CREATE UNIQUE INDEX "church_events_organizationId_slug_key" ON "church_events"("organizationId", "slug");
CREATE INDEX "church_events_organizationId_startsAt_idx" ON "church_events"("organizationId", "startsAt");
CREATE INDEX "church_events_organizationId_status_idx" ON "church_events"("organizationId", "status");
CREATE INDEX "church_events_organizationId_eventType_idx" ON "church_events"("organizationId", "eventType");
CREATE INDEX "church_events_organizationId_deletedAt_idx" ON "church_events"("organizationId", "deletedAt");
CREATE INDEX "church_events_checkInCode_idx" ON "church_events"("checkInCode");

ALTER TABLE "church_events" ADD CONSTRAINT "church_events_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "church_events" ADD CONSTRAINT "church_events_parentEventId_fkey" FOREIGN KEY ("parentEventId") REFERENCES "church_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "event_registrations" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "registrantType" "RegistrantType" NOT NULL DEFAULT 'MEMBER',
    "memberId" TEXT,
    "visitorId" TEXT,
    "householdId" TEXT,
    "guestName" TEXT,
    "guestEmail" TEXT,
    "guestPhone" TEXT,
    "partySize" INTEGER NOT NULL DEFAULT 1,
    "status" "RegistrationStatus" NOT NULL DEFAULT 'REGISTERED',
    "notes" TEXT,
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelledAt" TIMESTAMP(3),
    "checkedInAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "event_registrations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "event_registrations_organizationId_eventId_status_idx" ON "event_registrations"("organizationId", "eventId", "status");
CREATE INDEX "event_registrations_eventId_memberId_idx" ON "event_registrations"("eventId", "memberId");
CREATE INDEX "event_registrations_eventId_visitorId_idx" ON "event_registrations"("eventId", "visitorId");
CREATE INDEX "event_registrations_householdId_idx" ON "event_registrations"("householdId");
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "church_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "event_tickets" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "qrToken" TEXT NOT NULL,
    "status" "EventTicketStatus" NOT NULL DEFAULT 'VALID',
    "holderName" TEXT,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "event_tickets_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "event_tickets_qrToken_key" ON "event_tickets"("qrToken");
CREATE INDEX "event_tickets_organizationId_eventId_idx" ON "event_tickets"("organizationId", "eventId");
CREATE INDEX "event_tickets_qrToken_idx" ON "event_tickets"("qrToken");
ALTER TABLE "event_tickets" ADD CONSTRAINT "event_tickets_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "event_tickets" ADD CONSTRAINT "event_tickets_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "church_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "event_tickets" ADD CONSTRAINT "event_tickets_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "event_registrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "event_check_ins" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "registrationId" TEXT,
    "ticketId" TEXT,
    "memberId" TEXT,
    "method" TEXT NOT NULL DEFAULT 'QR',
    "checkedInAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkedInByUserId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "event_check_ins_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "event_check_ins_eventId_ticketId_key" ON "event_check_ins"("eventId", "ticketId");
CREATE INDEX "event_check_ins_organizationId_eventId_checkedInAt_idx" ON "event_check_ins"("organizationId", "eventId", "checkedInAt");
CREATE INDEX "event_check_ins_eventId_memberId_idx" ON "event_check_ins"("eventId", "memberId");
ALTER TABLE "event_check_ins" ADD CONSTRAINT "event_check_ins_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "event_check_ins" ADD CONSTRAINT "event_check_ins_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "church_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "event_check_ins" ADD CONSTRAINT "event_check_ins_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "event_registrations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "event_check_ins" ADD CONSTRAINT "event_check_ins_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "event_tickets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "event_speakers" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "memberId" TEXT,
    "name" TEXT NOT NULL,
    "title" TEXT,
    "bio" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "event_speakers_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "event_speakers_eventId_idx" ON "event_speakers"("eventId");
ALTER TABLE "event_speakers" ADD CONSTRAINT "event_speakers_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "event_speakers" ADD CONSTRAINT "event_speakers_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "church_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "event_attachments" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "url" TEXT,
    "storageKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "event_attachments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "event_attachments_eventId_idx" ON "event_attachments"("eventId");
ALTER TABLE "event_attachments" ADD CONSTRAINT "event_attachments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "event_attachments" ADD CONSTRAINT "event_attachments_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "church_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "event_resources" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "type" "EventResourceType" NOT NULL DEFAULT 'OTHER',
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "event_resources_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "event_resources_eventId_idx" ON "event_resources"("eventId");
ALTER TABLE "event_resources" ADD CONSTRAINT "event_resources_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "event_resources" ADD CONSTRAINT "event_resources_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "church_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "event_ministries" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "ministryId" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "event_ministries_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "event_ministries_eventId_ministryId_key" ON "event_ministries"("eventId", "ministryId");
CREATE INDEX "event_ministries_ministryId_idx" ON "event_ministries"("ministryId");
ALTER TABLE "event_ministries" ADD CONSTRAINT "event_ministries_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "event_ministries" ADD CONSTRAINT "event_ministries_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "church_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "event_ministries" ADD CONSTRAINT "event_ministries_ministryId_fkey" FOREIGN KEY ("ministryId") REFERENCES "ministries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "event_waitlist" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "memberId" TEXT,
    "visitorId" TEXT,
    "guestName" TEXT,
    "guestEmail" TEXT,
    "guestPhone" TEXT,
    "partySize" INTEGER NOT NULL DEFAULT 1,
    "position" INTEGER NOT NULL,
    "promotedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "event_waitlist_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "event_waitlist_eventId_position_idx" ON "event_waitlist"("eventId", "position");
ALTER TABLE "event_waitlist" ADD CONSTRAINT "event_waitlist_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "event_waitlist" ADD CONSTRAINT "event_waitlist_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "church_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "event_activities" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "type" "EventActivityType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "actorUserId" TEXT,
    "metadata" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "event_activities_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "event_activities_organizationId_eventId_occurredAt_idx" ON "event_activities"("organizationId", "eventId", "occurredAt");
ALTER TABLE "event_activities" ADD CONSTRAINT "event_activities_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "event_activities" ADD CONSTRAINT "event_activities_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "church_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "event_messages" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "channel" "EventMessageChannel" NOT NULL DEFAULT 'IN_APP',
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "actorUserId" TEXT,
    "metadata" JSONB,
    "scheduledFor" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "event_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "event_messages_organizationId_eventId_createdAt_idx" ON "event_messages"("organizationId", "eventId", "createdAt");
ALTER TABLE "event_messages" ADD CONSTRAINT "event_messages_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "event_messages" ADD CONSTRAINT "event_messages_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "church_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
