import type { CommunicationRepository } from "@/application/ports/communication-repositories";
import type {
  AudienceFilter,
  CommunicationActivityEntity,
  CommunicationAnalytics,
  CommunicationAutomationEntity,
  CommunicationCampaignEntity,
  CommunicationDeliveryEntity,
  CommunicationMessageEntity,
  CommunicationTemplateEntity,
  CreateAutomationInput,
  CreateCampaignInput,
  CreateMessageInput,
  CreateTemplateInput,
  MessageCenterQuery,
  TemplateRenderContext,
} from "@/domain/entities/communication";
import {
  HubActivityType,
  HubAudienceType,
  HubChannel,
  HubDeliveryStatus,
  HubMessageDirection,
  HubMessageStatus,
  HubProviderKind,
} from "@/domain/enums/communication";
import { providerForChannel } from "@/infrastructure/communications/providers";
import { prisma } from "@/infrastructure/db/prisma";
import { conflict, notFound } from "@/server/errors";
import type {
  HubActivityType as PrismaHubActivityType,
  HubAudienceType as PrismaHubAudienceType,
  HubAutomationTrigger as PrismaHubAutomationTrigger,
  HubChannel as PrismaHubChannel,
  HubDeliveryStatus as PrismaHubDeliveryStatus,
  HubMessageDirection as PrismaHubMessageDirection,
  HubMessageStatus as PrismaHubMessageStatus,
  HubProviderKind as PrismaHubProviderKind,
} from "@prisma/client";
import { Prisma } from "@prisma/client";

function asJsonRecord(value: unknown): Record<string, unknown> | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function asAudienceFilter(value: unknown): AudienceFilter | null {
  const record = asJsonRecord(value);
  return record as AudienceFilter | null;
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function renderTemplate(body: string, context: TemplateRenderContext) {
  return body.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    return context[key] ?? `{{${key}}}`;
  });
}

