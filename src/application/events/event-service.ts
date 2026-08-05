import type {
  CreateChurchEventInput,
  EventCheckInInput,
  ListChurchEventsQuery,
  RegisterForEventInput,
} from "@/domain/entities/event";
import type {
  ChurchEventStatus,
  EventMessageChannel,
} from "@/domain/enums/event";
import { eventRepository } from "@/infrastructure/repositories/event-repository";
import { notFound } from "@/server/errors";

export async function listChurchEvents(query: ListChurchEventsQuery) {
  return eventRepository.listEvents(query);
}

export async function getChurchEventProfile(
  organizationId: string,
  eventId: string
) {
  const profile = await eventRepository.getEventProfile(
    organizationId,
    eventId
  );
  if (!profile) throw notFound("Event not found");
  return profile;
}

export async function createChurchEvent(input: CreateChurchEventInput) {
  return eventRepository.createEvent(input);
}

export async function updateChurchEvent(
  input: Parameters<typeof eventRepository.updateEvent>[0]
) {
  return eventRepository.updateEvent(input);
}

export async function publishChurchEvent(input: {
  organizationId: string;
  eventId: string;
  actorUserId?: string | null;
}) {
  return eventRepository.publishEvent(input);
}

export async function cancelChurchEvent(input: {
  organizationId: string;
  eventId: string;
  actorUserId?: string | null;
}) {
  return eventRepository.cancelEvent(input);
}

export async function softDeleteChurchEvent(input: {
  organizationId: string;
  eventId: string;
  actorUserId?: string | null;
}) {
  return eventRepository.softDeleteEvent(input);
}

export async function rescheduleChurchEvent(input: {
  organizationId: string;
  eventId: string;
  startsAt: Date;
  endsAt?: Date | null;
  actorUserId?: string | null;
}) {
  return eventRepository.rescheduleEvent(input);
}

export async function registerForChurchEvent(input: RegisterForEventInput) {
  return eventRepository.register(input);
}

export async function cancelEventRegistration(input: {
  organizationId: string;
  registrationId: string;
  actorUserId?: string | null;
}) {
  return eventRepository.cancelRegistration(input);
}

export async function checkInToChurchEvent(input: EventCheckInInput) {
  return eventRepository.checkIn(input);
}

export async function queueEventMessage(input: {
  organizationId: string;
  eventId: string;
  channel: EventMessageChannel;
  subject?: string | null;
  body: string;
  scheduledFor?: Date | null;
  actorUserId?: string | null;
}) {
  return eventRepository.queueMessage(input);
}

export async function linkEventMinistry(input: {
  organizationId: string;
  eventId: string;
  ministryId: string;
  notes?: string | null;
  actorUserId?: string | null;
}) {
  return eventRepository.linkMinistry(input);
}

export async function getEventAnalytics(organizationId: string) {
  return eventRepository.getAnalytics(organizationId);
}

export async function setChurchEventStatus(input: {
  organizationId: string;
  eventId: string;
  status: ChurchEventStatus;
  actorUserId?: string | null;
}) {
  return eventRepository.setStatus(input);
}
