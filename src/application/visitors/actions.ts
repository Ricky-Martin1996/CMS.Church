"use server";

import {
  advanceVisitorStage,
  assignVisitorLeader,
  completeFollowUpTask,
  convertVisitorToMember,
  createFollowUpTask,
  getPipelineBoard,
  getVisitorDashboard,
  getVisitorProfile,
  listOpenFollowUpTasks,
  listVisitors,
  logVisitorCommunication,
  setVisitorStage,
  updateFollowUpTask,
} from "@/application/visitors/visitor-journey-service";
import {
  CommunicationChannel,
  CommunicationDirection,
  FollowUpPriority,
  FollowUpTaskStatus,
  FollowUpTaskType,
  VisitorPipelineStage,
} from "@/domain/enums/visitor";
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
  console.error("[visitor action]", error);
  return { ok: false, error: "Something went wrong" };
}

function revalidateVisitors() {
  revalidatePath("/visitors");
  revalidatePath("/people/visitors");
}

const listFilterSchema = z.object({
  status: z.array(z.nativeEnum(VisitorPipelineStage)).optional(),
  query: z.string().optional(),
  assignedLeaderId: z.string().nullable().optional(),
  needsFollowUp: z.boolean().optional(),
  limit: z.number().int().min(1).max(500).optional(),
});

export async function listVisitorsAction(
  input?: z.infer<typeof listFilterSchema>
) {
  try {
    const ctx = await requirePermission(Permission.VISITOR_READ);
    const filter = input ? listFilterSchema.parse(input) : undefined;
    const data = await listVisitors({
      organizationId: ctx.organization.id,
      status: filter?.status,
      query: filter?.query,
      assignedLeaderId: filter?.assignedLeaderId,
      needsFollowUp: filter?.needsFollowUp,
      limit: filter?.limit,
    });
    return { ok: true as const, data };
  } catch (error) {
    return actionError(error);
  }
}

export async function getPipelineBoardAction() {
  try {
    const ctx = await requirePermission(Permission.VISITOR_READ);
    const data = await getPipelineBoard(ctx.organization.id);
    return { ok: true as const, data };
  } catch (error) {
    return actionError(error);
  }
}

export async function getVisitorProfileAction(visitorId: string) {
  try {
    const ctx = await requirePermission(Permission.VISITOR_READ);
    const data = await getVisitorProfile(ctx.organization.id, visitorId);
    if (!data) {
      return { ok: false as const, error: "Visitor not found" };
    }
    return { ok: true as const, data };
  } catch (error) {
    return actionError(error);
  }
}

export async function getVisitorDashboardAction() {
  try {
    const ctx = await requirePermission(Permission.VISITOR_READ);
    const data = await getVisitorDashboard(ctx.organization.id);
    return { ok: true as const, data };
  } catch (error) {
    return actionError(error);
  }
}

export async function advanceVisitorStageAction(
  visitorId: string,
  raw?: { note?: string }
) {
  try {
    const ctx = await requirePermission(Permission.VISITOR_WRITE);
    const parsed = z
      .object({
        visitorId: z.string().min(1),
        note: z.string().max(500).optional(),
      })
      .parse({ visitorId, note: raw?.note });
    const data = await advanceVisitorStage({
      organizationId: ctx.organization.id,
      visitorId: parsed.visitorId,
      actorUserId: ctx.user.id,
      note: parsed.note,
    });
    revalidateVisitors();
    return { ok: true as const, data };
  } catch (error) {
    return actionError(error);
  }
}

export async function setVisitorStageAction(
  visitorId: string,
  raw: { stage: VisitorPipelineStage; note?: string }
) {
  try {
    const ctx = await requirePermission(Permission.VISITOR_WRITE);
    const parsed = z.object({
      stage: z.nativeEnum(VisitorPipelineStage),
      note: z.string().max(500).optional(),
    }).parse(raw);
    const data = await setVisitorStage({
      organizationId: ctx.organization.id,
      visitorId,
      stage: parsed.stage,
      actorUserId: ctx.user.id,
      note: parsed.note,
    });
    revalidateVisitors();
    return { ok: true as const, data };
  } catch (error) {
    return actionError(error);
  }
}

export async function assignVisitorLeaderAction(
  visitorId: string,
  raw: { leaderId: string | null; assignedUserId?: string | null }
) {
  try {
    const ctx = await requirePermission(Permission.VISITOR_ASSIGN);
    const parsed = z.object({
      leaderId: z.string().nullable(),
      assignedUserId: z.string().nullable().optional(),
    }).parse(raw);
    const data = await assignVisitorLeader({
      organizationId: ctx.organization.id,
      visitorId,
      leaderId: parsed.leaderId,
      assignedUserId: parsed.assignedUserId,
      actorUserId: ctx.user.id,
    });
    revalidateVisitors();
    return { ok: true as const, data };
  } catch (error) {
    return actionError(error);
  }
}

