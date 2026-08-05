"use server";

import {
  assignVolunteer,
  checkInVolunteer,
  createMinistry,
  createScheduleEvent,
  createSwapRequest,
  ensureDefaultMinistries,
  getMinistryAnalytics,
  getSchedulerBoard,
  getVolunteerProfile,
  listMinistries,
  listScheduleEvents,
  listVolunteers,
  resolveSwapRequest,
  sendVolunteerMessage,
  updateAssignmentStatus,
  upsertVolunteerProfile,
} from "@/application/ministries/ministry-service";
import {
  ScheduleAssignmentStatus,
  ScheduleEventType,
  TrainingStatus,
  VolunteerCheckInStatus,
  VolunteerMessageChannel,
  Weekday,
} from "@/domain/enums/ministry";
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
  console.error("[ministries action]", error);
  return { ok: false, error: "Something went wrong" };
}

export async function listMinistriesAction() {
  try {
    const ctx = await requirePermission(Permission.MINISTRY_READ);
    const data = await listMinistries(ctx.organization.id);
    return { ok: true as const, data };
  } catch (error) {
    return actionError(error);
  }
}

export async function createMinistryAction(raw: unknown) {
  try {
    const ctx = await requirePermission(Permission.MINISTRY_WRITE);
    const data = z
      .object({
        name: z.string().min(1).max(120),
        slug: z.string().min(1).max(80),
        description: z.string().max(2000).optional(),
        color: z.string().max(20).optional(),
        icon: z.string().max(40).optional(),
        leaderMemberId: z.string().optional(),
        sortOrder: z.number().int().optional(),
      })
      .parse(raw);
    const ministry = await createMinistry({
      organizationId: ctx.organization.id,
      name: data.name,
      slug: data.slug,
      description: data.description ?? null,
      color: data.color,
      icon: data.icon ?? null,
      leaderMemberId: data.leaderMemberId ?? null,
      sortOrder: data.sortOrder,
      actorUserId: ctx.user.id,
    });
    revalidatePath("/ministries");
    return { ok: true as const, data: ministry };
  } catch (error) {
    return actionError(error);
  }
}

export async function ensureDefaultMinistriesAction() {
  try {
    const ctx = await requirePermission(Permission.MINISTRY_WRITE);
    const data = await ensureDefaultMinistries(ctx.organization.id);
    revalidatePath("/ministries");
    return { ok: true as const, data };
  } catch (error) {
    return actionError(error);
  }
}

export async function listVolunteersAction(raw?: unknown) {
  try {
    const ctx = await requirePermission(Permission.VOLUNTEER_READ);
    const filter = z
      .object({
        ministryId: z.string().optional(),
        isActive: z.boolean().optional(),
        query: z.string().optional(),
        limit: z.number().int().min(1).max(200).optional(),
      })
      .optional()
      .parse(raw);
    const data = await listVolunteers({
      organizationId: ctx.organization.id,
      ministryId: filter?.ministryId,
      isActive: filter?.isActive,
      query: filter?.query,
      limit: filter?.limit,
    });
    return { ok: true as const, data };
  } catch (error) {
    return actionError(error);
  }
}

export async function upsertVolunteerProfileAction(raw: unknown) {
  try {
    const ctx = await requirePermission(Permission.VOLUNTEER_WRITE);
    const data = z
      .object({
        memberId: z.string().min(1),
        experienceYears: z.number().int().min(0).nullable().optional(),
        trainingStatus: z.nativeEnum(TrainingStatus).optional(),
        preferredService: z.string().max(120).nullable().optional(),
        emergencyName: z.string().max(120).nullable().optional(),
        emergencyPhone: z.string().max(40).nullable().optional(),
        notes: z.string().max(2000).nullable().optional(),
        reliabilityScore: z.number().int().min(0).max(100).optional(),
        isActive: z.boolean().optional(),
        skills: z
          .array(
            z.object({
              name: z.string().min(1),
              level: z.string().nullable().optional(),
            })
          )
          .optional(),
        certifications: z
          .array(
            z.object({
              name: z.string().min(1),
              issuer: z.string().nullable().optional(),
              issuedAt: z.string().datetime().nullable().optional(),
              expiresAt: z.string().datetime().nullable().optional(),
            })
          )
          .optional(),
        availabilities: z
          .array(
            z.object({
              weekday: z.nativeEnum(Weekday),
              startTime: z.string().min(1),
              endTime: z.string().min(1),
              notes: z.string().nullable().optional(),
            })
          )
          .optional(),
        ministryPreferences: z
          .array(
            z.object({
              ministryId: z.string().min(1),
              priority: z.number().int().min(1).optional(),
            })
          )
          .optional(),
      })
      .parse(raw);

    const profile = await upsertVolunteerProfile({
      organizationId: ctx.organization.id,
      memberId: data.memberId,
      experienceYears: data.experienceYears,
      trainingStatus: data.trainingStatus,
      preferredService: data.preferredService,
      emergencyName: data.emergencyName,
      emergencyPhone: data.emergencyPhone,
      notes: data.notes,
      reliabilityScore: data.reliabilityScore,
      isActive: data.isActive,
      skills: data.skills,
      certifications: data.certifications?.map((c) => ({
        name: c.name,
        issuer: c.issuer,
        issuedAt: c.issuedAt ? new Date(c.issuedAt) : null,
        expiresAt: c.expiresAt ? new Date(c.expiresAt) : null,
      })),
      availabilities: data.availabilities,
      ministryPreferences: data.ministryPreferences,
      actorUserId: ctx.user.id,
    });
    revalidatePath("/ministries");
    revalidatePath("/volunteers");
    return { ok: true as const, data: profile };
  } catch (error) {
    return actionError(error);
  }
}

