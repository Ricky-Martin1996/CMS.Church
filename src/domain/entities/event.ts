import type {
  ChurchEventStatus,
  ChurchEventType,
  EventActivityType,
  EventMessageChannel,
  EventResourceType,
  EventTicketStatus,
  EventVisibility,
  RecurrenceFrequency,
  RegistrantType,
  RegistrationStatus,
} from "@/domain/enums/event";

export type ChurchEventEntity = {
  id: string;
  organizationId: string;
  title: string;
  slug: string;
  description: string | null;
  heroImageUrl: string | null;
  eventType: ChurchEventType;
  status: ChurchEventStatus;
  visibility: EventVisibility;
  startsAt: Date;
  endsAt: Date | null;
  timezone: string;
  allDay: boolean;
  venueName: string | null;
  venueAddress: string | null;
  campus: string | null;
  capacity: number | null;
  registrationOpen: boolean;
  waitlistEnabled: boolean;
  requiresTicket: boolean;
  organizerMemberId: string | null;
  organizerUserId: string | null;
  recurrence: RecurrenceFrequency;
  recurrenceRule: string | null;
  recurrenceUntil: Date | null;
  parentEventId: string | null;
  scheduleEventId: string | null;
  checkInCode: string;
  notes: string | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  registrationCount?: number;
  waitlistCount?: number;
  checkInCount?: number;
  ministryCount?: number;
};

export type EventListItem = ChurchEventEntity & {
  capacityUsage: number | null;
  seatsRemaining: number | null;
};

export type EventSpeakerEntity = {
  id: string;
  organizationId: string;
  eventId: string;
  memberId: string | null;
  name: string;
  title: string | null;
  bio: string | null;
  sortOrder: number;
  createdAt: Date;
};

export type EventAttachmentEntity = {
  id: string;
  organizationId: string;
  eventId: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  url: string | null;
  storageKey: string;
  createdAt: Date;
};

export type EventResourceEntity = {
  id: string;
  organizationId: string;
  eventId: string;
  type: EventResourceType;
  name: string;
  quantity: number;
  notes: string | null;
  createdAt: Date;
};

export type EventMinistryLink = {
  id: string;
  organizationId: string;
  eventId: string;
  ministryId: string;
  ministryName: string;
  ministryColor: string;
  notes: string | null;
  createdAt: Date;
};

export type EventTicketEntity = {
  id: string;
  organizationId: string;
  eventId: string;
  registrationId: string;
  qrToken: string;
  status: EventTicketStatus;
  holderName: string | null;
  issuedAt: Date;
  usedAt: Date | null;
  createdAt: Date;
};

export type EventRegistrationEntity = {
  id: string;
  organizationId: string;
  eventId: string;
  registrantType: RegistrantType;
  memberId: string | null;
  visitorId: string | null;
  householdId: string | null;
  guestName: string | null;
  guestEmail: string | null;
  guestPhone: string | null;
  partySize: number;
  status: RegistrationStatus;
  notes: string | null;
  registeredAt: Date;
  cancelledAt: Date | null;
  checkedInAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  displayName: string;
  tickets?: EventTicketEntity[];
};

export type EventCheckInEntity = {
  id: string;
  organizationId: string;
  eventId: string;
  registrationId: string | null;
  ticketId: string | null;
  memberId: string | null;
  method: string;
  checkedInAt: Date;
  checkedInByUserId: string | null;
  notes: string | null;
  createdAt: Date;
  displayName?: string;
};

export type EventWaitlistEntity = {
  id: string;
  organizationId: string;
  eventId: string;
  memberId: string | null;
  visitorId: string | null;
  guestName: string | null;
  guestEmail: string | null;
  guestPhone: string | null;
  partySize: number;
  position: number;
  promotedAt: Date | null;
  createdAt: Date;
  displayName: string;
};

export type EventActivityEntity = {
  id: string;
  organizationId: string;
  eventId: string;
  type: EventActivityType;
  title: string;
  description: string | null;
  actorUserId: string | null;
  metadata: Record<string, unknown> | null;
  occurredAt: Date;
  createdAt: Date;
};

