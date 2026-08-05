import type { VisitorJourneyRepository } from "@/application/ports/visitor-repositories";
import type { VisitorEntity } from "@/domain/entities/attendance";
import type {
  CommunicationLogEntity,
  FollowUpTaskEntity,
  PipelineBoardColumn,
  VisitorActivityEntity,
  VisitorDashboard,
  VisitorJourneyEntity,
  VisitorListItem,
  VisitorProfile,
  VisitorStageConfigEntity,
  VisitorStatusHistoryEntity,
} from "@/domain/entities/visitor-journey";
import {
  CommunicationChannel,
  CommunicationDirection,
  DEFAULT_VISITOR_STAGE_CONFIGS,
  FOLLOW_UP_TASK_TYPE_LABELS,
  FollowUpPriority,
  FollowUpTaskStatus,
  FollowUpTaskType,
  VISITOR_PIPELINE_LABELS,
  VISITOR_PIPELINE_ORDER,
  VisitorActivityType,
  VisitorPipelineStage,
} from "@/domain/enums/visitor";
import { memberRepository } from "@/infrastructure/repositories/member-repository";
import { prisma } from "@/infrastructure/db/prisma";
import { notFound } from "@/server/errors";
import type {
  CommunicationChannel as PrismaCommunicationChannel,
  CommunicationDirection as PrismaCommunicationDirection,
  FollowUpPriority as PrismaFollowUpPriority,
  FollowUpTaskStatus as PrismaFollowUpTaskStatus,
  FollowUpTaskType as PrismaFollowUpTaskType,
  Prisma,
  VisitorActivityType as PrismaVisitorActivityType,
  VisitorPipelineStage as PrismaVisitorPipelineStage,
} from "@prisma/client";
import { subDays } from "date-fns";

const DEFAULT_COMM_METADATA = { provider: null, queued: false };

function asJsonRecord(value: unknown): Record<string, unknown> | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function parseAutoTaskTypes(value: unknown): FollowUpTaskType[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is FollowUpTaskType =>
    typeof item === "string" &&
    Object.values(FollowUpTaskType).includes(item as FollowUpTaskType)
  );
}

function visitorDisplayName(firstName: string, lastName: string) {
  return `${firstName} ${lastName}`.trim();
}