export async function getVolunteerProfileAction(volunteerId: string) {
  try {
    const ctx = await requirePermission(Permission.VOLUNTEER_READ);
    const data = await getVolunteerProfile(ctx.organization.id, volunteerId);
    return { ok: true as const, data };
  } catch (error) {
    return actionError(error);
  }
}

export async function listScheduleEventsAction(raw?: unknown) {
  try {
    const ctx = await requirePermission(Permission.MINISTRY_READ);
    const filter = z
      .object({
        from: z.string().datetime().optional(),
        to: z.string().datetime().optional(),
        ministryId: z.string().optional(),
        eventType: z.nativeEnum(ScheduleEventType).optional(),
        limit: z.number().int().min(1).max(100).optional(),
      })
      .optional()
      .parse(raw);
    const data = await listScheduleEvents({
      organizationId: ctx.organization.id,
      from: filter?.from ? new Date(filter.from) : undefined,
      to: filter?.to ? new Date(filter.to) : undefined,
      ministryId: filter?.ministryId,
      eventType: filter?.eventType,
      limit: filter?.limit,
    });
    return { ok: true as const, data };
  } catch (error) {
    return actionError(error);
  }
}

export async function createScheduleEventAction(raw: unknown) {
  try {
    const ctx = await requirePermission(Permission.SCHEDULE_MANAGE);
    const data = z
      .object({
        ministryId: z.string().nullable().optional(),
        title: z.string().min(1).max(200),
        eventType: z.nativeEnum(ScheduleEventType).optional(),
        campus: z.string().max(80).nullable().optional(),
        startsAt: z.string().datetime(),
        endsAt: z.string().datetime().nullable().optional(),
        location: z.string().max(200).nullable().optional(),
        notes: z.string().max(2000).nullable().optional(),
        slots: z
          .array(
            z.object({
              roleId: z.string().nullable().optional(),
              title: z.string().min(1),
              needed: z.number().int().min(1).optional(),
              startsAt: z.string().datetime(),
              endsAt: z.string().datetime().nullable().optional(),
              sortOrder: z.number().int().optional(),
            })
          )
          .min(1),
      })
      .parse(raw);

    const event = await createScheduleEvent({
      organizationId: ctx.organization.id,
      ministryId: data.ministryId,
      title: data.title,
      eventType: data.eventType,
      campus: data.campus,
      startsAt: new Date(data.startsAt),
      endsAt: data.endsAt ? new Date(data.endsAt) : null,
      location: data.location,
      notes: data.notes,
      slots: data.slots.map((s) => ({
        roleId: s.roleId,
        title: s.title,
        needed: s.needed,
        startsAt: new Date(s.startsAt),
        endsAt: s.endsAt ? new Date(s.endsAt) : null,
        sortOrder: s.sortOrder,
      })),
      actorUserId: ctx.user.id,
    });
    revalidatePath("/ministries");
    revalidatePath("/schedule");
    return { ok: true as const, data: event };
  } catch (error) {
    return actionError(error);
  }
}

export async function getSchedulerBoardAction(raw: unknown) {
  try {
    const ctx = await requirePermission(Permission.SCHEDULE_MANAGE);
    const data = z
      .object({
        eventId: z.string().optional(),
        date: z.string().datetime().optional(),
      })
      .refine((v) => v.eventId || v.date, {
        message: "eventId or date is required",
      })
      .parse(raw);
    const board = await getSchedulerBoard({
      organizationId: ctx.organization.id,
      eventId: data.eventId,
      date: data.date ? new Date(data.date) : undefined,
    });
    return { ok: true as const, data: board };
  } catch (error) {
    return actionError(error);
  }
}