export type EventMessageEntity = {
  id: string;
  organizationId: string;
  eventId: string;
  channel: EventMessageChannel;
  subject: string | null;
  body: string;
  actorUserId: string | null;
  metadata: Record<string, unknown> | null;
  scheduledFor: Date | null;
  sentAt: Date | null;
  createdAt: Date;
};

export type VolunteerStaffingGap = {
  ministryId: string;
  ministryName: string;
  scheduleEventId: string | null;
  slotsNeeded: number;
  slotsFilled: number;
  gap: number;
};

export type VolunteerConflict = {
  volunteerId: string;
  volunteerName: string;
  conflictingEventTitle: string;
  conflictingStartsAt: Date;
};

export type EventVolunteerSummary = {
  scheduleEventId: string | null;
  gaps: VolunteerStaffingGap[];
  conflicts: VolunteerConflict[];
  coveragePercent: number;
};

export type EventProfile = {
  event: ChurchEventEntity;
  speakers: EventSpeakerEntity[];
  attachments: EventAttachmentEntity[];
  resources: EventResourceEntity[];
  ministries: EventMinistryLink[];
  registrations: EventRegistrationEntity[];
  waitlist: EventWaitlistEntity[];
  checkIns: EventCheckInEntity[];
  activities: EventActivityEntity[];
  messages: EventMessageEntity[];
  volunteer: EventVolunteerSummary;
};

export type EventAnalytics = {
  totalEvents: number;
  publishedEvents: number;
  upcomingEvents: number;
  totalRegistrations: number;
  totalCheckIns: number;
  noShowRate: number;
  averageCapacityUsage: number;
  volunteerCoverage: number;
  registrationsByType: Array<{ type: RegistrantType; count: number }>;
  eventsByType: Array<{ type: ChurchEventType; count: number }>;
  recentActivity: EventActivityEntity[];
};

export type CalendarViewMode = "month" | "week" | "agenda" | "timeline";

export type ListChurchEventsQuery = {
  organizationId: string;
  from?: Date;
  to?: Date;
  status?: ChurchEventStatus;
  eventType?: ChurchEventType;
  search?: string;
  limit?: number;
};

export type CreateChurchEventInput = {
  organizationId: string;
  title: string;
  slug: string;
  description?: string | null;
  heroImageUrl?: string | null;
  eventType?: ChurchEventType;
  visibility?: EventVisibility;
  startsAt: Date;
  endsAt?: Date | null;
  timezone?: string;
  allDay?: boolean;
  venueName?: string | null;
  venueAddress?: string | null;
  campus?: string | null;
  capacity?: number | null;
  registrationOpen?: boolean;
  waitlistEnabled?: boolean;
  requiresTicket?: boolean;
  organizerMemberId?: string | null;
  recurrence?: RecurrenceFrequency;
  recurrenceRule?: string | null;
  recurrenceUntil?: Date | null;
  scheduleEventId?: string | null;
  notes?: string | null;
  ministryIds?: string[];
  speakers?: Array<{
    name: string;
    title?: string | null;
    bio?: string | null;
    memberId?: string | null;
  }>;
  resources?: Array<{
    type?: EventResourceType;
    name: string;
    quantity?: number;
    notes?: string | null;
  }>;
  actorUserId?: string | null;
  publish?: boolean;
};

export type RegisterForEventInput = {
  organizationId: string;
  eventId: string;
  registrantType: RegistrantType;
  memberId?: string | null;
  visitorId?: string | null;
  householdId?: string | null;
  guestName?: string | null;
  guestEmail?: string | null;
  guestPhone?: string | null;
  partySize?: number;
  notes?: string | null;
  actorUserId?: string | null;
};

export type EventCheckInInput = {
  organizationId: string;
  eventId: string;
  method: "QR" | "SEARCH" | "MANUAL";
  qrToken?: string | null;
  registrationId?: string | null;
  memberId?: string | null;
  guestName?: string | null;
  notes?: string | null;
  actorUserId?: string | null;
};
