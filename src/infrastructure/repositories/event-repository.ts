import type { EventRepository } from "@/application/ports/event-repositories";
import type {
  CreateChurchEventInput,
  EventActivityEntity,
  EventAnalytics,
  EventAttachmentEntity,
  EventCheckInEntity,
  EventCheckInInput,
  EventListItem,
  EventMinistryLink,
  EventProfile,
  EventRegistrationEntity,
  EventResourceEntity,
  EventSpeakerEntity,
  EventTicketEntity,
  EventVolunteerSummary,
  EventWaitlistEntity,
  RegisterForEventInput,
  VolunteerConflict,
  VolunteerStaffingGap,
} from "@/domain/entities/event";
import {
  ChurchEventStatus,
  EventActivityType,
  EventTicketStatus,
  RegistrantType,
  RegistrationStatus,
} from "@/domain/enums/event";
import type {
  ChurchEventType,
  EventMessageChannel,
  EventResourceType,
  EventVisibility,
  RecurrenceFrequency,
} from "@/domain/enums/event";
import { prisma } from "@/infrastructure/db/prisma";
import { conflict, notFound } from "@/server/errors";
import type {
  ChurchEventStatus as PrismaChurchEventStatus,
  ChurchEventType as PrismaChurchEventType,
  EventActivityType as PrismaEventActivityType,
  EventMessageChannel as PrismaEventMessageChannel,
  EventResourceType as PrismaEventResourceType,
  EventTicketStatus as PrismaEventTicketStatus,
  EventVisibility as PrismaEventVisibility,
  Prisma,
  RecurrenceFrequency as PrismaRecurrenceFrequency,
  RegistrantType as PrismaRegistrantType,
  RegistrationStatus as PrismaRegistrationStatus,
} from "@prisma/client";
import { addDays, endOfDay, startOfDay } from "date-fns";

const DEFAULT_MESSAGE_METADATA = { provider: null, queued: false };

function asJsonRecord(value: unknown): Record<string, unknown> | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function registrationDisplayName(row: {
  registrantType: PrismaRegistrantType;
  guestName: string | null;
  guestEmail: string | null;
  memberId: string | null;
  visitorId: string | null;
  householdId: string | null;
}): string {
  if (row.guestName) return row.guestName;
  if (row.registrantType === "HOUSEHOLD" && row.householdId) {
    return `Household ${row.householdId.slice(0, 6)}`;
  }
  if (row.registrantType === "GROUP") return "Group registration";
  if (row.memberId) return `Member ${row.memberId.slice(0, 6)}`;
  if (row.visitorId) return `Visitor ${row.visitorId.slice(0, 6)}`;
  return row.guestEmail ?? "Guest";
}

function mapEvent(
  row: {
    id: string;
    organizationId: string;
    title: string;
    slug: string;
    description: string | null;
    heroImageUrl: string | null;
    eventType: PrismaChurchEventType;
    status: PrismaChurchEventStatus;
    visibility: PrismaEventVisibility;
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
    recurrence: PrismaRecurrenceFrequency;
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
    _count?: {
      registrations?: number;
      waitlist?: number;
      checkIns?: number;
      ministries?: number;
    };
  },
  registeredPartySize?: number
): EventListItem {
  const registrationCount =
    registeredPartySize ?? row._count?.registrations ?? 0;
  const capacity = row.capacity;
  const capacityUsage =
    capacity && capacity > 0
      ? Math.min(100, Math.round((registrationCount / capacity) * 100))
      : null;
  const seatsRemaining =
    capacity != null ? Math.max(0, capacity - registrationCount) : null;

  return {
    id: row.id,
    organizationId: row.organizationId,
    title: row.title,
    slug: row.slug,
    description: row.description,
    heroImageUrl: row.heroImageUrl,
    eventType: row.eventType as ChurchEventType,
    status: row.status as ChurchEventStatus,
    visibility: row.visibility as EventVisibility,
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    timezone: row.timezone,
    allDay: row.allDay,
    venueName: row.venueName,
    venueAddress: row.venueAddress,
    campus: row.campus,
    capacity: row.capacity,
    registrationOpen: row.registrationOpen,
    waitlistEnabled: row.waitlistEnabled,
    requiresTicket: row.requiresTicket,
    organizerMemberId: row.organizerMemberId,
    organizerUserId: row.organizerUserId,
    recurrence: row.recurrence as RecurrenceFrequency,
    recurrenceRule: row.recurrenceRule,
    recurrenceUntil: row.recurrenceUntil,
    parentEventId: row.parentEventId,
    scheduleEventId: row.scheduleEventId,
    checkInCode: row.checkInCode,
    notes: row.notes,
    publishedAt: row.publishedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
    registrationCount,
    waitlistCount: row._count?.waitlist,
    checkInCount: row._count?.checkIns,
    ministryCount: row._count?.ministries,
    capacityUsage,
    seatsRemaining,
  };
}

function mapTicket(row: {
  id: string;
  organizationId: string;
  eventId: string;
  registrationId: string;
  qrToken: string;
  status: PrismaEventTicketStatus;
  holderName: string | null;
  issuedAt: Date;
  usedAt: Date | null;
  createdAt: Date;
}): EventTicketEntity {
  return {
    id: row.id,
    organizationId: row.organizationId,
    eventId: row.eventId,
    registrationId: row.registrationId,
    qrToken: row.qrToken,
    status: row.status as EventTicketStatus,
    holderName: row.holderName,
    issuedAt: row.issuedAt,
    usedAt: row.usedAt,
    createdAt: row.createdAt,
  };
}

