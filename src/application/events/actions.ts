"use server";

import {
  cancelChurchEvent,
  cancelEventRegistration,
  checkInToChurchEvent,
  createChurchEvent,
  getChurchEventProfile,
  getEventAnalytics,
  linkEventMinistry,
  listChurchEvents,
  publishChurchEvent,
  queueEventMessage,
  registerForChurchEvent,
  rescheduleChurchEvent,
  softDeleteChurchEvent,
  updateChurchEvent,
} from "@/application/events/event-service";
import {
  ChurchEventStatus,
  ChurchEventType,
  EventMessageChannel,
  EventResourceType,
  EventVisibility,
  RecurrenceFrequency,
  RegistrantType,
} from "@/domain/enums/event";
import { Permission } from "@/domain/permissions/rbac";
import { requirePermission } from "@/server/auth/session";
import { AppError } from "@/server/errors";
import { revalidatePath } from "next/cache";
import { z } from "zod";

function actionError(error: unknown): { ok: false; error: string } {
  if (error instanceof AppError) {
    return { ok: false, error: error.message };
  }
  if (error instanceof z.ZodError) {
    return { ok: false, error: "Invalid input" };
  }
  console.error("[events action]", error);
  return { ok: false, error: "Something went wrong" };
}

function revalidateEvents(eventId?: string) {
  revalidatePath("/events");
  revalidatePath("/events/calendar");
  if (eventId) {
    revalidatePath(`/events/${eventId}`);
    revalidatePath(`/events/${eventId}/check-in`);
  }
}

export async function listChurchEventsAction(raw?: unknown) {
  try {
    const ctx = await requirePermission(Permission.EVENT_READ);
    const data = z
      .object({
        from: z.string().datetime().optional(),
        to: z.string().datetime().optional(),
        status: z.nativeEnum(ChurchEventStatus).optional(),
        eventType: z.nativeEnum(ChurchEventType).optional(),
        search: z.string().max(200).optional(),
        limit: z.number().int().min(1).max(200).optional(),
      })
      .optional()
      .parse(raw);

    const events = await listChurchEvents({
      organizationId: ctx.organization.id,
      from: data?.from ? new Date(data.from) : undefined,
      to: data?.to ? new Date(data.to) : undefined,
      status: data?.status,
      eventType: data?.eventType,
      search: data?.search,
      limit: data?.limit,
    });
    return { ok: true as const, data: events };
  } catch (error) {
    return actionError(error);
  }
}

export async function getChurchEventProfileAction(eventId: string) {
  try {
    const ctx = await requirePermission(Permission.EVENT_READ);
    const data = await getChurchEventProfile(ctx.organization.id, eventId);
    return { ok: true as const, data };
  } catch (error) {
    return actionError(error);
  }
}

export async function getEventAnalyticsAction() {
  try {
    const ctx = await requirePermission(Permission.EVENT_READ);
    const data = await getEventAnalytics(ctx.organization.id);
    return { ok: true as const, data };
  } catch (error) {
    return actionError(error);
  }
}

