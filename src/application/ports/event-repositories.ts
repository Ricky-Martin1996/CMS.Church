import type {
  ChurchEventEntity,
  CreateChurchEventInput,
  EventActivityEntity,
  EventAnalytics,
  EventCheckInEntity,
  EventCheckInInput,
  EventListItem,
  EventMessageEntity,
  EventProfile,
  EventRegistrationEntity,
  ListChurchEventsQuery,
  RegisterForEventInput,
} from "@/domain/entities/event";
import type {
  ChurchEventStatus,
  EventMessageChannel,
} from "@/domain/enums/event";

export type EventRepository = {
  listEvents(query: ListChurchEventsQuery): Promise<EventListItem[]>;
  getEventProfile(
    organizationId: string,
    eventId: string
  ): Promise<EventProfile | null>;
  createEvent(input: CreateChurchEventInput): Promise<ChurchEventEntity>;
  updateEvent(input: {
    organizationId: string;
    eventId: string;
    title?: string;
    description?: string | null;
    heroImageUrl?: string | null;
    eventType?: CreateChurchEventInput["eventType"];
    visibility?: CreateChurchEventInput["visibility"];
    startsAt?: Date;
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
    recurrence?: CreateChurchEventInput["recurrence"];
    recurrenceRule?: string | null;
    recurrenceUntil?: Date | null;
    scheduleEventId?: string | null;
    notes?: string | null;
    ministryIds?: string[];
    actorUserId?: string | null;
  }): Promise<ChurchEventEntity>;
  publishEvent(input: {
    organizationId: string;
    eventId: string;
    actorUserId?: string | null;
  }): Promise<ChurchEventEntity>;
  cancelEvent(input: {
    organizationId: string;
    eventId: string;
    actorUserId?: string | null;
  }): Promise<ChurchEventEntity>;
  softDeleteEvent(input: {
    organizationId: string;
    eventId: string;
    actorUserId?: string | null;
  }): Promise<void>;
  rescheduleEvent(input: {
    organizationId: string;
    eventId: string;
    startsAt: Date;
    endsAt?: Date | null;
    actorUserId?: string | null;
  }): Promise<ChurchEventEntity>;
  register(input: RegisterForEventInput): Promise<EventRegistrationEntity>;
  cancelRegistration(input: {
    organizationId: string;
    registrationId: string;
    actorUserId?: string | null;
  }): Promise<EventRegistrationEntity>;
  checkIn(input: EventCheckInInput): Promise<EventCheckInEntity>;
  queueMessage(input: {
    organizationId: string;
    eventId: string;
    channel: EventMessageChannel;
    subject?: string | null;
    body: string;
    scheduledFor?: Date | null;
    actorUserId?: string | null;
  }): Promise<EventMessageEntity>;
  linkMinistry(input: {
    organizationId: string;
    eventId: string;
    ministryId: string;
    notes?: string | null;
    actorUserId?: string | null;
  }): Promise<void>;
  getAnalytics(organizationId: string): Promise<EventAnalytics>;
  listActivities(
    organizationId: string,
    eventId: string,
    limit?: number
  ): Promise<EventActivityEntity[]>;
  setStatus(input: {
    organizationId: string;
    eventId: string;
    status: ChurchEventStatus;
    actorUserId?: string | null;
  }): Promise<ChurchEventEntity>;
};