function mapRegistration(row: {
  id: string;
  organizationId: string;
  eventId: string;
  registrantType: PrismaRegistrantType;
  memberId: string | null;
  visitorId: string | null;
  householdId: string | null;
  guestName: string | null;
  guestEmail: string | null;
  guestPhone: string | null;
  partySize: number;
  status: PrismaRegistrationStatus;
  notes: string | null;
  registeredAt: Date;
  cancelledAt: Date | null;
  checkedInAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  tickets?: Array<{
    id: string;
    organizationId: string;
    eventId: string;
    registrationId: string;
    qrToken: string;
    status: PrismaEventTicketStatus;
    holderName: string | null;
    issuedAt: Date;
    usedAt: Date | null;
    createdAt: Date;
  }>;
  member?: { firstName: string; lastName: string } | null;
}): EventRegistrationEntity {
  const displayName = row.member
    ? `${row.member.firstName} ${row.member.lastName}`.trim()
    : registrationDisplayName(row);

  return {
    id: row.id,
    organizationId: row.organizationId,
    eventId: row.eventId,
    registrantType: row.registrantType as RegistrantType,
    memberId: row.memberId,
    visitorId: row.visitorId,
    householdId: row.householdId,
    guestName: row.guestName,
    guestEmail: row.guestEmail,
    guestPhone: row.guestPhone,
    partySize: row.partySize,
    status: row.status as RegistrationStatus,
    notes: row.notes,
    registeredAt: row.registeredAt,
    cancelledAt: row.cancelledAt,
    checkedInAt: row.checkedInAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    displayName,
    tickets: row.tickets?.map(mapTicket),
  };
}

function mapActivity(row: {
  id: string;
  organizationId: string;
  eventId: string;
  type: PrismaEventActivityType;
  title: string;
  description: string | null;
  actorUserId: string | null;
  metadata: unknown;
  occurredAt: Date;
  createdAt: Date;
}): EventActivityEntity {
  return {
    id: row.id,
    organizationId: row.organizationId,
    eventId: row.eventId,
    type: row.type as EventActivityType,
    title: row.title,
    description: row.description,
    actorUserId: row.actorUserId,
    metadata: asJsonRecord(row.metadata),
    occurredAt: row.occurredAt,
    createdAt: row.createdAt,
  };
}