export async function createChurchEventAction(raw: unknown) {
  try {
    const ctx = await requirePermission(Permission.EVENT_WRITE);
    const data = z
      .object({
        title: z.string().min(1).max(200),
        slug: z.string().min(1).max(80).optional(),
        description: z.string().max(8000).optional(),
        heroImageUrl: z.string().url().optional().or(z.literal("")),
        eventType: z.nativeEnum(ChurchEventType).optional(),
        visibility: z.nativeEnum(EventVisibility).optional(),
        startsAt: z.string().datetime(),
        endsAt: z.string().datetime().optional().nullable(),
        timezone: z.string().max(64).optional(),
        allDay: z.boolean().optional(),
        venueName: z.string().max(200).optional(),
        venueAddress: z.string().max(400).optional(),
        campus: z.string().max(120).optional(),
        capacity: z.number().int().min(1).max(100000).optional().nullable(),
        registrationOpen: z.boolean().optional(),
        waitlistEnabled: z.boolean().optional(),
        requiresTicket: z.boolean().optional(),
        organizerMemberId: z.string().optional(),
        recurrence: z.nativeEnum(RecurrenceFrequency).optional(),
        recurrenceRule: z.string().max(500).optional(),
        recurrenceUntil: z.string().datetime().optional().nullable(),
        scheduleEventId: z.string().optional(),
        notes: z.string().max(4000).optional(),
        ministryIds: z.array(z.string()).optional(),
        speakers: z
          .array(
            z.object({
              name: z.string().min(1).max(120),
              title: z.string().max(120).optional(),
              bio: z.string().max(2000).optional(),
              memberId: z.string().optional(),
            })
          )
          .optional(),
        resources: z
          .array(
            z.object({
              type: z.nativeEnum(EventResourceType).optional(),
              name: z.string().min(1).max(120),
              quantity: z.number().int().min(1).optional(),
              notes: z.string().max(500).optional(),
            })
          )
          .optional(),
        publish: z.boolean().optional(),
      })
      .parse(raw);

    if (data.publish) {
      await requirePermission(Permission.EVENT_PUBLISH);
    }

    const event = await createChurchEvent({
      organizationId: ctx.organization.id,
      title: data.title,
      slug: data.slug ?? data.title,
      description: data.description ?? null,
      heroImageUrl: data.heroImageUrl || null,
      eventType: data.eventType,
      visibility: data.visibility,
      startsAt: new Date(data.startsAt),
      endsAt: data.endsAt ? new Date(data.endsAt) : null,
      timezone: data.timezone,
      allDay: data.allDay,
      venueName: data.venueName ?? null,
      venueAddress: data.venueAddress ?? null,
      campus: data.campus ?? null,
      capacity: data.capacity ?? null,
      registrationOpen: data.registrationOpen,
      waitlistEnabled: data.waitlistEnabled,
      requiresTicket: data.requiresTicket,
      organizerMemberId: data.organizerMemberId ?? null,
      recurrence: data.recurrence,
      recurrenceRule: data.recurrenceRule ?? null,
      recurrenceUntil: data.recurrenceUntil
        ? new Date(data.recurrenceUntil)
        : null,
      scheduleEventId: data.scheduleEventId ?? null,
      notes: data.notes ?? null,
      ministryIds: data.ministryIds,
      speakers: data.speakers,
      resources: data.resources,
      actorUserId: ctx.user.id,
      publish: data.publish,
    });
    revalidateEvents(event.id);
    return { ok: true as const, data: event };
  } catch (error) {
    return actionError(error);
  }
}