function mapStageConfig(row: {
  id: string;
  organizationId: string;
  stageKey: PrismaVisitorPipelineStage;
  label: string;
  sortOrder: number;
  isActive: boolean;
  autoTaskTypes: unknown;
  slaHours: number | null;
  createdAt: Date;
  updatedAt: Date;
}): VisitorStageConfigEntity {
  return {
    id: row.id,
    organizationId: row.organizationId,
    stageKey: row.stageKey as VisitorPipelineStage,
    label: row.label,
    sortOrder: row.sortOrder,
    isActive: row.isActive,
    autoTaskTypes: parseAutoTaskTypes(row.autoTaskTypes),
    slaHours: row.slaHours,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapVisitor(row: {
  id: string;
  organizationId: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  invitedByMemberId: string | null;
  householdId: string | null;
  familyName: string | null;
  childrenCount: number;
  prayerRequest: string | null;
  notes: string | null;
  convertedMemberId: string | null;
  status: PrismaVisitorPipelineStage;
  assignedLeaderId: string | null;
  assignedUserId: string | null;
  stageEnteredAt: Date;
  source: string | null;
  preferredChannel: PrismaCommunicationChannel | null;
  createdAt: Date;
  updatedAt: Date;
}): VisitorEntity {
  return {
    id: row.id,
    organizationId: row.organizationId,
    firstName: row.firstName,
    lastName: row.lastName,
    phone: row.phone,
    email: row.email,
    invitedByMemberId: row.invitedByMemberId,
    householdId: row.householdId,
    familyName: row.familyName,
    childrenCount: row.childrenCount,
    prayerRequest: row.prayerRequest,
    notes: row.notes,
    convertedMemberId: row.convertedMemberId,
    status: row.status as VisitorPipelineStage,
    assignedLeaderId: row.assignedLeaderId,
    assignedUserId: row.assignedUserId,
    stageEnteredAt: row.stageEnteredAt,
    source: row.source,
    preferredChannel: row.preferredChannel as CommunicationChannel | null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapJourney(row: {
  id: string;
  organizationId: string;
  visitorId: string;
  currentStage: PrismaVisitorPipelineStage;
  startedAt: Date;
  completedAt: Date | null;
  convertedAt: Date | null;
  conversionMemberId: string | null;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
}): VisitorJourneyEntity {
  return {
    id: row.id,
    organizationId: row.organizationId,
    visitorId: row.visitorId,
    currentStage: row.currentStage as VisitorPipelineStage,
    startedAt: row.startedAt,
    completedAt: row.completedAt,
    convertedAt: row.convertedAt,
    conversionMemberId: row.conversionMemberId,
    metadata: asJsonRecord(row.metadata),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapTask(row: {
  id: string;
  organizationId: string;
  visitorId: string;
  type: PrismaFollowUpTaskType;
  title: string;
  description: string | null;
  ownerUserId: string | null;
  dueAt: Date | null;
  priority: PrismaFollowUpPriority;
  status: PrismaFollowUpTaskStatus;
  notes: string | null;
  completedAt: Date | null;
  automationKey: string | null;
  createdAt: Date;
  updatedAt: Date;
}): FollowUpTaskEntity {
  return {
    id: row.id,
    organizationId: row.organizationId,
    visitorId: row.visitorId,
    type: row.type as FollowUpTaskType,
    title: row.title,
    description: row.description,
    ownerUserId: row.ownerUserId,
    dueAt: row.dueAt,
    priority: row.priority as FollowUpPriority,
    status: row.status as FollowUpTaskStatus,
    notes: row.notes,
    completedAt: row.completedAt,
    automationKey: row.automationKey,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapCommunication(row: {
  id: string;
  organizationId: string;
  visitorId: string;
  channel: PrismaCommunicationChannel;
  direction: PrismaCommunicationDirection;
  subject: string | null;
  body: string;
  actorUserId: string | null;
  occurredAt: Date;
  metadata: unknown;
  createdAt: Date;
}): CommunicationLogEntity {
  return {
    id: row.id,
    organizationId: row.organizationId,
    visitorId: row.visitorId,
    channel: row.channel as CommunicationChannel,
    direction: row.direction as CommunicationDirection,
    subject: row.subject,
    body: row.body,
    actorUserId: row.actorUserId,
    occurredAt: row.occurredAt,
    metadata: asJsonRecord(row.metadata),
    createdAt: row.createdAt,
  };
}

function mapStatusHistory(row: {
  id: string;
  organizationId: string;
  visitorId: string;
  fromStatus: PrismaVisitorPipelineStage | null;
  toStatus: PrismaVisitorPipelineStage;
  changedByUserId: string | null;
  note: string | null;
  occurredAt: Date;
}): VisitorStatusHistoryEntity {
  return {
    id: row.id,
    organizationId: row.organizationId,
    visitorId: row.visitorId,
    fromStatus: row.fromStatus as VisitorPipelineStage | null,
    toStatus: row.toStatus as VisitorPipelineStage,
    changedByUserId: row.changedByUserId,
    note: row.note,
    occurredAt: row.occurredAt,
  };
}

function mapActivity(row: {
  id: string;
  organizationId: string;
  visitorId: string;
  type: PrismaVisitorActivityType;
  title: string;
  description: string | null;
  actorUserId: string | null;
  metadata: unknown;
  occurredAt: Date;
  createdAt: Date;
}): VisitorActivityEntity {
  return {
    id: row.id,
    organizationId: row.organizationId,
    visitorId: row.visitorId,
    type: row.type as VisitorActivityType,
    title: row.title,
    description: row.description,
    actorUserId: row.actorUserId,
    metadata: asJsonRecord(row.metadata),
    occurredAt: row.occurredAt,
    createdAt: row.createdAt,
  };
}

async function requireVisitor(organizationId: string, visitorId: string) {
  const visitor = await prisma.visitor.findFirst({
    where: { id: visitorId, organizationId },
  });
  if (!visitor) throw notFound("Visitor not found");
  return visitor;
}

async function getLeaderNameMap(organizationId: string, leaderIds: string[]) {
  const uniqueIds = [...new Set(leaderIds.filter(Boolean))];
  if (uniqueIds.length === 0) return new Map<string, string>();

  const members = await prisma.member.findMany({
    where: { organizationId, id: { in: uniqueIds }, deletedAt: null },
    select: { id: true, firstName: true, lastName: true },
  });

  return new Map(
    members.map((m) => [m.id, visitorDisplayName(m.firstName, m.lastName)])
  );
}

async function createAutoTasksForStage(input: {
  organizationId: string;
  visitorId: string;
  stage: VisitorPipelineStage;
  actorUserId?: string | null;
}) {
  const config = await prisma.visitorStageConfig.findUnique({
    where: {
      organizationId_stageKey: {
        organizationId: input.organizationId,
        stageKey: input.stage as PrismaVisitorPipelineStage,
      },
    },
  });

  const autoTaskTypes = config
    ? parseAutoTaskTypes(config.autoTaskTypes)
    : DEFAULT_VISITOR_STAGE_CONFIGS.find((c) => c.stageKey === input.stage)
        ?.autoTaskTypes ?? [];

  const slaHours = config?.slaHours ??
    DEFAULT_VISITOR_STAGE_CONFIGS.find((c) => c.stageKey === input.stage)
      ?.slaHours ??
    null;

  const now = new Date();
  const dueAt =
    slaHours !== null ? new Date(now.getTime() + slaHours * 60 * 60 * 1000) : null;

  for (const taskType of autoTaskTypes) {
    const automationKey = `${input.stage}:${taskType}:${input.visitorId}`;
    const existing = await prisma.followUpTask.findFirst({
      where: {
        organizationId: input.organizationId,
        automationKey,
      },
    });
    if (existing) continue;

    const title = FOLLOW_UP_TASK_TYPE_LABELS[taskType];

    await prisma.followUpTask.create({
      data: {
        organizationId: input.organizationId,
        visitorId: input.visitorId,
        type: taskType as PrismaFollowUpTaskType,
        title,
        priority: "MEDIUM" as PrismaFollowUpPriority,
        status: "OPEN" as PrismaFollowUpTaskStatus,
        dueAt,
        automationKey,
      },
    });

    await prisma.visitorActivity.create({
      data: {
        organizationId: input.organizationId,
        visitorId: input.visitorId,
        type: "TASK_CREATED" as PrismaVisitorActivityType,
        title: `Auto task: ${title}`,
        actorUserId: input.actorUserId ?? null,
        metadata: { automationKey, taskType, stage: input.stage },
      },
    });
  }
}

async function transitionStage(input: {
  organizationId: string;
  visitorId: string;
  fromStatus: VisitorPipelineStage | null;
  toStatus: VisitorPipelineStage;
  actorUserId: string;
  note?: string | null;
}) {
  const now = new Date();

  await prisma.visitor.update({
    where: { id: input.visitorId },
    data: {
      status: input.toStatus as PrismaVisitorPipelineStage,
      stageEnteredAt: now,
    },
  });

  await prisma.visitorJourney.updateMany({
    where: { visitorId: input.visitorId, organizationId: input.organizationId },
    data: {
      currentStage: input.toStatus as PrismaVisitorPipelineStage,
      ...(input.toStatus === VisitorPipelineStage.MEMBER
        ? { completedAt: now, convertedAt: now }
        : {}),
    },
  });

  await prisma.visitorStatusHistory.create({
    data: {
      organizationId: input.organizationId,
      visitorId: input.visitorId,
      fromStatus: input.fromStatus as PrismaVisitorPipelineStage | null,
      toStatus: input.toStatus as PrismaVisitorPipelineStage,
      changedByUserId: input.actorUserId,
      note: input.note ?? null,
    },
  });

  await prisma.visitorActivity.create({
    data: {
      organizationId: input.organizationId,
      visitorId: input.visitorId,
      type: "STAGE_CHANGED" as PrismaVisitorActivityType,
      title: `Moved to ${VISITOR_PIPELINE_LABELS[input.toStatus]}`,
      description: input.note ?? null,
      actorUserId: input.actorUserId,
      metadata: { fromStatus: input.fromStatus, toStatus: input.toStatus },
    },
  });

  await createAutoTasksForStage({
    organizationId: input.organizationId,
    visitorId: input.visitorId,
    stage: input.toStatus,
    actorUserId: input.actorUserId,
  });
}

function buildListItem(
  row: {
    id: string;
    organizationId: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    email: string | null;
    invitedByMemberId: string | null;
    householdId: string | null;
    familyName: string | null;
    childrenCount: number;
    prayerRequest: string | null;
    notes: string | null;
    convertedMemberId: string | null;
    status: PrismaVisitorPipelineStage;
    assignedLeaderId: string | null;
    assignedUserId: string | null;
    stageEnteredAt: Date;
    source: string | null;
    preferredChannel: PrismaCommunicationChannel | null;
    createdAt: Date;
    updatedAt: Date;
    _count?: { attendances: number; tasks?: number };
    tasks?: Array<{ dueAt: Date | null; status: PrismaFollowUpTaskStatus }>;
    communications?: Array<{ occurredAt: Date }>;
  },
  leaderNameMap: Map<string, string>
): VisitorListItem {
  const now = new Date();
  const openTasks =
    row.tasks?.filter(
      (t) =>
        t.status === "OPEN" ||
        t.status === "IN_PROGRESS" ||
        t.status === "SNOOZED"
    ) ?? [];
  const overdueTaskCount = openTasks.filter(
    (t) => t.dueAt !== null && t.dueAt < now
  ).length;

  const lastCommunicationAt =
    row.communications?.[0]?.occurredAt ?? null;

  return {
    ...mapVisitor(row),
    displayName: visitorDisplayName(row.firstName, row.lastName),
    visitCount: row._count?.attendances ?? 0,
    openTaskCount: openTasks.length,
    overdueTaskCount,
    lastCommunicationAt,
    assignedLeaderName: row.assignedLeaderId
      ? leaderNameMap.get(row.assignedLeaderId) ?? null
      : null,
  };
}

async function loadProfile(
  organizationId: string,
  visitorId: string
): Promise<VisitorProfile | null> {
  const row = await prisma.visitor.findFirst({
    where: { id: visitorId, organizationId },
    include: {
      journey: true,
      attendances: {
        orderBy: { checkedInAt: "desc" },
        include: {
          visitor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
              email: true,
            },
          },
        },
      },
      tasks: { orderBy: [{ status: "asc" }, { dueAt: "asc" }] },
      communications: { orderBy: { occurredAt: "desc" }, take: 50 },
      statusHistory: { orderBy: { occurredAt: "desc" } },
      activities: { orderBy: { occurredAt: "desc" }, take: 100 },
      _count: { select: { attendances: true } },
    },
  });

  if (!row) return null;

  let household: VisitorProfile["household"] = null;
  if (row.householdId) {
    const h = await prisma.household.findFirst({
      where: { id: row.householdId, organizationId, deletedAt: null },
      include: { _count: { select: { memberships: true } } },
    });
    if (h) {
      household = {
        id: h.id,
        familyName: h.familyName,
        householdCode: h.householdCode,
        memberCount: h._count.memberships,
      };
    }
  }

  const leaderNameMap = await getLeaderNameMap(organizationId, [
    row.assignedLeaderId ?? "",
  ]);

  return {
    ...mapVisitor(row),
    displayName: visitorDisplayName(row.firstName, row.lastName),
    visitCount: row._count.attendances,
    assignedLeaderName: row.assignedLeaderId
      ? leaderNameMap.get(row.assignedLeaderId) ?? null
      : null,
    journey: row.journey ? mapJourney(row.journey) : null,
    attendances: row.attendances.map((a) => ({
      id: a.id,
      organizationId: a.organizationId,
      visitorId: a.visitorId,
      sessionId: a.sessionId,
      invitedByMemberId: a.invitedByMemberId,
      isFirstVisit: a.isFirstVisit,
      isSecondVisit: a.isSecondVisit,
      convertedToMember: a.convertedToMember,
      checkedInAt: a.checkedInAt,
      notes: a.notes,
      createdAt: a.createdAt,
      visitor: a.visitor,
    })),
    tasks: row.tasks.map(mapTask),
    communications: row.communications.map(mapCommunication),
    statusHistory: row.statusHistory.map(mapStatusHistory),
    activities: row.activities.map(mapActivity),
    household,
  };
}

export const visitorJourneyRepository: VisitorJourneyRepository = {
  async ensureStageConfigs(organizationId) {
    const results: VisitorStageConfigEntity[] = [];

    for (const config of DEFAULT_VISITOR_STAGE_CONFIGS) {
      const row = await prisma.visitorStageConfig.upsert({
        where: {
          organizationId_stageKey: {
            organizationId,
            stageKey: config.stageKey as PrismaVisitorPipelineStage,
          },
        },
        create: {
          organizationId,
          stageKey: config.stageKey as PrismaVisitorPipelineStage,
          label: config.label,
          sortOrder: config.sortOrder,
          autoTaskTypes: config.autoTaskTypes,
          slaHours: config.slaHours,
        },
        update: {},
      });
      results.push(mapStageConfig(row));
    }

    return results;
  },

  async bootstrapVisitorJourney(input) {
    const visitor = await requireVisitor(input.organizationId, input.visitorId);

    const existing = await prisma.visitorJourney.findUnique({
      where: { visitorId: input.visitorId },
    });
    if (existing) return;

    const stage = VisitorPipelineStage.FIRST_VISIT;

    await prisma.visitorJourney.create({
      data: {
        organizationId: input.organizationId,
        visitorId: input.visitorId,
        currentStage: stage as PrismaVisitorPipelineStage,
      },
    });

    await prisma.visitorStatusHistory.create({
      data: {
        organizationId: input.organizationId,
        visitorId: input.visitorId,
        fromStatus: null,
        toStatus: stage as PrismaVisitorPipelineStage,
        changedByUserId: input.actorUserId ?? null,
        note: "Journey started",
      },
    });

    await prisma.visitorActivity.create({
      data: {
        organizationId: input.organizationId,
        visitorId: input.visitorId,
        type: "CREATED" as PrismaVisitorActivityType,
        title: "Visitor registered",
        actorUserId: input.actorUserId ?? null,
      },
    });

    await createAutoTasksForStage({
      organizationId: input.organizationId,
      visitorId: input.visitorId,
      stage,
      actorUserId: input.actorUserId,
    });

    if (visitor.status !== stage) {
      await prisma.visitor.update({
        where: { id: input.visitorId },
        data: {
          status: stage as PrismaVisitorPipelineStage,
          stageEnteredAt: new Date(),
        },
      });
    }
  },

  async listVisitors(query) {
    const where: Prisma.VisitorWhereInput = {
      organizationId: query.organizationId,
    };

    if (query.status?.length) {
      where.status = { in: query.status as PrismaVisitorPipelineStage[] };
    }

    if (query.assignedLeaderId !== undefined) {
      where.assignedLeaderId = query.assignedLeaderId;
    }

    if (query.query?.trim()) {
      const q = query.query.trim();
      where.OR = [
        { firstName: { contains: q, mode: "insensitive" } },
        { lastName: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { phone: { contains: q, mode: "insensitive" } },
        { familyName: { contains: q, mode: "insensitive" } },
      ];
    }

    if (query.needsFollowUp) {
      where.tasks = {
        some: {
          status: { in: ["OPEN", "IN_PROGRESS", "SNOOZED"] },
          dueAt: { lt: new Date() },
        },
      };
    }

    const rows = await prisma.visitor.findMany({
      where,
      orderBy: [{ stageEnteredAt: "desc" }, { createdAt: "desc" }],
      take: query.limit ?? 100,
      include: {
        _count: { select: { attendances: true } },
        tasks: {
          where: {
            status: { in: ["OPEN", "IN_PROGRESS", "SNOOZED"] },
          },
          select: { dueAt: true, status: true },
        },
        communications: {
          orderBy: { occurredAt: "desc" },
          take: 1,
          select: { occurredAt: true },
        },
      },
    });

    const leaderIds = rows.map((r) => r.assignedLeaderId ?? "");
    const leaderNameMap = await getLeaderNameMap(query.organizationId, leaderIds);

    return rows.map((row) => buildListItem(row, leaderNameMap));
  },

  async getPipelineBoard(organizationId) {
    await this.ensureStageConfigs(organizationId);

    const configs = await prisma.visitorStageConfig.findMany({
      where: { organizationId, isActive: true },
      orderBy: { sortOrder: "asc" },
    });

    const stageOrder =
      configs.length > 0
        ? configs.map((c) => c.stageKey as VisitorPipelineStage)
        : VISITOR_PIPELINE_ORDER;

    const visitors = await this.listVisitors({ organizationId, limit: 500 });
    const byStage = new Map<VisitorPipelineStage, VisitorListItem[]>();

    for (const stage of stageOrder) {
      byStage.set(stage, []);
    }

    for (const visitor of visitors) {
      const list = byStage.get(visitor.status) ?? [];
      list.push(visitor);
      byStage.set(visitor.status, list);
    }

    const columns: PipelineBoardColumn[] = stageOrder.map((stage) => {
      const config = configs.find((c) => c.stageKey === stage);
      return {
        stage,
        label: config?.label ?? VISITOR_PIPELINE_LABELS[stage],
        sortOrder: config?.sortOrder ?? 0,
        visitors: byStage.get(stage) ?? [],
      };
    });

    return columns;
  },

  async getVisitorProfile(organizationId, visitorId) {
    return loadProfile(organizationId, visitorId);
  },

  async advanceStage(input) {
    const visitor = await requireVisitor(input.organizationId, input.visitorId);
    const currentIndex = VISITOR_PIPELINE_ORDER.indexOf(
      visitor.status as VisitorPipelineStage
    );
    if (currentIndex < 0 || currentIndex >= VISITOR_PIPELINE_ORDER.length - 1) {
      throw notFound("Cannot advance from current stage");
    }

    const nextStage = VISITOR_PIPELINE_ORDER[currentIndex + 1]!;

    await transitionStage({
      organizationId: input.organizationId,
      visitorId: input.visitorId,
      fromStatus: visitor.status as VisitorPipelineStage,
      toStatus: nextStage,
      actorUserId: input.actorUserId,
      note: input.note,
    });

    return (await loadProfile(input.organizationId, input.visitorId))!;
  },

  async setStage(input) {
    const visitor = await requireVisitor(input.organizationId, input.visitorId);

    await transitionStage({
      organizationId: input.organizationId,
      visitorId: input.visitorId,
      fromStatus: visitor.status as VisitorPipelineStage,
      toStatus: input.stage,
      actorUserId: input.actorUserId,
      note: input.note,
    });

    return (await loadProfile(input.organizationId, input.visitorId))!;
  },

  async assignLeader(input) {
    const visitor = await requireVisitor(input.organizationId, input.visitorId);

    await prisma.visitor.update({
      where: { id: input.visitorId },
      data: {
        assignedLeaderId: input.leaderId,
        assignedUserId: input.assignedUserId ?? null,
      },
    });

    if (
      input.leaderId &&
      visitor.status !== (VisitorPipelineStage.ASSIGNED_LEADER as PrismaVisitorPipelineStage)
    ) {
      await transitionStage({
        organizationId: input.organizationId,
        visitorId: input.visitorId,
        fromStatus: visitor.status as VisitorPipelineStage,
        toStatus: VisitorPipelineStage.ASSIGNED_LEADER,
        actorUserId: input.actorUserId,
        note: "Leader assigned",
      });
    }

    await prisma.visitorActivity.create({
      data: {
        organizationId: input.organizationId,
        visitorId: input.visitorId,
        type: "LEADER_ASSIGNED" as PrismaVisitorActivityType,
        title: input.leaderId ? "Leader assigned" : "Leader unassigned",
        actorUserId: input.actorUserId,
        metadata: { leaderId: input.leaderId },
      },
    });

    return (await loadProfile(input.organizationId, input.visitorId))!;
  },

  async createTask(input) {
    await requireVisitor(input.organizationId, input.visitorId);

    const title =
      input.title ??
      FOLLOW_UP_TASK_TYPE_LABELS[input.type] ??
      "Follow-up task";

    const row = await prisma.followUpTask.create({
      data: {
        organizationId: input.organizationId,
        visitorId: input.visitorId,
        type: input.type as PrismaFollowUpTaskType,
        title,
        description: input.description ?? null,
        ownerUserId: input.ownerUserId ?? null,
        dueAt: input.dueAt ?? null,
        priority: (input.priority ?? FollowUpPriority.MEDIUM) as PrismaFollowUpPriority,
        status: "OPEN" as PrismaFollowUpTaskStatus,
        automationKey: input.automationKey ?? null,
      },
    });

    await prisma.visitorActivity.create({
      data: {
        organizationId: input.organizationId,
        visitorId: input.visitorId,
        type: "TASK_CREATED" as PrismaVisitorActivityType,
        title: `Task created: ${title}`,
        actorUserId: input.actorUserId,
        metadata: { taskId: row.id, taskType: input.type },
      },
    });

    return mapTask(row);
  },

  async completeTask(input) {
    const task = await prisma.followUpTask.findFirst({
      where: { id: input.taskId, organizationId: input.organizationId },
    });
    if (!task) throw notFound("Task not found");

    const row = await prisma.followUpTask.update({
      where: { id: task.id },
      data: {
        status: "DONE" as PrismaFollowUpTaskStatus,
        completedAt: new Date(),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
      },
    });

    await prisma.visitorActivity.create({
      data: {
        organizationId: input.organizationId,
        visitorId: task.visitorId,
        type: "TASK_COMPLETED" as PrismaVisitorActivityType,
        title: `Task completed: ${row.title}`,
        actorUserId: input.actorUserId,
        metadata: { taskId: row.id },
      },
    });

    return mapTask(row);
  },

  async updateTask(input) {
    const task = await prisma.followUpTask.findFirst({
      where: { id: input.taskId, organizationId: input.organizationId },
    });
    if (!task) throw notFound("Task not found");

    const row = await prisma.followUpTask.update({
      where: { id: task.id },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.description !== undefined
          ? { description: input.description }
          : {}),
        ...(input.ownerUserId !== undefined
          ? { ownerUserId: input.ownerUserId }
          : {}),
        ...(input.dueAt !== undefined ? { dueAt: input.dueAt } : {}),
        ...(input.priority !== undefined
          ? { priority: input.priority as PrismaFollowUpPriority }
          : {}),
        ...(input.status !== undefined
          ? {
              status: input.status as PrismaFollowUpTaskStatus,
              ...(input.status === FollowUpTaskStatus.DONE
                ? { completedAt: new Date() }
                : {}),
            }
          : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
      },
    });

    return mapTask(row);
  },

  async logCommunication(input) {
    await requireVisitor(input.organizationId, input.visitorId);

    const row = await prisma.communicationLog.create({
      data: {
        organizationId: input.organizationId,
        visitorId: input.visitorId,
        channel: input.channel as PrismaCommunicationChannel,
        direction: (input.direction ??
          CommunicationDirection.OUTBOUND) as PrismaCommunicationDirection,
        subject: input.subject ?? null,
        body: input.body,
        actorUserId: input.actorUserId,
        metadata: (input.metadata ?? DEFAULT_COMM_METADATA) as Prisma.InputJsonValue,
      },
    });

    await prisma.visitorActivity.create({
      data: {
        organizationId: input.organizationId,
        visitorId: input.visitorId,
        type: "COMMUNICATION" as PrismaVisitorActivityType,
        title: `Communication via ${input.channel}`,
        description: input.body.slice(0, 200),
        actorUserId: input.actorUserId,
        metadata: { channel: input.channel, communicationId: row.id },
      },
    });

    return mapCommunication(row);
  },

  async convertToMember(input) {
    const visitor = await requireVisitor(input.organizationId, input.visitorId);
    if (visitor.convertedMemberId) {
      throw notFound("Visitor already converted");
    }

    const member = await memberRepository.create({
      organizationId: input.organizationId,
      firstName: visitor.firstName,
      lastName: visitor.lastName,
      email: visitor.email,
      phone: visitor.phone,
      tagIds: input.tagIds,
    });

    const now = new Date();
    const memberStage = VisitorPipelineStage.MEMBER;

    await prisma.visitor.update({
      where: { id: visitor.id },
      data: {
        convertedMemberId: member.id,
        status: memberStage as PrismaVisitorPipelineStage,
        stageEnteredAt: now,
      },
    });

    await prisma.visitorJourney.updateMany({
      where: { visitorId: visitor.id, organizationId: input.organizationId },
      data: {
        currentStage: memberStage as PrismaVisitorPipelineStage,
        completedAt: now,
        convertedAt: now,
        conversionMemberId: member.id,
      },
    });

    await prisma.visitorStatusHistory.create({
      data: {
        organizationId: input.organizationId,
        visitorId: visitor.id,
        fromStatus: visitor.status as PrismaVisitorPipelineStage,
        toStatus: memberStage as PrismaVisitorPipelineStage,
        changedByUserId: input.actorUserId,
        note: "Converted to member",
      },
    });

    await prisma.visitorAttendance.updateMany({
      where: { visitorId: visitor.id, organizationId: input.organizationId },
      data: { convertedToMember: true },
    });

    await prisma.visitorActivity.create({
      data: {
        organizationId: input.organizationId,
        visitorId: visitor.id,
        type: "CONVERTED" as PrismaVisitorActivityType,
        title: "Converted to member",
        actorUserId: input.actorUserId,
        metadata: { memberId: member.id },
      },
    });

    const profile = (await loadProfile(input.organizationId, visitor.id))!;
    return { memberId: member.id, profile };
  },

  async getDashboard(organizationId) {
    const thirtyDaysAgo = subDays(new Date(), 30);
    const now = new Date();

    const [
      newVisitorsCount,
      needingFollowUpCount,
      totalVisitors,
      convertedCount,
      openTasksCount,
      funnelGroups,
      recentComms,
      responsePairs,
    ] = await Promise.all([
      prisma.visitor.count({
        where: {
          organizationId,
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
      prisma.visitor.count({
        where: {
          organizationId,
          tasks: {
            some: {
              status: { in: ["OPEN", "IN_PROGRESS", "SNOOZED"] },
              dueAt: { lt: now },
            },
          },
        },
      }),
      prisma.visitor.count({ where: { organizationId } }),
      prisma.visitor.count({
        where: { organizationId, convertedMemberId: { not: null } },
      }),
      prisma.followUpTask.count({
        where: {
          organizationId,
          status: { in: ["OPEN", "IN_PROGRESS", "SNOOZED"] },
        },
      }),
      prisma.visitor.groupBy({
        by: ["status"],
        where: { organizationId },
        _count: { _all: true },
      }),
      prisma.communicationLog.findMany({
        where: { organizationId },
        orderBy: { occurredAt: "desc" },
        take: 10,
      }),
      prisma.visitor.findMany({
        where: {
          organizationId,
          communications: { some: {} },
        },
        select: {
          createdAt: true,
          communications: {
            orderBy: { occurredAt: "asc" },
            take: 1,
            select: { occurredAt: true },
          },
        },
      }),
    ]);

    const conversionRate =
      totalVisitors > 0 ? Math.round((convertedCount / totalVisitors) * 100) : 0;

    let avgResponseTimeHours: number | null = null;
    const responseHours = responsePairs
      .map((v) => {
        const first = v.communications[0];
        if (!first) return null;
        const diffMs = first.occurredAt.getTime() - v.createdAt.getTime();
        return diffMs / (1000 * 60 * 60);
      })
      .filter((h): h is number => h !== null);

    if (responseHours.length > 0) {
      avgResponseTimeHours =
        Math.round(
          (responseHours.reduce((a, b) => a + b, 0) / responseHours.length) * 10
        ) / 10;
    }

    const configs = await prisma.visitorStageConfig.findMany({
      where: { organizationId },
      orderBy: { sortOrder: "asc" },
    });

    const funnelMap = new Map(
      funnelGroups.map((g) => [g.status, g._count._all])
    );

    const funnel = VISITOR_PIPELINE_ORDER.map((stage) => {
      const config = configs.find((c) => c.stageKey === stage);
      return {
        stage,
        label: config?.label ?? VISITOR_PIPELINE_LABELS[stage],
        sortOrder: config?.sortOrder ?? 0,
        count: funnelMap.get(stage as PrismaVisitorPipelineStage) ?? 0,
      };
    });

    return {
      newVisitorsCount,
      needingFollowUpCount,
      conversionRate,
      avgResponseTimeHours,
      openTasksCount,
      funnel,
      recentCommunications: recentComms.map(mapCommunication),
    } satisfies VisitorDashboard;
  },

  async listOpenTasks(query) {
    const where: Prisma.FollowUpTaskWhereInput = {
      organizationId: query.organizationId,
      status: { in: ["OPEN", "IN_PROGRESS", "SNOOZED"] },
    };

    if (query.ownerUserId !== undefined) {
      where.ownerUserId = query.ownerUserId;
    }
    if (query.visitorId) {
      where.visitorId = query.visitorId;
    }
    if (query.overdueOnly) {
      where.dueAt = { lt: new Date() };
    }

    const rows = await prisma.followUpTask.findMany({
      where,
      orderBy: [{ dueAt: "asc" }, { createdAt: "asc" }],
      take: query.limit ?? 50,
    });

    return rows.map(mapTask);
  },
};