export async function assignVolunteerAction(raw: unknown) {
  try {
    const ctx = await requirePermission(Permission.SCHEDULE_MANAGE);
    const data = z
      .object({
        slotId: z.string().min(1),
        volunteerId: z.string().min(1),
        notes: z.string().max(500).nullable().optional(),
      })
      .parse(raw);
    const result = await assignVolunteer({
      organizationId: ctx.organization.id,
      slotId: data.slotId,
      volunteerId: data.volunteerId,
      notes: data.notes,
      actorUserId: ctx.user.id,
    });
    revalidatePath("/schedule");
    return { ok: true as const, data: result };
  } catch (error) {
    return actionError(error);
  }
}

export async function updateAssignmentStatusAction(raw: unknown) {
  try {
    const ctx = await requirePermission(Permission.SCHEDULE_MANAGE);
    const data = z
      .object({
        assignmentId: z.string().min(1),
        status: z.nativeEnum(ScheduleAssignmentStatus),
      })
      .parse(raw);
    const assignment = await updateAssignmentStatus({
      organizationId: ctx.organization.id,
      assignmentId: data.assignmentId,
      status: data.status,
      actorUserId: ctx.user.id,
    });
    revalidatePath("/schedule");
    return { ok: true as const, data: assignment };
  } catch (error) {
    return actionError(error);
  }
}

export async function createSwapRequestAction(raw: unknown) {
  try {
    const ctx = await requirePermission(Permission.VOLUNTEER_WRITE);
    const data = z
      .object({
        fromAssignmentId: z.string().min(1),
        toVolunteerId: z.string().nullable().optional(),
        message: z.string().max(1000).nullable().optional(),
      })
      .parse(raw);
    const swap = await createSwapRequest({
      organizationId: ctx.organization.id,
      fromAssignmentId: data.fromAssignmentId,
      toVolunteerId: data.toVolunteerId,
      message: data.message,
      actorUserId: ctx.user.id,
    });
    revalidatePath("/schedule");
    return { ok: true as const, data: swap };
  } catch (error) {
    return actionError(error);
  }
}

export async function resolveSwapRequestAction(raw: unknown) {
  try {
    const ctx = await requirePermission(Permission.SCHEDULE_MANAGE);
    const data = z
      .object({
        swapRequestId: z.string().min(1),
        accept: z.boolean(),
      })
      .parse(raw);
    const swap = await resolveSwapRequest({
      organizationId: ctx.organization.id,
      swapRequestId: data.swapRequestId,
      accept: data.accept,
      actorUserId: ctx.user.id,
    });
    revalidatePath("/schedule");
    return { ok: true as const, data: swap };
  } catch (error) {
    return actionError(error);
  }
}

export async function volunteerCheckInAction(raw: unknown) {
  try {
    const ctx = await requirePermission(Permission.VOLUNTEER_WRITE);
    const data = z
      .object({
        volunteerId: z.string().min(1),
        assignmentId: z.string().nullable().optional(),
        status: z.nativeEnum(VolunteerCheckInStatus),
        notes: z.string().max(500).nullable().optional(),
      })
      .parse(raw);
    const checkIn = await checkInVolunteer({
      organizationId: ctx.organization.id,
      volunteerId: data.volunteerId,
      assignmentId: data.assignmentId,
      status: data.status,
      notes: data.notes,
      actorUserId: ctx.user.id,
    });
    revalidatePath("/schedule");
    return { ok: true as const, data: checkIn };
  } catch (error) {
    return actionError(error);
  }
}

export async function sendVolunteerMessageAction(raw: unknown) {
  try {
    const ctx = await requirePermission(Permission.VOLUNTEER_WRITE);
    const data = z
      .object({
        volunteerId: z.string().nullable().optional(),
        ministryId: z.string().nullable().optional(),
        channel: z.nativeEnum(VolunteerMessageChannel),
        subject: z.string().max(200).nullable().optional(),
        body: z.string().min(1).max(5000),
      })
      .parse(raw);
    const message = await sendVolunteerMessage({
      organizationId: ctx.organization.id,
      volunteerId: data.volunteerId,
      ministryId: data.ministryId,
      channel: data.channel,
      subject: data.subject,
      body: data.body,
      actorUserId: ctx.user.id,
    });
    return { ok: true as const, data: message };
  } catch (error) {
    return actionError(error);
  }
}

export async function getMinistryAnalyticsAction() {
  try {
    const ctx = await requirePermission(Permission.MINISTRY_READ);
    const data = await getMinistryAnalytics(ctx.organization.id);
    return { ok: true as const, data };
  } catch (error) {
    return actionError(error);
  }
}