function mapTemplate(row: {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  channel: PrismaHubChannel;
  subject: string | null;
  body: string;
  variables: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}): CommunicationTemplateEntity {
  return {
    id: row.id,
    organizationId: row.organizationId,
    name: row.name,
    slug: row.slug,
    channel: row.channel as HubChannel,
    subject: row.subject,
    body: row.body,
    variables: row.variables,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapCampaign(
  row: {
    id: string;
    organizationId: string;
    name: string;
    description: string | null;
    channel: PrismaHubChannel;
    audienceType: PrismaHubAudienceType;
    audienceFilter: unknown;
    templateId: string | null;
    subject: string | null;
    body: string;
    status: PrismaHubMessageStatus;
    scheduledFor: Date | null;
    sentAt: Date | null;
    createdByUserId: string | null;
    createdAt: Date;
    updatedAt: Date;
    _count?: { deliveries: number };
  },
  rates?: { openRate: number; clickRate: number; failureCount: number }
): CommunicationCampaignEntity {
  return {
    id: row.id,
    organizationId: row.organizationId,
    name: row.name,
    description: row.description,
    channel: row.channel as HubChannel,
    audienceType: row.audienceType as HubAudienceType,
    audienceFilter: asAudienceFilter(row.audienceFilter),
    templateId: row.templateId,
    subject: row.subject,
    body: row.body,
    status: row.status as HubMessageStatus,
    scheduledFor: row.scheduledFor,
    sentAt: row.sentAt,
    createdByUserId: row.createdByUserId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deliveryCount: row._count?.deliveries,
    openRate: rates?.openRate,
    clickRate: rates?.clickRate,
    failureCount: rates?.failureCount,
  };
}

function mapMessage(row: {
  id: string;
  organizationId: string;
  campaignId: string | null;
  templateId: string | null;
  channel: PrismaHubChannel;
  direction: PrismaHubMessageDirection;
  status: PrismaHubMessageStatus;
  subject: string | null;
  body: string;
  audienceType: PrismaHubAudienceType | null;
  audienceFilter: unknown;
  metadata: unknown;
  scheduledFor: Date | null;
  sentAt: Date | null;
  failedAt: Date | null;
  failureReason: string | null;
  createdByUserId: string | null;
  memberId: string | null;
  visitorId: string | null;
  householdId: string | null;
  createdAt: Date;
  updatedAt: Date;
  campaign?: { name: string } | null;
}): CommunicationMessageEntity {
  return {
    id: row.id,
    organizationId: row.organizationId,
    campaignId: row.campaignId,
    templateId: row.templateId,
    channel: row.channel as HubChannel,
    direction: row.direction as HubMessageDirection,
    status: row.status as HubMessageStatus,
    subject: row.subject,
    body: row.body,
    audienceType: row.audienceType as HubAudienceType | null,
    audienceFilter: asAudienceFilter(row.audienceFilter),
    metadata: asJsonRecord(row.metadata),
    scheduledFor: row.scheduledFor,
    sentAt: row.sentAt,
    failedAt: row.failedAt,
    failureReason: row.failureReason,
    createdByUserId: row.createdByUserId,
    memberId: row.memberId,
    visitorId: row.visitorId,
    householdId: row.householdId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    campaignName: row.campaign?.name ?? null,
  };
}

function mapDelivery(row: {
  id: string;
  organizationId: string;
  messageId: string;
  campaignId: string | null;
  channel: PrismaHubChannel;
  status: PrismaHubDeliveryStatus;
  recipientName: string | null;
  recipientEmail: string | null;
  recipientPhone: string | null;
  memberId: string | null;
  visitorId: string | null;
  householdId: string | null;
  provider: PrismaHubProviderKind;
  externalId: string | null;
  metadata: unknown;
  errorMessage: string | null;
  sentAt: Date | null;
  deliveredAt: Date | null;
  openedAt: Date | null;
  clickedAt: Date | null;
  failedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): CommunicationDeliveryEntity {
  return {
    id: row.id,
    organizationId: row.organizationId,
    messageId: row.messageId,
    campaignId: row.campaignId,
    channel: row.channel as HubChannel,
    status: row.status as HubDeliveryStatus,
    recipientName: row.recipientName,
    recipientEmail: row.recipientEmail,
    recipientPhone: row.recipientPhone,
    memberId: row.memberId,
    visitorId: row.visitorId,
    householdId: row.householdId,
    provider: row.provider as HubProviderKind,
    externalId: row.externalId,
    metadata: asJsonRecord(row.metadata),
    errorMessage: row.errorMessage,
    sentAt: row.sentAt,
    deliveredAt: row.deliveredAt,
    openedAt: row.openedAt,
    clickedAt: row.clickedAt,
    failedAt: row.failedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapActivity(row: {
  id: string;
  organizationId: string;
  type: PrismaHubActivityType;
  title: string;
  description: string | null;
  actorUserId: string | null;
  campaignId: string | null;
  messageId: string | null;
  metadata: unknown;
  occurredAt: Date;
  createdAt: Date;
}): CommunicationActivityEntity {
  return {
    id: row.id,
    organizationId: row.organizationId,
    type: row.type as HubActivityType,
    title: row.title,
    description: row.description,
    actorUserId: row.actorUserId,
    campaignId: row.campaignId,
    messageId: row.messageId,
    metadata: asJsonRecord(row.metadata),
    occurredAt: row.occurredAt,
    createdAt: row.createdAt,
  };
}

async function logActivity(input: {
  organizationId: string;
  type: HubActivityType;
  title: string;
  description?: string | null;
  actorUserId?: string | null;
  campaignId?: string | null;
  messageId?: string | null;
  metadata?: Record<string, unknown> | null;
}) {
  await prisma.communicationActivity.create({
    data: {
      organizationId: input.organizationId,
      type: input.type as PrismaHubActivityType,
      title: input.title,
      description: input.description ?? null,
      actorUserId: input.actorUserId ?? null,
      campaignId: input.campaignId ?? null,
      messageId: input.messageId ?? null,
      metadata: (input.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
    },
  });
}

type Recipient = {
  name: string;
  email: string | null;
  phone: string | null;
  memberId: string | null;
  visitorId: string | null;
  householdId: string | null;
  context: TemplateRenderContext;
};

async function resolveAudience(
  organizationId: string,
  audienceType: HubAudienceType,
  filter: AudienceFilter | null
): Promise<Recipient[]> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { name: true },
  });
  const churchName = org?.name ?? "Church";

  if (audienceType === HubAudienceType.VISITORS) {
    const visitors = await prisma.visitor.findMany({
      where: {
        organizationId,
        ...(filter?.visitorIds?.length
          ? { id: { in: filter.visitorIds } }
          : {}),
      },
      take: 500,
    });
    return visitors.map((v) => ({
      name: `${v.firstName} ${v.lastName}`.trim(),
      email: v.email,
      phone: v.phone,
      memberId: null,
      visitorId: v.id,
      householdId: v.householdId,
      context: {
        FirstName: v.firstName,
        LastName: v.lastName,
        FamilyName: v.familyName ?? undefined,
        ChurchName: churchName,
      },
    }));
  }

  if (audienceType === HubAudienceType.HOUSEHOLDS) {
    const households = await prisma.household.findMany({
      where: {
        organizationId,
        deletedAt: null,
        ...(filter?.householdIds?.length
          ? { id: { in: filter.householdIds } }
          : {}),
      },
      include: {
        memberships: {
          include: { member: true },
          take: 1,
          orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
        },
      },
      take: 300,
    });
    return households.map((h) => {
      const head = h.memberships[0]?.member;
      return {
        name: h.familyName,
        email: head?.email ?? null,
        phone: head?.phone ?? h.emergencyPhone ?? null,
        memberId: head?.id ?? null,
        visitorId: null,
        householdId: h.id,
        context: {
          FirstName: head?.firstName ?? h.familyName,
          LastName: head?.lastName ?? "",
          FamilyName: h.familyName,
          ChurchName: churchName,
          Campus: head?.campus ?? undefined,
        },
      };
    });
  }

  if (audienceType === HubAudienceType.VOLUNTEERS) {
    const volunteers = await prisma.volunteerProfile.findMany({
      where: { organizationId, isActive: true },
      include: { member: true },
      take: 500,
    });
    return volunteers.map((v) => ({
      name: `${v.member.firstName} ${v.member.lastName}`.trim(),
      email: v.member.email,
      phone: v.member.phone,
      memberId: v.memberId,
      visitorId: null,
      householdId: null,
      context: {
        FirstName: v.member.firstName,
        LastName: v.member.lastName,
        ChurchName: churchName,
        Campus: v.member.campus ?? undefined,
      },
    }));
  }

  if (audienceType === HubAudienceType.MINISTRY && filter?.ministryId) {
    const prefs = await prisma.volunteerMinistryPreference.findMany({
      where: { organizationId, ministryId: filter.ministryId },
      include: {
        volunteer: { include: { member: true } },
        ministry: true,
      },
      take: 500,
    });
    return prefs.map((p) => ({
      name: `${p.volunteer.member.firstName} ${p.volunteer.member.lastName}`.trim(),
      email: p.volunteer.member.email,
      phone: p.volunteer.member.phone,
      memberId: p.volunteer.memberId,
      visitorId: null,
      householdId: null,
      context: {
        FirstName: p.volunteer.member.firstName,
        LastName: p.volunteer.member.lastName,
        ChurchName: churchName,
        MinistryName: p.ministry.name,
      },
    }));
  }

  if (audienceType === HubAudienceType.EVENT_REGISTRANTS && filter?.eventId) {
    const regs = await prisma.eventRegistration.findMany({
      where: {
        organizationId,
        eventId: filter.eventId,
        status: { in: ["REGISTERED", "CHECKED_IN", "WAITLISTED"] },
      },
      take: 500,
    });
    const event = await prisma.churchEvent.findFirst({
      where: { id: filter.eventId, organizationId },
    });
    const memberIds = regs.map((r) => r.memberId).filter(Boolean) as string[];
    const members =
      memberIds.length > 0
        ? await prisma.member.findMany({
            where: { id: { in: memberIds }, organizationId },
          })
        : [];
    const memberMap = Object.fromEntries(members.map((m) => [m.id, m]));
    return regs.map((r) => {
      const member = r.memberId ? memberMap[r.memberId] : null;
      return {
        name:
          member
            ? `${member.firstName} ${member.lastName}`.trim()
            : (r.guestName ?? "Guest"),
        email: member?.email ?? r.guestEmail,
        phone: member?.phone ?? r.guestPhone,
        memberId: r.memberId,
        visitorId: r.visitorId,
        householdId: r.householdId,
        context: {
          FirstName: member?.firstName ?? r.guestName?.split(" ")[0] ?? "Friend",
          LastName: member?.lastName ?? "",
          EventName: event?.title,
          ServiceTime: event?.startsAt?.toISOString(),
          ChurchName: churchName,
        },
      };
    });
  }

  // ALL_MEMBERS | CELL_GROUPS | CUSTOM
  const where: Prisma.MemberWhereInput = {
    organizationId,
    deletedAt: null,
  };
  if (audienceType === HubAudienceType.CELL_GROUPS && filter?.cellGroup) {
    where.householdLinks = {
      some: { household: { cellGroup: filter.cellGroup } },
    };
  }
  if (filter?.memberIds?.length) {
    where.id = { in: filter.memberIds };
  }
  if (filter?.search) {
    where.OR = [
      { firstName: { contains: filter.search, mode: "insensitive" } },
      { lastName: { contains: filter.search, mode: "insensitive" } },
      { email: { contains: filter.search, mode: "insensitive" } },
    ];
  }
  if (filter?.tagSlugs?.length) {
    where.tags = { some: { tag: { slug: { in: filter.tagSlugs } } } };
  }

  const members = await prisma.member.findMany({
    where,
    take: 500,
    orderBy: { lastName: "asc" },
  });

  return members.map((m) => ({
    name: `${m.firstName} ${m.lastName}`.trim(),
    email: m.email,
    phone: m.phone,
    memberId: m.id,
    visitorId: null,
    householdId: null,
    context: {
      FirstName: m.firstName,
      LastName: m.lastName,
      ChurchName: churchName,
      Campus: m.campus ?? undefined,
    },
  }));
}

async function writeTimelineEntries(input: {
  organizationId: string;
  channel: HubChannel;
  subject: string | null;
  body: string;
  actorUserId?: string | null;
  recipients: Recipient[];
  messageId: string;
}) {
  const titlePrefix =
    input.channel === HubChannel.EMAIL
      ? "Email"
      : input.channel === HubChannel.WHATSAPP
        ? "WhatsApp"
        : input.channel === HubChannel.SMS
          ? "SMS"
          : input.channel === HubChannel.PUSH
            ? "Push"
            : "Message";

  for (const recipient of input.recipients.slice(0, 200)) {
    if (recipient.memberId) {
      const activityType =
        input.channel === HubChannel.WHATSAPP
          ? "WHATSAPP_SENT"
          : input.channel === HubChannel.EMAIL
            ? "EMAIL_SENT"
            : "EMAIL_SENT";
      await prisma.memberActivity.create({
        data: {
          organizationId: input.organizationId,
          memberId: recipient.memberId,
          type: activityType,
          title: `${titlePrefix} sent`,
          description: input.subject ?? input.body.slice(0, 120),
          actorUserId: input.actorUserId ?? null,
          metadata: {
            messageId: input.messageId,
            channel: input.channel,
            hub: true,
          },
        },
      });
    }
    if (recipient.householdId) {
      await prisma.householdActivity.create({
        data: {
          organizationId: input.organizationId,
          householdId: recipient.householdId,
          type:
            input.channel === HubChannel.WHATSAPP
              ? "WHATSAPP_SENT"
              : "EMAIL_SENT",
          title: `${titlePrefix} sent`,
          description: input.subject ?? input.body.slice(0, 120),
          actorUserId: input.actorUserId ?? null,
          metadata: {
            messageId: input.messageId,
            channel: input.channel,
            hub: true,
          },
        },
      });
    }
    if (recipient.visitorId) {
      await prisma.visitorActivity.create({
        data: {
          organizationId: input.organizationId,
          visitorId: recipient.visitorId,
          type: "COMMUNICATION",
          title: `${titlePrefix} sent`,
          description: input.subject ?? input.body.slice(0, 120),
          actorUserId: input.actorUserId ?? null,
          metadata: {
            messageId: input.messageId,
            channel: input.channel,
            hub: true,
          },
        },
      });
      await prisma.communicationLog.create({
        data: {
          organizationId: input.organizationId,
          visitorId: recipient.visitorId,
          channel:
            input.channel === HubChannel.EMAIL
              ? "EMAIL"
              : input.channel === HubChannel.WHATSAPP
                ? "WHATSAPP"
                : input.channel === HubChannel.SMS
                  ? "SMS"
                  : "NOTE",
          direction: "OUTBOUND",
          subject: input.subject,
          body: input.body,
          actorUserId: input.actorUserId ?? null,
          metadata: {
            messageId: input.messageId,
            provider: null,
            queued: false,
            hub: true,
          },
        },
      });
    }
  }
}

async function dispatchToRecipients(input: {
  organizationId: string;
  messageId: string;
  campaignId?: string | null;
  channel: HubChannel;
  subject: string | null;
  body: string;
  recipients: Recipient[];
  actorUserId?: string | null;
}) {
  const provider = providerForChannel(input.channel);
  let sent = 0;
  let failed = 0;
  let pending = 0;

  for (const recipient of input.recipients) {
    const personalizedBody = renderTemplate(input.body, recipient.context);
    const personalizedSubject = input.subject
      ? renderTemplate(input.subject, recipient.context)
      : null;

    const result = await provider.send({
      organizationId: input.organizationId,
      channel: input.channel,
      toEmail: recipient.email,
      toPhone: recipient.phone,
      subject: personalizedSubject,
      body: personalizedBody,
      recipientName: recipient.name,
    });

    // BUG-008: queued stub providers must not be recorded as SENT.
    const status: HubDeliveryStatus = result.queued
      ? HubDeliveryStatus.PENDING
      : result.ok
        ? HubDeliveryStatus.SENT
        : HubDeliveryStatus.FAILED;
    if (result.queued) pending += 1;
    else if (result.ok) sent += 1;
    else failed += 1;

    await prisma.communicationDelivery.create({
      data: {
        organizationId: input.organizationId,
        messageId: input.messageId,
        campaignId: input.campaignId ?? null,
        channel: input.channel as PrismaHubChannel,
        status: status as PrismaHubDeliveryStatus,
        recipientName: recipient.name,
        recipientEmail: recipient.email,
        recipientPhone: recipient.phone,
        memberId: recipient.memberId,
        visitorId: recipient.visitorId,
        householdId: recipient.householdId,
        provider: result.provider as PrismaHubProviderKind,
        externalId: result.externalId,
        metadata: result.metadata as Prisma.InputJsonValue,
        errorMessage: result.error ?? null,
        sentAt: result.ok && !result.queued ? new Date() : null,
        failedAt: !result.ok && !result.queued ? new Date() : null,
      },
    });
  }

  await writeTimelineEntries({
    organizationId: input.organizationId,
    channel: input.channel,
    subject: input.subject,
    body: input.body,
    actorUserId: input.actorUserId,
    recipients: input.recipients,
    messageId: input.messageId,
  });

  return { sent, failed, pending, provider: provider.kind };
}

/** BUG-008: map provider outcomes without claiming SENT when nothing delivered. */
function resolveDispatchMessageStatus(result: {
  sent: number;
  failed: number;
  pending: number;
}): HubMessageStatus {
  if (result.sent > 0) return HubMessageStatus.SENT;
  if (result.pending > 0) return HubMessageStatus.QUEUED;
  return HubMessageStatus.FAILED;
}

export const communicationRepository: CommunicationRepository = {
  renderTemplate,

  async listTemplates(organizationId) {
    const rows = await prisma.communicationTemplate.findMany({
      where: { organizationId },
      orderBy: { updatedAt: "desc" },
    });
    return rows.map(mapTemplate);
  },

  async createTemplate(input: CreateTemplateInput) {
    let slug = input.slug || slugify(input.name);
    let attempt = 0;
    while (
      await prisma.communicationTemplate.findFirst({
        where: { organizationId: input.organizationId, slug },
      })
    ) {
      attempt += 1;
      slug = `${slugify(input.name)}-${attempt}`;
    }

    const variables =
      input.variables ??
      Array.from(input.body.matchAll(/\{\{(\w+)\}\}/g)).map((m) => m[1]);

    const created = await prisma.communicationTemplate.create({
      data: {
        organizationId: input.organizationId,
        name: input.name,
        slug,
        channel: input.channel as PrismaHubChannel,
        subject: input.subject ?? null,
        body: input.body,
        variables,
      },
    });

    await logActivity({
      organizationId: input.organizationId,
      type: HubActivityType.CREATED,
      title: `Template created: ${created.name}`,
      actorUserId: input.actorUserId,
      metadata: { templateId: created.id },
    });

    return mapTemplate(created);
  },

  async updateTemplate(input) {
    const existing = await prisma.communicationTemplate.findFirst({
      where: { id: input.templateId, organizationId: input.organizationId },
    });
    if (!existing) throw notFound("Template not found");

    const updated = await prisma.communicationTemplate.update({
      where: { id: existing.id },
      data: {
        name: input.name,
        subject: input.subject,
        body: input.body,
        variables: input.variables,
        isActive: input.isActive,
      },
    });
    return mapTemplate(updated);
  },

  async listCampaigns(organizationId) {
    const rows = await prisma.communicationCampaign.findMany({
      where: { organizationId },
      orderBy: { updatedAt: "desc" },
      include: { _count: { select: { deliveries: true } } },
    });

    return Promise.all(
      rows.map(async (row) => {
        const deliveries = await prisma.communicationDelivery.groupBy({
          by: ["status"],
          where: { campaignId: row.id },
          _count: true,
        });
        const total = deliveries.reduce((s, d) => s + d._count, 0) || 1;
        const opened = deliveries
          .filter((d) => d.status === "OPENED" || d.status === "CLICKED")
          .reduce((s, d) => s + d._count, 0);
        const clicked = deliveries
          .filter((d) => d.status === "CLICKED")
          .reduce((s, d) => s + d._count, 0);
        const failed = deliveries
          .filter((d) => d.status === "FAILED" || d.status === "BOUNCED")
          .reduce((s, d) => s + d._count, 0);
        return mapCampaign(row, {
          openRate: Math.round((opened / total) * 100),
          clickRate: Math.round((clicked / total) * 100),
          failureCount: failed,
        });
      })
    );
  },

  async getCampaign(organizationId, campaignId) {
    const row = await prisma.communicationCampaign.findFirst({
      where: { id: campaignId, organizationId },
      include: { _count: { select: { deliveries: true } } },
    });
    if (!row) return null;
    return mapCampaign(row);
  },

  async createCampaign(input: CreateCampaignInput) {
    const status = input.scheduledFor
      ? HubMessageStatus.SCHEDULED
      : HubMessageStatus.DRAFT;

    const created = await prisma.communicationCampaign.create({
      data: {
        organizationId: input.organizationId,
        name: input.name,
        description: input.description ?? null,
        channel: input.channel as PrismaHubChannel,
        audienceType: input.audienceType as PrismaHubAudienceType,
        audienceFilter: (input.audienceFilter ??
          undefined) as Prisma.InputJsonValue | undefined,
        templateId: input.templateId ?? null,
        subject: input.subject ?? null,
        body: input.body,
        status: status as PrismaHubMessageStatus,
        scheduledFor: input.scheduledFor ?? null,
        createdByUserId: input.actorUserId ?? null,
      },
      include: { _count: { select: { deliveries: true } } },
    });

    await logActivity({
      organizationId: input.organizationId,
      type: input.scheduledFor
        ? HubActivityType.SCHEDULED
        : HubActivityType.CREATED,
      title: `Campaign ${input.scheduledFor ? "scheduled" : "created"}: ${created.name}`,
      campaignId: created.id,
      actorUserId: input.actorUserId,
    });

    return mapCampaign(created);
  },

  async updateCampaign(input) {
    const existing = await prisma.communicationCampaign.findFirst({
      where: { id: input.campaignId, organizationId: input.organizationId },
    });
    if (!existing) throw notFound("Campaign not found");
    if (existing.status === "SENT") {
      throw conflict("Sent campaigns cannot be edited");
    }

    const updated = await prisma.communicationCampaign.update({
      where: { id: existing.id },
      data: {
        name: input.name,
        description: input.description,
        channel: input.channel as PrismaHubChannel | undefined,
        audienceType: input.audienceType as PrismaHubAudienceType | undefined,
        audienceFilter:
          input.audienceFilter === undefined
            ? undefined
            : input.audienceFilter === null
              ? Prisma.JsonNull
              : (input.audienceFilter as Prisma.InputJsonValue),
        templateId: input.templateId,
        subject: input.subject,
        body: input.body,
        scheduledFor: input.scheduledFor,
        status: input.status as PrismaHubMessageStatus | undefined,
      },
      include: { _count: { select: { deliveries: true } } },
    });

    await logActivity({
      organizationId: input.organizationId,
      type: HubActivityType.UPDATED,
      title: `Campaign updated: ${updated.name}`,
      campaignId: updated.id,
      actorUserId: input.actorUserId,
    });

    return mapCampaign(updated);
  },

  async sendCampaign(input) {
    const campaign = await prisma.communicationCampaign.findFirst({
      where: { id: input.campaignId, organizationId: input.organizationId },
    });
    if (!campaign) throw notFound("Campaign not found");
    if (campaign.status === "SENT") throw conflict("Campaign already sent");
    if (campaign.status === "ARCHIVED") {
      throw conflict("Archived campaigns cannot be sent");
    }

    const recipients = await resolveAudience(
      input.organizationId,
      campaign.audienceType as HubAudienceType,
      asAudienceFilter(campaign.audienceFilter)
    );

    if (recipients.length === 0) {
      throw conflict("No recipients matched this audience");
    }

    const message = await prisma.communicationMessage.create({
      data: {
        organizationId: input.organizationId,
        campaignId: campaign.id,
        templateId: campaign.templateId,
        channel: campaign.channel,
        direction: "OUTBOUND",
        status: "SENDING",
        subject: campaign.subject,
        body: campaign.body,
        audienceType: campaign.audienceType,
        audienceFilter: campaign.audienceFilter as Prisma.InputJsonValue,
        createdByUserId: input.actorUserId ?? null,
        metadata: { provider: null, queued: false },
      },
    });

    const result = await dispatchToRecipients({
      organizationId: input.organizationId,
      messageId: message.id,
      campaignId: campaign.id,
      channel: campaign.channel as HubChannel,
      subject: campaign.subject,
      body: campaign.body,
      recipients,
      actorUserId: input.actorUserId,
    });

    const finalStatus = resolveDispatchMessageStatus(result);

    await prisma.communicationMessage.update({
      where: { id: message.id },
      data: {
        status: finalStatus as PrismaHubMessageStatus,
        sentAt: finalStatus === HubMessageStatus.SENT ? new Date() : null,
        failedAt: finalStatus === HubMessageStatus.FAILED ? new Date() : null,
        failureReason:
          finalStatus === HubMessageStatus.FAILED
            ? "All deliveries failed"
            : finalStatus === HubMessageStatus.QUEUED
              ? "Provider not configured — deliveries pending"
              : null,
        metadata: {
          provider: result.provider,
          queued: result.pending > 0,
          sent: result.sent,
          failed: result.failed,
          pending: result.pending,
        },
      },
    });

    const updated = await prisma.communicationCampaign.update({
      where: { id: campaign.id },
      data: {
        status: finalStatus as PrismaHubMessageStatus,
        sentAt: finalStatus === HubMessageStatus.SENT ? new Date() : null,
      },
      include: { _count: { select: { deliveries: true } } },
    });

    await logActivity({
      organizationId: input.organizationId,
      type:
        finalStatus === HubMessageStatus.FAILED
          ? HubActivityType.FAILED
          : finalStatus === HubMessageStatus.QUEUED
            ? HubActivityType.QUEUED
            : HubActivityType.SENT,
      title:
        finalStatus === HubMessageStatus.QUEUED
          ? `Campaign queued: ${campaign.name}`
          : finalStatus === HubMessageStatus.FAILED
            ? `Campaign failed: ${campaign.name}`
            : `Campaign sent: ${campaign.name}`,
      description: `${result.sent} sent · ${result.pending} pending · ${result.failed} failed`,
      campaignId: campaign.id,
      messageId: message.id,
      actorUserId: input.actorUserId,
      metadata: result,
    });

    return mapCampaign(updated);
  },

  async listMessages(query: MessageCenterQuery) {
    const where: Prisma.CommunicationMessageWhereInput = {
      organizationId: query.organizationId,
    };
    if (query.direction) where.direction = query.direction;
    if (query.status) where.status = query.status;
    if (query.channel) where.channel = query.channel;
    if (query.search?.trim()) {
      const q = query.search.trim();
      where.OR = [
        { subject: { contains: q, mode: "insensitive" } },
        { body: { contains: q, mode: "insensitive" } },
      ];
    }

    const rows = await prisma.communicationMessage.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: query.limit ?? 80,
      include: { campaign: { select: { name: true } } },
    });
    return rows.map(mapMessage);
  },

  async getMessage(organizationId, messageId) {
    const row = await prisma.communicationMessage.findFirst({
      where: { id: messageId, organizationId },
      include: { campaign: { select: { name: true } } },
    });
    return row ? mapMessage(row) : null;
  },

  async createMessage(input: CreateMessageInput) {
    const status = input.scheduledFor
      ? HubMessageStatus.SCHEDULED
      : HubMessageStatus.DRAFT;

    const created = await prisma.communicationMessage.create({
      data: {
        organizationId: input.organizationId,
        campaignId: input.campaignId ?? null,
        templateId: input.templateId ?? null,
        channel: input.channel as PrismaHubChannel,
        direction: (input.direction ??
          "OUTBOUND") as PrismaHubMessageDirection,
        status: status as PrismaHubMessageStatus,
        subject: input.subject ?? null,
        body: input.body,
        audienceType: (input.audienceType ??
          null) as PrismaHubAudienceType | null,
        audienceFilter: (input.audienceFilter ??
          undefined) as Prisma.InputJsonValue | undefined,
        scheduledFor: input.scheduledFor ?? null,
        createdByUserId: input.actorUserId ?? null,
        memberId: input.memberId ?? null,
        visitorId: input.visitorId ?? null,
        householdId: input.householdId ?? null,
        metadata: { provider: null, queued: false },
      },
      include: { campaign: { select: { name: true } } },
    });

    await logActivity({
      organizationId: input.organizationId,
      type: input.scheduledFor
        ? HubActivityType.SCHEDULED
        : HubActivityType.CREATED,
      title: input.scheduledFor ? "Message scheduled" : "Draft saved",
      messageId: created.id,
      actorUserId: input.actorUserId,
    });

    return mapMessage(created);
  },

  async updateMessageStatus(input) {
    const existing = await prisma.communicationMessage.findFirst({
      where: { id: input.messageId, organizationId: input.organizationId },
    });
    if (!existing) throw notFound("Message not found");

    const updated = await prisma.communicationMessage.update({
      where: { id: existing.id },
      data: { status: input.status as PrismaHubMessageStatus },
      include: { campaign: { select: { name: true } } },
    });

    await logActivity({
      organizationId: input.organizationId,
      type:
        input.status === HubMessageStatus.ARCHIVED
          ? HubActivityType.ARCHIVED
          : HubActivityType.UPDATED,
      title: `Message → ${input.status}`,
      messageId: existing.id,
      actorUserId: input.actorUserId,
    });

    return mapMessage(updated);
  },

  async sendMessage(input) {
    const message = await prisma.communicationMessage.findFirst({
      where: { id: input.messageId, organizationId: input.organizationId },
    });
    if (!message) throw notFound("Message not found");
    if (message.status === "SENT") throw conflict("Message already sent");
    if (message.status === "ARCHIVED") {
      throw conflict("Archived messages cannot be sent");
    }

    let recipients: Recipient[] = [];
    if (message.memberId || message.visitorId || message.householdId) {
      if (message.memberId) {
        const member = await prisma.member.findFirst({
          where: { id: message.memberId, organizationId: input.organizationId },
        });
        if (member) {
          recipients = [
            {
              name: `${member.firstName} ${member.lastName}`.trim(),
              email: member.email,
              phone: member.phone,
              memberId: member.id,
              visitorId: null,
              householdId: null,
              context: {
                FirstName: member.firstName,
                LastName: member.lastName,
              },
            },
          ];
        }
      } else if (message.visitorId) {
        recipients = await resolveAudience(
          input.organizationId,
          HubAudienceType.VISITORS,
          { visitorIds: [message.visitorId] }
        );
      } else if (message.householdId) {
        recipients = await resolveAudience(
          input.organizationId,
          HubAudienceType.HOUSEHOLDS,
          { householdIds: [message.householdId] }
        );
      }
    } else {
      recipients = await resolveAudience(
        input.organizationId,
        (message.audienceType as HubAudienceType) ?? HubAudienceType.ALL_MEMBERS,
        asAudienceFilter(message.audienceFilter)
      );
    }

    if (recipients.length === 0) {
      throw conflict("No recipients for this message");
    }

    await prisma.communicationMessage.update({
      where: { id: message.id },
      data: { status: "SENDING" },
    });

    const result = await dispatchToRecipients({
      organizationId: input.organizationId,
      messageId: message.id,
      campaignId: message.campaignId,
      channel: message.channel as HubChannel,
      subject: message.subject,
      body: message.body,
      recipients,
      actorUserId: input.actorUserId,
    });

    const finalStatus = resolveDispatchMessageStatus(result);

    const updated = await prisma.communicationMessage.update({
      where: { id: message.id },
      data: {
        status: finalStatus as PrismaHubMessageStatus,
        sentAt: finalStatus === HubMessageStatus.SENT ? new Date() : null,
        failedAt: finalStatus === HubMessageStatus.FAILED ? new Date() : null,
        metadata: {
          provider: result.provider,
          queued: result.pending > 0,
          sent: result.sent,
          failed: result.failed,
          pending: result.pending,
        },
      },
      include: { campaign: { select: { name: true } } },
    });

    await logActivity({
      organizationId: input.organizationId,
      type:
        finalStatus === HubMessageStatus.FAILED
          ? HubActivityType.FAILED
          : finalStatus === HubMessageStatus.QUEUED
            ? HubActivityType.QUEUED
            : HubActivityType.SENT,
      title:
        finalStatus === HubMessageStatus.FAILED
          ? "Message failed"
          : finalStatus === HubMessageStatus.QUEUED
            ? "Message queued (provider not configured)"
            : "Message sent",
      description: `${result.sent} sent · ${result.pending} pending · ${result.failed} failed`,
      messageId: message.id,
      actorUserId: input.actorUserId,
    });

    return mapMessage(updated);
  },

  async listAutomations(organizationId) {
    const rows = await prisma.communicationAutomation.findMany({
      where: { organizationId },
      orderBy: { updatedAt: "desc" },
    });
    return rows.map((row) => ({
      id: row.id,
      organizationId: row.organizationId,
      name: row.name,
      trigger: row.trigger as CommunicationAutomationEntity["trigger"],
      channel: row.channel as HubChannel,
      templateId: row.templateId,
      subject: row.subject,
      body: row.body,
      isActive: row.isActive,
      config: asJsonRecord(row.config),
      lastFiredAt: row.lastFiredAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  },

  async createAutomation(input: CreateAutomationInput) {
    const created = await prisma.communicationAutomation.create({
      data: {
        organizationId: input.organizationId,
        name: input.name,
        trigger: input.trigger as PrismaHubAutomationTrigger,
        channel: input.channel as PrismaHubChannel,
        templateId: input.templateId ?? null,
        subject: input.subject ?? null,
        body: input.body,
        isActive: input.isActive ?? true,
        config: (input.config ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });

    await logActivity({
      organizationId: input.organizationId,
      type: HubActivityType.CREATED,
      title: `Automation created: ${created.name}`,
      actorUserId: input.actorUserId,
      metadata: { automationId: created.id, trigger: created.trigger },
    });

    return {
      id: created.id,
      organizationId: created.organizationId,
      name: created.name,
      trigger: created.trigger as CommunicationAutomationEntity["trigger"],
      channel: created.channel as HubChannel,
      templateId: created.templateId,
      subject: created.subject,
      body: created.body,
      isActive: created.isActive,
      config: asJsonRecord(created.config),
      lastFiredAt: created.lastFiredAt,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    };
  },

  async updateAutomation(input) {
    const existing = await prisma.communicationAutomation.findFirst({
      where: { id: input.automationId, organizationId: input.organizationId },
    });
    if (!existing) throw notFound("Automation not found");

    const updated = await prisma.communicationAutomation.update({
      where: { id: existing.id },
      data: {
        name: input.name,
        channel: input.channel as PrismaHubChannel | undefined,
        templateId: input.templateId,
        subject: input.subject,
        body: input.body,
        isActive: input.isActive,
        config:
          input.config === undefined
            ? undefined
            : input.config === null
              ? Prisma.JsonNull
              : (input.config as Prisma.InputJsonValue),
      },
    });

    return {
      id: updated.id,
      organizationId: updated.organizationId,
      name: updated.name,
      trigger: updated.trigger as CommunicationAutomationEntity["trigger"],
      channel: updated.channel as HubChannel,
      templateId: updated.templateId,
      subject: updated.subject,
      body: updated.body,
      isActive: updated.isActive,
      config: asJsonRecord(updated.config),
      lastFiredAt: updated.lastFiredAt,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  },

  async fireAutomation(input) {
    const automation = await prisma.communicationAutomation.findFirst({
      where: { id: input.automationId, organizationId: input.organizationId },
    });
    if (!automation) throw notFound("Automation not found");
    if (!automation.isActive) throw conflict("Automation is inactive");

    const body = renderTemplate(automation.body, input.context ?? {});
    const subject = automation.subject
      ? renderTemplate(automation.subject, input.context ?? {})
      : null;

    const message = await prisma.communicationMessage.create({
      data: {
        organizationId: input.organizationId,
        templateId: automation.templateId,
        channel: automation.channel,
        direction: "OUTBOUND",
        status: "QUEUED",
        subject,
        body,
        memberId: input.memberId ?? null,
        visitorId: input.visitorId ?? null,
        householdId: input.householdId ?? null,
        createdByUserId: input.actorUserId ?? null,
        metadata: {
          provider: null,
          queued: false,
          automationId: automation.id,
          trigger: automation.trigger,
        },
      },
      include: { campaign: { select: { name: true } } },
    });

    await prisma.communicationAutomation.update({
      where: { id: automation.id },
      data: { lastFiredAt: new Date() },
    });

    await logActivity({
      organizationId: input.organizationId,
      type: HubActivityType.AUTOMATION_FIRED,
      title: `Automation fired: ${automation.name}`,
      messageId: message.id,
      actorUserId: input.actorUserId,
      metadata: { trigger: automation.trigger },
    });

    // Auto-send queued automation message
    return communicationRepository.sendMessage({
      organizationId: input.organizationId,
      messageId: message.id,
      actorUserId: input.actorUserId,
    });
  },

  async listDeliveries(organizationId, messageId) {
    const rows = await prisma.communicationDelivery.findMany({
      where: { organizationId, messageId },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(mapDelivery);
  },

  async updateDeliveryStatus(input) {
    const existing = await prisma.communicationDelivery.findFirst({
      where: { id: input.deliveryId, organizationId: input.organizationId },
    });
    if (!existing) throw notFound("Delivery not found");

    const now = new Date();
    const updated = await prisma.communicationDelivery.update({
      where: { id: existing.id },
      data: {
        status: input.status as PrismaHubDeliveryStatus,
        openedAt:
          input.status === "OPENED" || input.status === "CLICKED"
            ? (existing.openedAt ?? now)
            : existing.openedAt,
        clickedAt:
          input.status === "CLICKED" ? (existing.clickedAt ?? now) : existing.clickedAt,
        deliveredAt:
          input.status === "DELIVERED" ||
          input.status === "OPENED" ||
          input.status === "CLICKED"
            ? (existing.deliveredAt ?? now)
            : existing.deliveredAt,
        failedAt:
          input.status === "FAILED" || input.status === "BOUNCED"
            ? now
            : existing.failedAt,
      },
    });

    await logActivity({
      organizationId: input.organizationId,
      type: HubActivityType.DELIVERY_UPDATED,
      title: `Delivery → ${input.status}`,
      messageId: existing.messageId,
      campaignId: existing.campaignId,
      metadata: { deliveryId: existing.id },
    });

    return mapDelivery(updated);
  },

  async listProviders(organizationId) {
    const rows = await prisma.communicationProviderConfig.findMany({
      where: { organizationId },
    });
    return rows.map((row) => ({
      id: row.id,
      organizationId: row.organizationId,
      provider: row.provider as HubProviderKind,
      channel: row.channel as HubChannel,
      isEnabled: row.isEnabled,
      config: asJsonRecord(row.config),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  },

  async upsertProvider(input) {
    const row = await prisma.communicationProviderConfig.upsert({
      where: {
        organizationId_provider_channel: {
          organizationId: input.organizationId,
          provider: input.provider as PrismaHubProviderKind,
          channel: input.channel as PrismaHubChannel,
        },
      },
      create: {
        organizationId: input.organizationId,
        provider: input.provider as PrismaHubProviderKind,
        channel: input.channel as PrismaHubChannel,
        isEnabled: input.isEnabled,
        config: (input.config ?? undefined) as Prisma.InputJsonValue | undefined,
      },
      update: {
        isEnabled: input.isEnabled,
        config:
          input.config === undefined
            ? undefined
            : input.config === null
              ? Prisma.JsonNull
              : (input.config as Prisma.InputJsonValue),
      },
    });
    return {
      id: row.id,
      organizationId: row.organizationId,
      provider: row.provider as HubProviderKind,
      channel: row.channel as HubChannel,
      isEnabled: row.isEnabled,
      config: asJsonRecord(row.config),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  },

  async getAnalytics(organizationId) {
    const [messages, deliveries, recentActivity] = await Promise.all([
      prisma.communicationMessage.groupBy({
        by: ["status", "channel"],
        where: { organizationId },
        _count: true,
      }),
      prisma.communicationDelivery.groupBy({
        by: ["status"],
        where: { organizationId },
        _count: true,
      }),
      prisma.communicationActivity.findMany({
        where: { organizationId },
        orderBy: { occurredAt: "desc" },
        take: 12,
      }),
    ]);

    const totalMessages = messages.reduce((s, m) => s + m._count, 0);
    const sentCount = messages
      .filter((m) => m.status === "SENT")
      .reduce((s, m) => s + m._count, 0);
    const scheduledCount = messages
      .filter((m) => m.status === "SCHEDULED")
      .reduce((s, m) => s + m._count, 0);
    const draftCount = messages
      .filter((m) => m.status === "DRAFT")
      .reduce((s, m) => s + m._count, 0);
    const failedCount = messages
      .filter((m) => m.status === "FAILED")
      .reduce((s, m) => s + m._count, 0);

    const deliveryTotal = deliveries.reduce((s, d) => s + d._count, 0) || 1;
    const delivered = deliveries
      .filter((d) =>
        ["SENT", "DELIVERED", "OPENED", "CLICKED"].includes(d.status)
      )
      .reduce((s, d) => s + d._count, 0);
    const opened = deliveries
      .filter((d) => ["OPENED", "CLICKED"].includes(d.status))
      .reduce((s, d) => s + d._count, 0);
    const clicked = deliveries
      .filter((d) => d.status === "CLICKED")
      .reduce((s, d) => s + d._count, 0);
    const failedDeliveries = deliveries
      .filter((d) => ["FAILED", "BOUNCED"].includes(d.status))
      .reduce((s, d) => s + d._count, 0);

    const byChannelMap = new Map<HubChannel, number>();
    for (const m of messages) {
      const ch = m.channel as HubChannel;
      byChannelMap.set(ch, (byChannelMap.get(ch) ?? 0) + m._count);
    }

    const analytics: CommunicationAnalytics = {
      totalMessages,
      sentCount,
      scheduledCount,
      draftCount,
      failedCount,
      deliveryRate: Math.round((delivered / deliveryTotal) * 100),
      openRate: Math.round((opened / deliveryTotal) * 100),
      clickRate: Math.round((clicked / deliveryTotal) * 100),
      failureRate: Math.round((failedDeliveries / deliveryTotal) * 100),
      byChannel: [...byChannelMap.entries()].map(([channel, count]) => ({
        channel,
        count,
      })),
      recentActivity: recentActivity.map(mapActivity),
    };
    return analytics;
  },

  async listActivities(organizationId, limit = 40) {
    const rows = await prisma.communicationActivity.findMany({
      where: { organizationId },
      orderBy: { occurredAt: "desc" },
      take: limit,
    });
    return rows.map(mapActivity);
  },
};