export async function updateChurchEventAction(raw: unknown) {
  try {
    const ctx = await requirePermission(Permission.EVENT_WRITE);
    const data = z
      .object({
        eventId: z.string().min(1),
        title: z.string().min(1).max(200).optional(),
        description: z.string().max(8000).optional().nullable(),
        heroImageUrl: z.string().url().optional().nullable().or(z.literal("")),
        eventType: z.nativeEnum(ChurchEventType).optional(),
        visibility: z.nativeEnum(EventVisibility).optional(),
        startsAt: z.string().datetime().optional(),
        endsAt: z.string().datetime().optional().nullable(),
        timezone: z.string().max(64).optional(),
        allDay: z.boolean().optional(),
        venueName: z.string().max(200).optional().nullable(),
        venueAddress: z.string().max(400).optional().nullable(),
        campus: z.string().max(120).optional().nullable(),
        capacity: z.number().int().min(1).max(100000).optional().nullable(),
        registrationOpen: z.boolean().optional(),
        waitlistEnabled: z.boolean().optional(),
        requiresTicket: z.boolean().optional(),
        organizerMemberId: z.string().optional().nullable(),
        recurrence: z.nativeEnum(RecurrenceFrequency).optional(),
        recurrenceRule: z.string().max(500).optional().nullable(),
        recurrenceUntil: z.string().datetime().optional().nullable(),
        scheduleEventId: z.string().optional().nullable(),
        notes: z.string().max(4000).optional().nullable(),
        ministryIds: z.array(z.string()).optional(),
      })
      .parse(raw);

    const event = await updateChurchEvent({
      organizationId: ctx.organization.id,
      eventId: data.eventId,
      title: data.title,
      description: data.description,
      heroImageUrl:
        data.heroImageUrl === "" ? null : (data.heroImageUrl ?? undefined),
      eventType: data.eventType,
      visibility: data.visibility,
      startsAt: data.startsAt ? new Date(data.startsAt) : undefined,
      endsAt:
        data.endsAt === undefined
          ? undefined
          : data.endsAt
            ? new Date(data.endsAt)
            : null,
      timezone: data.timezone,
      allDay: data.allDay,
      venueName: data.venueName,
      venueAddress: data.venueAddress,
      campus: data.campus,
      capacity: data.capacity,
      registrationOpen: data.registrationOpen,
      waitlistEnabled: data.waitlistEnabled,
      requiresTicket: data.requiresTicket,
      organizerMemberId: data.organizerMemberId,
      recurrence: data.recurrence,
      recurrenceRule: data.recurrenceRule,
      recurrenceUntil:
        data.recurrenceUntil === undefined
          ? undefined
          : data.recurrenceUntil
            ? new Date(data.recurrenceUntil)
            : null,
      scheduleEventId: data.scheduleEventId,
      notes: data.notes,
      ministryIds: data.ministryIds,
      actorUserId: ctx.user.id,
    });
    revalidateEvents(event.id);
    return { ok: true as const, data: event };
  } catch (error) {
    return actionError(error);
  }
}

export async function publishChurchEventAction(eventId: string) {
  try {
    const ctx = await requirePermission(Permission.EVENT_PUBLISH);
    const data = await publishChurchEvent({
      organizationId: ctx.organization.id,
      eventId,
      actorUserId: ctx.user.id,
    });
    revalidateEvents(eventId);
    return { ok: true as const, data };
  } catch (error) {
    return actionError(error);
  }
}

export async function cancelChurchEventAction(eventId: string) {
  try {
    const ctx = await requirePermission(Permission.EVENT_MANAGE);
    const data = await cancelChurchEvent({
      organizationId: ctx.organization.id,
      eventId,
      actorUserId: ctx.user.id,
    });
    revalidateEvents(eventId);
    return { ok: true as const, data };
  } catch (error) {
    return actionError(error);
  }
}

export async function deleteChurchEventAction(eventId: string) {
  try {
    const ctx = await requirePermission(Permission.EVENT_MANAGE);
    await softDeleteChurchEvent({
      organizationId: ctx.organization.id,
      eventId,
      actorUserId: ctx.user.id,
    });
    revalidateEvents(eventId);
    return { ok: true as const, data: { id: eventId } };
  } catch (error) {
    return actionError(error);
  }
}

export async function rescheduleChurchEventAction(raw: unknown) {
  try {
    const ctx = await requirePermission(Permission.EVENT_WRITE);
    const data = z
      .object({
        eventId: z.string().min(1),
        startsAt: z.string().datetime(),
        endsAt: z.string().datetime().optional().nullable(),
      })
      .parse(raw);

    const event = await rescheduleChurchEvent({
      organizationId: ctx.organization.id,
      eventId: data.eventId,
      startsAt: new Date(data.startsAt),
      endsAt:
        data.endsAt === undefined
          ? undefined
          : data.endsAt
            ? new Date(data.endsAt)
            : null,
      actorUserId: ctx.user.id,
    });
    revalidateEvents(event.id);
    return { ok: true as const, data: event };
  } catch (error) {
    return actionError(error);
  }
}