async function logActivity(input: {
  organizationId: string;
  eventId: string;
  type: EventActivityType;
  title: string;
  description?: string | null;
  actorUserId?: string | null;
  metadata?: Record<string, unknown> | null;
}) {
  await prisma.eventActivity.create({
    data: {
      organizationId: input.organizationId,
      eventId: input.eventId,
      type: input.type as PrismaEventActivityType,
      title: input.title,
      description: input.description ?? null,
      actorUserId: input.actorUserId ?? null,
      metadata: (input.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
    },
  });
}

async function activeRegisteredPartySize(eventId: string) {
  const agg = await prisma.eventRegistration.aggregate({
    where: {
      eventId,
      status: { in: ["REGISTERED", "CHECKED_IN"] },
    },
    _sum: { partySize: true },
  });
  return agg._sum.partySize ?? 0;
}

async function activeRegisteredPartySizes(eventIds: string[]) {
  if (eventIds.length === 0) return new Map<string, number>();
  const rows = await prisma.eventRegistration.groupBy({
    by: ["eventId"],
    where: {
      eventId: { in: eventIds },
      status: { in: ["REGISTERED", "CHECKED_IN"] },
    },
    _sum: { partySize: true },
  });
  return new Map(
    rows.map((r) => [r.eventId, r._sum.partySize ?? 0] as const)
  );
}

async function resolveVolunteerSummary(
  organizationId: string,
  event: {
    id: string;
    startsAt: Date;
    endsAt: Date | null;
    scheduleEventId: string | null;
  }
): Promise<EventVolunteerSummary> {
  const gaps: VolunteerStaffingGap[] = [];
  const conflicts: VolunteerConflict[] = [];

  const linkedMinistries = await prisma.eventMinistry.findMany({
    where: { eventId: event.id },
    include: { ministry: true },
  });

  let scheduleEventId = event.scheduleEventId;
  let scheduleEvent = scheduleEventId
    ? await prisma.scheduleEvent.findFirst({
        where: { id: scheduleEventId, organizationId },
        include: {
          slots: {
            include: {
              assignments: {
                where: { status: { in: ["ASSIGNED", "CONFIRMED"] } },
                include: {
                  volunteer: {
                    include: {
                      member: {
                        select: { firstName: true, lastName: true },
                      },
                    },
                  },
                },
              },
              role: true,
            },
          },
        },
      })
    : null;

  if (!scheduleEvent && linkedMinistries.length > 0) {
    const ministryIds = linkedMinistries.map((m) => m.ministryId);
    scheduleEvent = await prisma.scheduleEvent.findFirst({
      where: {
        organizationId,
        ministryId: { in: ministryIds },
        startsAt: {
          gte: startOfDay(event.startsAt),
          lte: endOfDay(event.endsAt ?? event.startsAt),
        },
      },
      include: {
        slots: {
          include: {
            assignments: {
              where: { status: { in: ["ASSIGNED", "CONFIRMED"] } },
              include: {
                volunteer: {
                  include: {
                    member: {
                      select: { firstName: true, lastName: true },
                    },
                  },
                },
              },
            },
            role: true,
          },
        },
      },
      orderBy: { startsAt: "asc" },
    });
    scheduleEventId = scheduleEvent?.id ?? null;
  }

  if (scheduleEvent) {
    let needed = 0;
    let filled = 0;
    const assignmentList = scheduleEvent.slots.flatMap((slot) =>
      slot.assignments.map((assignment) => ({ slot, assignment }))
    );

    const volunteerIds = [
      ...new Set(assignmentList.map((a) => a.assignment.volunteerId)),
    ];

    const overlapping =
      volunteerIds.length === 0
        ? []
        : await prisma.scheduleAssignment.findMany({
            where: {
              organizationId,
              volunteerId: { in: volunteerIds },
              status: { in: ["ASSIGNED", "CONFIRMED"] },
              id: {
                notIn: assignmentList.map((a) => a.assignment.id),
              },
              slot: {
                event: {
                  startsAt: {
                    lt: event.endsAt ?? addDays(event.startsAt, 1),
                  },
                  OR: [
                    { endsAt: { gt: event.startsAt } },
                    {
                      endsAt: null,
                      startsAt: { gte: startOfDay(event.startsAt) },
                    },
                  ],
                },
              },
            },
            include: {
              slot: { include: { event: true } },
            },
          });

    const conflictByVolunteer = new Map<string, (typeof overlapping)[number]>();
    for (const other of overlapping) {
      if (!conflictByVolunteer.has(other.volunteerId)) {
        conflictByVolunteer.set(other.volunteerId, other);
      }
    }

    const seenConflictVolunteers = new Set<string>();
    for (const { assignment } of assignmentList) {
      if (seenConflictVolunteers.has(assignment.volunteerId)) continue;
      const other = conflictByVolunteer.get(assignment.volunteerId);
      if (!other) continue;
      seenConflictVolunteers.add(assignment.volunteerId);
      conflicts.push({
        volunteerId: assignment.volunteerId,
        volunteerName:
          `${assignment.volunteer.member.firstName} ${assignment.volunteer.member.lastName}`.trim(),
        conflictingEventTitle: other.slot.event.title,
        conflictingStartsAt: other.slot.event.startsAt,
      });
    }

    for (const slot of scheduleEvent.slots) {
      const slotNeeded = slot.needed;
      const slotFilled = slot.assignments.length;
      needed += slotNeeded;
      filled += Math.min(slotFilled, slotNeeded);
      if (slotFilled < slotNeeded) {
        gaps.push({
          ministryId: scheduleEvent.ministryId ?? "",
          ministryName: scheduleEvent.title,
          scheduleEventId: scheduleEvent.id,
          slotsNeeded: slotNeeded,
          slotsFilled: slotFilled,
          gap: slotNeeded - slotFilled,
        });
      }
    }

    const coveragePercent =
      needed > 0 ? Math.round((filled / needed) * 100) : 100;

    return {
      scheduleEventId,
      gaps,
      conflicts,
      coveragePercent,
    };
  }

  for (const link of linkedMinistries) {
    const roles = await prisma.ministryRole.findMany({
      where: { ministryId: link.ministryId },
    });
    const needed = roles.reduce((s, r) => s + r.slotsNeeded, 0);
    if (needed > 0) {
      gaps.push({
        ministryId: link.ministryId,
        ministryName: link.ministry.name,
        scheduleEventId: null,
        slotsNeeded: needed,
        slotsFilled: 0,
        gap: needed,
      });
    }
  }

  return {
    scheduleEventId,
    gaps,
    conflicts,
    coveragePercent: gaps.length === 0 ? 100 : 0,
  };
}

export const eventRepository: EventRepository = {
  async listEvents(query) {
    const where: Prisma.ChurchEventWhereInput = {
      organizationId: query.organizationId,
      deletedAt: null,
    };
    if (query.from || query.to) {
      where.startsAt = {};
      if (query.from) where.startsAt.gte = query.from;
      if (query.to) where.startsAt.lte = query.to;
    }
    if (query.status) where.status = query.status;
    if (query.eventType) where.eventType = query.eventType;
    if (query.search?.trim()) {
      const q = query.search.trim();
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { venueName: { contains: q, mode: "insensitive" } },
        { campus: { contains: q, mode: "insensitive" } },
      ];
    }

    const rows = await prisma.churchEvent.findMany({
      where,
      orderBy: { startsAt: "asc" },
      take: query.limit ?? 100,
      include: {
        _count: {
          select: {
            registrations: {
              where: { status: { in: ["REGISTERED", "CHECKED_IN"] } },
            },
            waitlist: true,
            checkIns: true,
            ministries: true,
          },
        },
      },
    });

    const partyByEvent = await activeRegisteredPartySizes(rows.map((r) => r.id));
    return rows.map((row) => mapEvent(row, partyByEvent.get(row.id) ?? 0));
  },

  async getEventProfile(organizationId, eventId) {
    const row = await prisma.churchEvent.findFirst({
      where: { id: eventId, organizationId, deletedAt: null },
      include: {
        speakers: { orderBy: { sortOrder: "asc" } },
        attachments: { orderBy: { createdAt: "desc" } },
        resources: { orderBy: { createdAt: "asc" } },
        ministries: { include: { ministry: true } },
        registrations: {
          orderBy: { registeredAt: "desc" },
          include: { tickets: true },
        },
        waitlist: { orderBy: { position: "asc" } },
        checkIns: { orderBy: { checkedInAt: "desc" }, take: 100 },
        activities: { orderBy: { occurredAt: "desc" }, take: 40 },
        messages: { orderBy: { createdAt: "desc" }, take: 20 },
        _count: {
          select: {
            registrations: true,
            waitlist: true,
            checkIns: true,
            ministries: true,
          },
        },
      },
    });
    if (!row) return null;

    const memberIds = [
      ...row.registrations.map((r) => r.memberId).filter(Boolean),
      ...row.checkIns.map((c) => c.memberId).filter(Boolean),
    ] as string[];
    const members =
      memberIds.length > 0
        ? await prisma.member.findMany({
            where: { id: { in: [...new Set(memberIds)] }, organizationId },
            select: { id: true, firstName: true, lastName: true },
          })
        : [];
    const memberMap = Object.fromEntries(members.map((m) => [m.id, m]));

    const party = await activeRegisteredPartySize(row.id);
    const event = mapEvent(row, party);

    const speakers: EventSpeakerEntity[] = row.speakers.map((s) => ({
      id: s.id,
      organizationId: s.organizationId,
      eventId: s.eventId,
      memberId: s.memberId,
      name: s.name,
      title: s.title,
      bio: s.bio,
      sortOrder: s.sortOrder,
      createdAt: s.createdAt,
    }));

    const attachments: EventAttachmentEntity[] = row.attachments.map((a) => ({
      id: a.id,
      organizationId: a.organizationId,
      eventId: a.eventId,
      name: a.name,
      mimeType: a.mimeType,
      sizeBytes: a.sizeBytes,
      url: a.url,
      storageKey: a.storageKey,
      createdAt: a.createdAt,
    }));

    const resources: EventResourceEntity[] = row.resources.map((r) => ({
      id: r.id,
      organizationId: r.organizationId,
      eventId: r.eventId,
      type: r.type as EventResourceType,
      name: r.name,
      quantity: r.quantity,
      notes: r.notes,
      createdAt: r.createdAt,
    }));

    const ministries: EventMinistryLink[] = row.ministries.map((m) => ({
      id: m.id,
      organizationId: m.organizationId,
      eventId: m.eventId,
      ministryId: m.ministryId,
      ministryName: m.ministry.name,
      ministryColor: m.ministry.color,
      notes: m.notes,
      createdAt: m.createdAt,
    }));

    const registrations = row.registrations.map((r) =>
      mapRegistration({
        ...r,
        member: r.memberId ? memberMap[r.memberId] ?? null : null,
      })
    );

    const waitlist: EventWaitlistEntity[] = row.waitlist.map((w) => ({
      id: w.id,
      organizationId: w.organizationId,
      eventId: w.eventId,
      memberId: w.memberId,
      visitorId: w.visitorId,
      guestName: w.guestName,
      guestEmail: w.guestEmail,
      guestPhone: w.guestPhone,
      partySize: w.partySize,
      position: w.position,
      promotedAt: w.promotedAt,
      createdAt: w.createdAt,
      displayName:
        w.guestName ??
        (w.memberId && memberMap[w.memberId]
          ? `${memberMap[w.memberId].firstName} ${memberMap[w.memberId].lastName}`.trim()
          : `Waitlist #${w.position}`),
    }));

    const checkIns: EventCheckInEntity[] = row.checkIns.map((c) => ({
      id: c.id,
      organizationId: c.organizationId,
      eventId: c.eventId,
      registrationId: c.registrationId,
      ticketId: c.ticketId,
      memberId: c.memberId,
      method: c.method,
      checkedInAt: c.checkedInAt,
      checkedInByUserId: c.checkedInByUserId,
      notes: c.notes,
      createdAt: c.createdAt,
      displayName: c.memberId && memberMap[c.memberId]
        ? `${memberMap[c.memberId].firstName} ${memberMap[c.memberId].lastName}`.trim()
        : c.notes ?? c.method,
    }));

    const volunteer = await resolveVolunteerSummary(organizationId, row);

    const profile: EventProfile = {
      event,
      speakers,
      attachments,
      resources,
      ministries,
      registrations,
      waitlist,
      checkIns,
      activities: row.activities.map(mapActivity),
      messages: row.messages.map((m) => ({
        id: m.id,
        organizationId: m.organizationId,
        eventId: m.eventId,
        channel: m.channel as EventMessageChannel,
        subject: m.subject,
        body: m.body,
        actorUserId: m.actorUserId,
        metadata: asJsonRecord(m.metadata),
        scheduledFor: m.scheduledFor,
        sentAt: m.sentAt,
        createdAt: m.createdAt,
      })),
      volunteer,
    };
    return profile;
  },

  async createEvent(input: CreateChurchEventInput) {
    const slugBase = input.slug || slugify(input.title);
    let slug = slugBase;
    let attempt = 0;
    while (
      await prisma.churchEvent.findFirst({
        where: { organizationId: input.organizationId, slug },
      })
    ) {
      attempt += 1;
      slug = `${slugBase}-${attempt}`;
    }

    const status = input.publish
      ? ChurchEventStatus.PUBLISHED
      : ChurchEventStatus.DRAFT;

    const created = await prisma.churchEvent.create({
      data: {
        organizationId: input.organizationId,
        title: input.title,
        slug,
        description: input.description ?? null,
        heroImageUrl: input.heroImageUrl ?? null,
        eventType: (input.eventType ?? "CUSTOM") as PrismaChurchEventType,
        status: status as PrismaChurchEventStatus,
        visibility: (input.visibility ?? "MEMBERS") as PrismaEventVisibility,
        startsAt: input.startsAt,
        endsAt: input.endsAt ?? null,
        timezone: input.timezone ?? "UTC",
        allDay: input.allDay ?? false,
        venueName: input.venueName ?? null,
        venueAddress: input.venueAddress ?? null,
        campus: input.campus ?? null,
        capacity: input.capacity ?? null,
        registrationOpen: input.registrationOpen ?? true,
        waitlistEnabled: input.waitlistEnabled ?? true,
        requiresTicket: input.requiresTicket ?? true,
        organizerMemberId: input.organizerMemberId ?? null,
        organizerUserId: input.actorUserId ?? null,
        recurrence: (input.recurrence ?? "NONE") as PrismaRecurrenceFrequency,
        recurrenceRule: input.recurrenceRule ?? null,
        recurrenceUntil: input.recurrenceUntil ?? null,
        scheduleEventId: input.scheduleEventId ?? null,
        notes: input.notes ?? null,
        publishedAt: input.publish ? new Date() : null,
        speakers: input.speakers?.length
          ? {
              create: input.speakers.map((s, i) => ({
                organizationId: input.organizationId,
                name: s.name,
                title: s.title ?? null,
                bio: s.bio ?? null,
                memberId: s.memberId ?? null,
                sortOrder: i,
              })),
            }
          : undefined,
        resources: input.resources?.length
          ? {
              create: input.resources.map((r) => ({
                organizationId: input.organizationId,
                type: (r.type ?? "OTHER") as PrismaEventResourceType,
                name: r.name,
                quantity: r.quantity ?? 1,
                notes: r.notes ?? null,
              })),
            }
          : undefined,
        ministries: input.ministryIds?.length
          ? {
              create: input.ministryIds.map((ministryId) => ({
                organizationId: input.organizationId,
                ministryId,
              })),
            }
          : undefined,
      },
      include: {
        _count: {
          select: {
            registrations: true,
            waitlist: true,
            checkIns: true,
            ministries: true,
          },
        },
      },
    });

    await logActivity({
      organizationId: input.organizationId,
      eventId: created.id,
      type: EventActivityType.CREATED,
      title: "Event created",
      description: created.title,
      actorUserId: input.actorUserId,
    });

    if (input.publish) {
      await logActivity({
        organizationId: input.organizationId,
        eventId: created.id,
        type: EventActivityType.PUBLISHED,
        title: "Event published",
        actorUserId: input.actorUserId,
      });
    }

    return mapEvent(created, 0);
  },

  async updateEvent(input) {
    const existing = await prisma.churchEvent.findFirst({
      where: {
        id: input.eventId,
        organizationId: input.organizationId,
        deletedAt: null,
      },
    });
    if (!existing) throw notFound("Event not found");

    const updated = await prisma.churchEvent.update({
      where: { id: existing.id },
      data: {
        title: input.title,
        description: input.description,
        heroImageUrl: input.heroImageUrl,
        eventType: input.eventType as PrismaChurchEventType | undefined,
        visibility: input.visibility as PrismaEventVisibility | undefined,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        timezone: input.timezone,
        allDay: input.allDay,
        venueName: input.venueName,
        venueAddress: input.venueAddress,
        campus: input.campus,
        capacity: input.capacity,
        registrationOpen: input.registrationOpen,
        waitlistEnabled: input.waitlistEnabled,
        requiresTicket: input.requiresTicket,
        organizerMemberId: input.organizerMemberId,
        recurrence: input.recurrence as PrismaRecurrenceFrequency | undefined,
        recurrenceRule: input.recurrenceRule,
        recurrenceUntil: input.recurrenceUntil,
        scheduleEventId: input.scheduleEventId,
        notes: input.notes,
      },
      include: {
        _count: {
          select: {
            registrations: true,
            waitlist: true,
            checkIns: true,
            ministries: true,
          },
        },
      },
    });

    if (input.ministryIds) {
      await prisma.eventMinistry.deleteMany({ where: { eventId: existing.id } });
      if (input.ministryIds.length > 0) {
        await prisma.eventMinistry.createMany({
          data: input.ministryIds.map((ministryId) => ({
            organizationId: input.organizationId,
            eventId: existing.id,
            ministryId,
          })),
        });
      }
    }

    await logActivity({
      organizationId: input.organizationId,
      eventId: existing.id,
      type: EventActivityType.UPDATED,
      title: "Event updated",
      actorUserId: input.actorUserId,
    });

    const party = await activeRegisteredPartySize(existing.id);
    return mapEvent(updated, party);
  },

  async publishEvent(input) {
    const existing = await prisma.churchEvent.findFirst({
      where: {
        id: input.eventId,
        organizationId: input.organizationId,
        deletedAt: null,
      },
    });
    if (!existing) throw notFound("Event not found");

    const updated = await prisma.churchEvent.update({
      where: { id: existing.id },
      data: {
        status: "PUBLISHED",
        publishedAt: existing.publishedAt ?? new Date(),
      },
      include: {
        _count: {
          select: {
            registrations: true,
            waitlist: true,
            checkIns: true,
            ministries: true,
          },
        },
      },
    });

    await logActivity({
      organizationId: input.organizationId,
      eventId: existing.id,
      type: EventActivityType.PUBLISHED,
      title: "Event published",
      actorUserId: input.actorUserId,
    });

    const party = await activeRegisteredPartySize(existing.id);
    return mapEvent(updated, party);
  },

  async cancelEvent(input) {
    return eventRepository.setStatus({
      ...input,
      status: ChurchEventStatus.CANCELLED,
    });
  },

  async softDeleteEvent(input) {
    const existing = await prisma.churchEvent.findFirst({
      where: {
        id: input.eventId,
        organizationId: input.organizationId,
        deletedAt: null,
      },
    });
    if (!existing) throw notFound("Event not found");
    await prisma.churchEvent.update({
      where: { id: existing.id },
      data: { deletedAt: new Date(), status: "ARCHIVED" },
    });
    await logActivity({
      organizationId: input.organizationId,
      eventId: existing.id,
      type: EventActivityType.UPDATED,
      title: "Event archived",
      actorUserId: input.actorUserId,
    });
  },

  async rescheduleEvent(input) {
    const existing = await prisma.churchEvent.findFirst({
      where: {
        id: input.eventId,
        organizationId: input.organizationId,
        deletedAt: null,
      },
    });
    if (!existing) throw notFound("Event not found");

    const durationMs =
      existing.endsAt && existing.startsAt
        ? existing.endsAt.getTime() - existing.startsAt.getTime()
        : null;
    const endsAt =
      input.endsAt !== undefined
        ? input.endsAt
        : durationMs != null
          ? new Date(input.startsAt.getTime() + durationMs)
          : existing.endsAt;

    const updated = await prisma.churchEvent.update({
      where: { id: existing.id },
      data: { startsAt: input.startsAt, endsAt },
      include: {
        _count: {
          select: {
            registrations: true,
            waitlist: true,
            checkIns: true,
            ministries: true,
          },
        },
      },
    });

    await logActivity({
      organizationId: input.organizationId,
      eventId: existing.id,
      type: EventActivityType.UPDATED,
      title: "Event rescheduled",
      description: input.startsAt.toISOString(),
      actorUserId: input.actorUserId,
      metadata: { startsAt: input.startsAt.toISOString() },
    });

    const party = await activeRegisteredPartySize(existing.id);
    return mapEvent(updated, party);
  },

  async register(input: RegisterForEventInput) {
    const event = await prisma.churchEvent.findFirst({
      where: {
        id: input.eventId,
        organizationId: input.organizationId,
        deletedAt: null,
      },
    });
    if (!event) throw notFound("Event not found");
    if (!event.registrationOpen) {
      throw conflict("Registration is closed for this event");
    }

    const partySize = Math.max(1, input.partySize ?? 1);
    const current = await activeRegisteredPartySize(event.id);
    const atCapacity =
      event.capacity != null && current + partySize > event.capacity;

    if (atCapacity && !event.waitlistEnabled) {
      throw conflict("Event is at capacity");
    }

    if (atCapacity && event.waitlistEnabled) {
      const last = await prisma.eventWaitlistEntry.findFirst({
        where: { eventId: event.id },
        orderBy: { position: "desc" },
      });
      const position = (last?.position ?? 0) + 1;
      await prisma.eventWaitlistEntry.create({
        data: {
          organizationId: input.organizationId,
          eventId: event.id,
          memberId: input.memberId ?? null,
          visitorId: input.visitorId ?? null,
          guestName: input.guestName ?? null,
          guestEmail: input.guestEmail ?? null,
          guestPhone: input.guestPhone ?? null,
          partySize,
          position,
        },
      });

      const waitlisted = await prisma.eventRegistration.create({
        data: {
          organizationId: input.organizationId,
          eventId: event.id,
          registrantType: (input.registrantType ??
            "GUEST") as PrismaRegistrantType,
          memberId: input.memberId ?? null,
          visitorId: input.visitorId ?? null,
          householdId: input.householdId ?? null,
          guestName: input.guestName ?? null,
          guestEmail: input.guestEmail ?? null,
          guestPhone: input.guestPhone ?? null,
          partySize,
          status: "WAITLISTED",
          notes: input.notes ?? null,
        },
        include: { tickets: true },
      });

      await logActivity({
        organizationId: input.organizationId,
        eventId: event.id,
        type: EventActivityType.WAITLIST,
        title: "Added to waitlist",
        description: registrationDisplayName(waitlisted),
        actorUserId: input.actorUserId,
      });

      return mapRegistration(waitlisted);
    }

    const registration = await prisma.eventRegistration.create({
      data: {
        organizationId: input.organizationId,
        eventId: event.id,
        registrantType: (input.registrantType ??
          "GUEST") as PrismaRegistrantType,
        memberId: input.memberId ?? null,
        visitorId: input.visitorId ?? null,
        householdId: input.householdId ?? null,
        guestName: input.guestName ?? null,
        guestEmail: input.guestEmail ?? null,
        guestPhone: input.guestPhone ?? null,
        partySize,
        status: "REGISTERED",
        notes: input.notes ?? null,
        tickets: event.requiresTicket
          ? {
              create: Array.from({ length: partySize }, (_, i) => ({
                organizationId: input.organizationId,
                eventId: event.id,
                holderName:
                  input.guestName ??
                  (partySize > 1 ? `Guest ${i + 1}` : null),
                status: "VALID",
              })),
            }
          : undefined,
      },
      include: { tickets: true },
    });

    await logActivity({
      organizationId: input.organizationId,
      eventId: event.id,
      type: EventActivityType.REGISTRATION,
      title: "Registration confirmed",
      description: registrationDisplayName(registration),
      actorUserId: input.actorUserId,
      metadata: { registrationId: registration.id, partySize },
    });

    return mapRegistration(registration);
  },

  async cancelRegistration(input) {
    const registration = await prisma.eventRegistration.findFirst({
      where: {
        id: input.registrationId,
        organizationId: input.organizationId,
      },
      include: { tickets: true },
    });
    if (!registration) throw notFound("Registration not found");

    const updated = await prisma.eventRegistration.update({
      where: { id: registration.id },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
      },
      include: { tickets: true },
    });

    await prisma.eventTicket.updateMany({
      where: { registrationId: registration.id, status: "VALID" },
      data: { status: "REVOKED" },
    });

    await logActivity({
      organizationId: input.organizationId,
      eventId: registration.eventId,
      type: EventActivityType.UPDATED,
      title: "Registration cancelled",
      actorUserId: input.actorUserId,
    });

    return mapRegistration(updated);
  },

  async checkIn(input: EventCheckInInput) {
    const event = await prisma.churchEvent.findFirst({
      where: {
        id: input.eventId,
        organizationId: input.organizationId,
        deletedAt: null,
      },
    });
    if (!event) throw notFound("Event not found");
    // BUG-011: check-in only for published events (not draft/cancelled/completed).
    if (event.status !== ChurchEventStatus.PUBLISHED) {
      throw conflict("Check-in is only allowed for published events");
    }

    let ticket: {
      id: string;
      status: PrismaEventTicketStatus;
      registrationId: string;
      holderName: string | null;
    } | null = null;
    let registrationId = input.registrationId ?? null;
    let memberId = input.memberId ?? null;

    if (input.method === "QR") {
      if (!input.qrToken?.trim()) throw conflict("QR token required");
      const found = await prisma.eventTicket.findFirst({
        where: {
          qrToken: input.qrToken.trim(),
          organizationId: input.organizationId,
          eventId: event.id,
        },
      });
      if (!found) throw notFound("Ticket not found");
      if (found.status === "USED") {
        throw conflict("Ticket already checked in");
      }
      if (found.status !== "VALID") {
        throw conflict(`Ticket is ${found.status.toLowerCase()}`);
      }
      const existing = await prisma.eventCheckIn.findFirst({
        where: { eventId: event.id, ticketId: found.id },
      });
      if (existing) throw conflict("Duplicate scan — already checked in");
      ticket = found;
      registrationId = found.registrationId;
    }

    if (registrationId) {
      const reg = await prisma.eventRegistration.findFirst({
        where: {
          id: registrationId,
          eventId: event.id,
          organizationId: input.organizationId,
        },
      });
      if (!reg) throw notFound("Registration not found");
      if (reg.status === "CHECKED_IN" && input.method !== "QR") {
        throw conflict("Already checked in");
      }
      if (reg.status === "CANCELLED") {
        throw conflict("Registration was cancelled");
      }
      if (reg.status === RegistrationStatus.WAITLISTED) {
        throw conflict("Waitlisted guests cannot check in until registered");
      }
      memberId = memberId ?? reg.memberId;
    }

    if (memberId && !ticket) {
      const existingMemberCheckIn = await prisma.eventCheckIn.findFirst({
        where: { eventId: event.id, memberId },
      });
      if (existingMemberCheckIn) {
        throw conflict("Member already checked in");
      }
    }

    const checkIn = await prisma.$transaction(async (tx) => {
      if (ticket) {
        await tx.eventTicket.update({
          where: { id: ticket.id },
          data: { status: "USED", usedAt: new Date() },
        });
      }
      if (registrationId) {
        await tx.eventRegistration.update({
          where: { id: registrationId },
          data: {
            status: "CHECKED_IN",
            checkedInAt: new Date(),
          },
        });
      }
      return tx.eventCheckIn.create({
        data: {
          organizationId: input.organizationId,
          eventId: event.id,
          registrationId,
          ticketId: ticket?.id ?? null,
          memberId,
          method: input.method,
          checkedInByUserId: input.actorUserId ?? null,
          notes:
            input.notes ??
            ticket?.holderName ??
            input.guestName ??
            null,
        },
      });
    });

    await logActivity({
      organizationId: input.organizationId,
      eventId: event.id,
      type: EventActivityType.CHECKED_IN,
      title: `Check-in via ${input.method}`,
      description: ticket?.holderName ?? input.guestName ?? memberId ?? null,
      actorUserId: input.actorUserId,
      metadata: {
        method: input.method,
        ticketId: ticket?.id ?? null,
        registrationId,
      },
    });

    return {
      id: checkIn.id,
      organizationId: checkIn.organizationId,
      eventId: checkIn.eventId,
      registrationId: checkIn.registrationId,
      ticketId: checkIn.ticketId,
      memberId: checkIn.memberId,
      method: checkIn.method,
      checkedInAt: checkIn.checkedInAt,
      checkedInByUserId: checkIn.checkedInByUserId,
      notes: checkIn.notes,
      createdAt: checkIn.createdAt,
      displayName: ticket?.holderName ?? input.guestName ?? undefined,
    };
  },

  async queueMessage(input) {
    const event = await prisma.churchEvent.findFirst({
      where: {
        id: input.eventId,
        organizationId: input.organizationId,
        deletedAt: null,
      },
    });
    if (!event) throw notFound("Event not found");

    const message = await prisma.eventMessage.create({
      data: {
        organizationId: input.organizationId,
        eventId: event.id,
        channel: input.channel as PrismaEventMessageChannel,
        subject: input.subject ?? null,
        body: input.body,
        actorUserId: input.actorUserId ?? null,
        scheduledFor: input.scheduledFor ?? null,
        metadata: DEFAULT_MESSAGE_METADATA,
      },
    });

    await logActivity({
      organizationId: input.organizationId,
      eventId: event.id,
      type: EventActivityType.MESSAGE_QUEUED,
      title: `${input.channel} reminder queued`,
      description: input.subject ?? input.body.slice(0, 80),
      actorUserId: input.actorUserId,
      metadata: { channel: input.channel, provider: null, queued: false },
    });

    return {
      id: message.id,
      organizationId: message.organizationId,
      eventId: message.eventId,
      channel: message.channel as EventMessageChannel,
      subject: message.subject,
      body: message.body,
      actorUserId: message.actorUserId,
      metadata: asJsonRecord(message.metadata),
      scheduledFor: message.scheduledFor,
      sentAt: message.sentAt,
      createdAt: message.createdAt,
    };
  },

  async linkMinistry(input) {
    const event = await prisma.churchEvent.findFirst({
      where: {
        id: input.eventId,
        organizationId: input.organizationId,
        deletedAt: null,
      },
    });
    if (!event) throw notFound("Event not found");

    const ministry = await prisma.ministry.findFirst({
      where: { id: input.ministryId, organizationId: input.organizationId },
    });
    if (!ministry) throw notFound("Ministry not found");

    await prisma.eventMinistry.upsert({
      where: {
        eventId_ministryId: {
          eventId: event.id,
          ministryId: ministry.id,
        },
      },
      create: {
        organizationId: input.organizationId,
        eventId: event.id,
        ministryId: ministry.id,
        notes: input.notes ?? null,
      },
      update: { notes: input.notes ?? null },
    });

    await logActivity({
      organizationId: input.organizationId,
      eventId: event.id,
      type: EventActivityType.VOLUNTEER_LINKED,
      title: `Linked ministry ${ministry.name}`,
      actorUserId: input.actorUserId,
    });
  },

  async getAnalytics(organizationId) {
    const now = new Date();
    const events = await prisma.churchEvent.findMany({
      where: { organizationId, deletedAt: null },
      select: {
        id: true,
        status: true,
        eventType: true,
        startsAt: true,
        capacity: true,
        scheduleEventId: true,
      },
    });

    const registrations = await prisma.eventRegistration.groupBy({
      by: ["status", "registrantType"],
      where: { organizationId },
      _count: true,
      _sum: { partySize: true },
    });

    const checkInCount = await prisma.eventCheckIn.count({
      where: { organizationId },
    });

    const totalRegistrations = registrations
      .filter((r) => r.status !== "CANCELLED")
      .reduce((s, r) => s + (r._sum.partySize ?? r._count), 0);

    const checkedInRegs = registrations
      .filter((r) => r.status === "CHECKED_IN")
      .reduce((s, r) => s + (r._sum.partySize ?? r._count), 0);

    const noShows = registrations
      .filter((r) => r.status === "NO_SHOW")
      .reduce((s, r) => s + (r._sum.partySize ?? r._count), 0);

    const completedOrPast = events.filter(
      (e) =>
        e.status === "COMPLETED" ||
        (e.startsAt < now && e.status === "PUBLISHED")
    ).length;

    const noShowDenom = checkedInRegs + noShows;
    const noShowRate =
      noShowDenom > 0 ? Math.round((noShows / noShowDenom) * 100) : 0;

    let capacitySum = 0;
    let capacityCount = 0;
    for (const event of events) {
      if (!event.capacity) continue;
      const party = await activeRegisteredPartySize(event.id);
      capacitySum += Math.min(100, Math.round((party / event.capacity) * 100));
      capacityCount += 1;
    }

    const byTypeMap = new Map<RegistrantType, number>();
    for (const r of registrations) {
      if (r.status === "CANCELLED") continue;
      const key = r.registrantType as RegistrantType;
      byTypeMap.set(
        key,
        (byTypeMap.get(key) ?? 0) + (r._sum.partySize ?? r._count)
      );
    }

    const eventsByTypeMap = new Map<ChurchEventType, number>();
    for (const e of events) {
      const t = e.eventType as ChurchEventType;
      eventsByTypeMap.set(t, (eventsByTypeMap.get(t) ?? 0) + 1);
    }

    let coverageTotal = 0;
    let coverageN = 0;
    for (const e of events.filter((x) => x.startsAt >= now).slice(0, 20)) {
      const summary = await resolveVolunteerSummary(organizationId, {
        id: e.id,
        startsAt: e.startsAt,
        endsAt: null,
        scheduleEventId: e.scheduleEventId,
      });
      coverageTotal += summary.coveragePercent;
      coverageN += 1;
    }

    const recentActivity = await prisma.eventActivity.findMany({
      where: { organizationId },
      orderBy: { occurredAt: "desc" },
      take: 12,
    });

    const analytics: EventAnalytics = {
      totalEvents: events.length,
      publishedEvents: events.filter((e) => e.status === "PUBLISHED").length,
      upcomingEvents: events.filter(
        (e) => e.startsAt >= now && e.status === "PUBLISHED"
      ).length,
      totalRegistrations,
      totalCheckIns: checkInCount,
      noShowRate,
      averageCapacityUsage:
        capacityCount > 0 ? Math.round(capacitySum / capacityCount) : 0,
      volunteerCoverage:
        coverageN > 0 ? Math.round(coverageTotal / coverageN) : 100,
      registrationsByType: [...byTypeMap.entries()].map(([type, count]) => ({
        type,
        count,
      })),
      eventsByType: [...eventsByTypeMap.entries()].map(([type, count]) => ({
        type,
        count,
      })),
      recentActivity: recentActivity.map(mapActivity),
    };

    void completedOrPast;
    return analytics;
  },

  async listActivities(organizationId, eventId, limit = 40) {
    const rows = await prisma.eventActivity.findMany({
      where: { organizationId, eventId },
      orderBy: { occurredAt: "desc" },
      take: limit,
    });
    return rows.map(mapActivity);
  },

  async setStatus(input) {
    const existing = await prisma.churchEvent.findFirst({
      where: {
        id: input.eventId,
        organizationId: input.organizationId,
        deletedAt: null,
      },
    });
    if (!existing) throw notFound("Event not found");

    const updated = await prisma.churchEvent.update({
      where: { id: existing.id },
      data: {
        status: input.status as PrismaChurchEventStatus,
        publishedAt:
          input.status === ChurchEventStatus.PUBLISHED
            ? (existing.publishedAt ?? new Date())
            : existing.publishedAt,
      },
      include: {
        _count: {
          select: {
            registrations: true,
            waitlist: true,
            checkIns: true,
            ministries: true,
          },
        },
      },
    });

    const activityType =
      input.status === ChurchEventStatus.PUBLISHED
        ? EventActivityType.PUBLISHED
        : input.status === ChurchEventStatus.CANCELLED
          ? EventActivityType.CANCELLED
          : EventActivityType.UPDATED;

    await logActivity({
      organizationId: input.organizationId,
      eventId: existing.id,
      type: activityType,
      title: `Status → ${input.status}`,
      actorUserId: input.actorUserId,
    });

    const party = await activeRegisteredPartySize(existing.id);
    return mapEvent(updated, party);
  },
};