export async function createFollowUpTaskAction(
  visitorId: string,
  raw: {
    type: FollowUpTaskType;
    title?: string;
    description?: string;
    ownerUserId?: string | null;
    dueAt?: string;
    priority?: FollowUpPriority;
  }
) {
  try {
    const ctx = await requirePermission(Permission.VISITOR_WRITE);
    const parsed = z.object({
      type: z.nativeEnum(FollowUpTaskType),
      title: z.string().min(1).max(200).optional(),
      description: z.string().max(2000).optional(),
      ownerUserId: z.string().nullable().optional(),
      dueAt: z.string().datetime().optional(),
      priority: z.nativeEnum(FollowUpPriority).optional(),
    }).parse(raw);
    const data = await createFollowUpTask({
      organizationId: ctx.organization.id,
      visitorId,
      type: parsed.type,
      title: parsed.title,
      description: parsed.description,
      ownerUserId: parsed.ownerUserId,
      dueAt: parsed.dueAt ? new Date(parsed.dueAt) : null,
      priority: parsed.priority,
      actorUserId: ctx.user.id,
    });
    revalidateVisitors();
    return { ok: true as const, data };
  } catch (error) {
    return actionError(error);
  }
}

export async function completeFollowUpTaskAction(
  taskId: string,
  raw?: { notes?: string }
) {
  try {
    const ctx = await requirePermission(Permission.VISITOR_WRITE);
    const notes = raw?.notes;
    const data = await completeFollowUpTask({
      organizationId: ctx.organization.id,
      taskId,
      actorUserId: ctx.user.id,
      notes,
    });
    revalidateVisitors();
    return { ok: true as const, data };
  } catch (error) {
    return actionError(error);
  }
}

export async function updateFollowUpTaskAction(
  taskId: string,
  raw: {
    title?: string;
    description?: string | null;
    ownerUserId?: string | null;
    dueAt?: string | null;
    priority?: FollowUpPriority;
    status?: FollowUpTaskStatus;
    notes?: string | null;
  }
) {
  try {
    const ctx = await requirePermission(Permission.VISITOR_WRITE);
    const parsed = z.object({
      title: z.string().min(1).max(200).optional(),
      description: z.string().max(2000).nullable().optional(),
      ownerUserId: z.string().nullable().optional(),
      dueAt: z.string().datetime().nullable().optional(),
      priority: z.nativeEnum(FollowUpPriority).optional(),
      status: z.nativeEnum(FollowUpTaskStatus).optional(),
      notes: z.string().max(2000).nullable().optional(),
    }).parse(raw);
    const data = await updateFollowUpTask({
      organizationId: ctx.organization.id,
      taskId,
      actorUserId: ctx.user.id,
      title: parsed.title,
      description: parsed.description,
      ownerUserId: parsed.ownerUserId,
      dueAt: parsed.dueAt ? new Date(parsed.dueAt) : parsed.dueAt === null ? null : undefined,
      priority: parsed.priority,
      status: parsed.status,
      notes: parsed.notes,
    });
    revalidateVisitors();
    return { ok: true as const, data };
  } catch (error) {
    return actionError(error);
  }
}

export async function logVisitorCommunicationAction(
  visitorId: string,
  raw: {
    channel: CommunicationChannel;
    direction?: CommunicationDirection;
    subject?: string;
    body: string;
  }
) {
  try {
    const ctx = await requirePermission(Permission.VISITOR_COMMUNICATE);
    const parsed = z.object({
      channel: z.nativeEnum(CommunicationChannel),
      direction: z.nativeEnum(CommunicationDirection).optional(),
      subject: z.string().max(200).optional(),
      body: z.string().min(1).max(5000),
    }).parse(raw);
    const data = await logVisitorCommunication({
      organizationId: ctx.organization.id,
      visitorId,
      channel: parsed.channel,
      direction: parsed.direction,
      subject: parsed.subject,
      body: parsed.body,
      actorUserId: ctx.user.id,
    });
    revalidateVisitors();
    return { ok: true as const, data };
  } catch (error) {
    return actionError(error);
  }
}

export async function convertVisitorToMemberAction(
  visitorId: string,
  raw?: { tagIds?: string[] }
) {
  try {
    const ctx = await requirePermission(Permission.VISITOR_CONVERT);
    const parsed = z.object({
      tagIds: z.array(z.string()).optional(),
    }).parse(raw ?? {});
    const data = await convertVisitorToMember({
      organizationId: ctx.organization.id,
      visitorId,
      actorUserId: ctx.user.id,
      tagIds: parsed.tagIds,
    });
    revalidateVisitors();
    revalidatePath("/people");
    return { ok: true as const, data };
  } catch (error) {
    return actionError(error);
  }
}

export async function listOpenFollowUpTasksAction(
  input?: {
    ownerUserId?: string | null;
    visitorId?: string;
    overdueOnly?: boolean;
    limit?: number;
  }
) {
  try {
    const ctx = await requirePermission(Permission.VISITOR_READ);
    const data = await listOpenFollowUpTasks({
      organizationId: ctx.organization.id,
      ownerUserId: input?.ownerUserId,
      visitorId: input?.visitorId,
      overdueOnly: input?.overdueOnly,
      limit: input?.limit,
    });
    return { ok: true as const, data };
  } catch (error) {
    return actionError(error);
  }
}