export async function registerForEventAction(raw: unknown) {
  try {
    const ctx = await requirePermission(Permission.EVENT_WRITE);
    const data = z
      .object({
        eventId: z.string().min(1),
        registrantType: z.nativeEnum(RegistrantType),
        memberId: z.string().optional(),
        visitorId: z.string().optional(),
        householdId: z.string().optional(),
        guestName: z.string().max(120).optional(),
        guestEmail: z.string().email().optional().or(z.literal("")),
        guestPhone: z.string().max(40).optional(),
        partySize: z.number().int().min(1).max(100).optional(),
        notes: z.string().max(1000).optional(),
      })
      .parse(raw);

    const registration = await registerForChurchEvent({
      organizationId: ctx.organization.id,
      eventId: data.eventId,
      registrantType: data.registrantType,
      memberId: data.memberId ?? null,
      visitorId: data.visitorId ?? null,
      householdId: data.householdId ?? null,
      guestName: data.guestName ?? null,
      guestEmail: data.guestEmail || null,
      guestPhone: data.guestPhone ?? null,
      partySize: data.partySize,
      notes: data.notes ?? null,
      actorUserId: ctx.user.id,
    });
    revalidateEvents(data.eventId);
    return { ok: true as const, data: registration };
  } catch (error) {
    return actionError(error);
  }
}

export async function cancelRegistrationAction(raw: unknown) {
  try {
    const ctx = await requirePermission(Permission.EVENT_WRITE);
    const data = z
      .object({
        registrationId: z.string().min(1),
        eventId: z.string().min(1),
      })
      .parse(raw);

    const registration = await cancelEventRegistration({
      organizationId: ctx.organization.id,
      registrationId: data.registrationId,
      actorUserId: ctx.user.id,
    });
    revalidateEvents(data.eventId);
    return { ok: true as const, data: registration };
  } catch (error) {
    return actionError(error);
  }
}

export async function eventCheckInAction(raw: unknown) {
  try {
    const ctx = await requirePermission(Permission.EVENT_CHECKIN);
    const data = z
      .object({
        eventId: z.string().min(1),
        method: z.enum(["QR", "SEARCH", "MANUAL"]),
        qrToken: z.string().optional(),
        registrationId: z.string().optional(),
        memberId: z.string().optional(),
        guestName: z.string().max(120).optional(),
        notes: z.string().max(500).optional(),
      })
      .parse(raw);

    const checkIn = await checkInToChurchEvent({
      organizationId: ctx.organization.id,
      eventId: data.eventId,
      method: data.method,
      qrToken: data.qrToken ?? null,
      registrationId: data.registrationId ?? null,
      memberId: data.memberId ?? null,
      guestName: data.guestName ?? null,
      notes: data.notes ?? null,
      actorUserId: ctx.user.id,
    });
    revalidateEvents(data.eventId);
    return { ok: true as const, data: checkIn };
  } catch (error) {
    return actionError(error);
  }
}

export async function queueEventMessageAction(raw: unknown) {
  try {
    const ctx = await requirePermission(Permission.EVENT_MANAGE);
    const data = z
      .object({
        eventId: z.string().min(1),
        channel: z.nativeEnum(EventMessageChannel),
        subject: z.string().max(200).optional(),
        body: z.string().min(1).max(4000),
        scheduledFor: z.string().datetime().optional().nullable(),
      })
      .parse(raw);

    const message = await queueEventMessage({
      organizationId: ctx.organization.id,
      eventId: data.eventId,
      channel: data.channel,
      subject: data.subject ?? null,
      body: data.body,
      scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : null,
      actorUserId: ctx.user.id,
    });
    revalidateEvents(data.eventId);
    return { ok: true as const, data: message };
  } catch (error) {
    return actionError(error);
  }
}

export async function linkEventMinistryAction(raw: unknown) {
  try {
    const ctx = await requirePermission(Permission.EVENT_WRITE);
    const data = z
      .object({
        eventId: z.string().min(1),
        ministryId: z.string().min(1),
        notes: z.string().max(500).optional(),
      })
      .parse(raw);

    await linkEventMinistry({
      organizationId: ctx.organization.id,
      eventId: data.eventId,
      ministryId: data.ministryId,
      notes: data.notes ?? null,
      actorUserId: ctx.user.id,
    });
    revalidateEvents(data.eventId);
    return { ok: true as const, data: { ok: true } };
  } catch (error) {
    return actionError(error);
  }
}
