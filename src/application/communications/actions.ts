"use server";

import {
  createCommunicationAutomation,
  createCommunicationCampaign,
  createCommunicationMessage,
  createCommunicationTemplate,
  fireCommunicationAutomation,
  getCommunicationAnalytics,
  getCommunicationCampaign,
  getCommunicationMessage,
  listCommunicationAutomations,
  listCommunicationCampaigns,
  listCommunicationTemplates,
  listMessageCenter,
  listMessageDeliveries,
  sendCommunicationCampaign,
  sendCommunicationMessage,
  updateCommunicationAutomation,
  updateCommunicationCampaign,
  updateCommunicationMessageStatus,
  updateCommunicationTemplate,
  updateDeliveryStatus,
  upsertCommunicationProvider,
} from "@/application/communications/communication-service";
import {
  HubAudienceType,
  HubAutomationTrigger,
  HubChannel,
  HubDeliveryStatus,
  HubMessageDirection,
  HubMessageStatus,
  HubProviderKind,
} from "@/domain/enums/communication";
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
  console.error("[communications action]", error);
  return { ok: false, error: "Something went wrong" };
}

function revalidateComms(path?: string) {
  revalidatePath("/communications");
  revalidatePath("/communications/templates");
  revalidatePath("/communications/campaigns");
  revalidatePath("/communications/automations");
  if (path) revalidatePath(path);
}

const audienceFilterSchema = z
  .object({
    ministryId: z.string().optional(),
    eventId: z.string().optional(),
    cellGroup: z.string().optional(),
    memberIds: z.array(z.string()).optional(),
    visitorIds: z.array(z.string()).optional(),
    householdIds: z.array(z.string()).optional(),
    tagSlugs: z.array(z.string()).optional(),
    search: z.string().optional(),
  })
  .optional()
  .nullable();

export async function listMessageCenterAction(raw?: unknown) {
  try {
    const ctx = await requirePermission(Permission.COMMUNICATION_READ);
    const data = z
      .object({
        direction: z.nativeEnum(HubMessageDirection).optional(),
        status: z.nativeEnum(HubMessageStatus).optional(),
        channel: z.nativeEnum(HubChannel).optional(),
        search: z.string().max(200).optional(),
        limit: z.number().int().min(1).max(200).optional(),
      })
      .optional()
      .parse(raw);

    const messages = await listMessageCenter({
      organizationId: ctx.organization.id,
      ...data,
    });
    return { ok: true as const, data: messages };
  } catch (error) {
    return actionError(error);
  }
}

export async function getCommunicationAnalyticsAction() {
  try {
    const ctx = await requirePermission(Permission.COMMUNICATION_READ);
    const data = await getCommunicationAnalytics(ctx.organization.id);
    return { ok: true as const, data };
  } catch (error) {
    return actionError(error);
  }
}

export async function listTemplatesAction() {
  try {
    const ctx = await requirePermission(Permission.COMMUNICATION_READ);
    const data = await listCommunicationTemplates(ctx.organization.id);
    return { ok: true as const, data };
  } catch (error) {
    return actionError(error);
  }
}

export async function createTemplateAction(raw: unknown) {
  try {
    const ctx = await requirePermission(Permission.COMMUNICATION_TEMPLATES);
    const data = z
      .object({
        name: z.string().min(1).max(160),
        slug: z.string().max(80).optional(),
        channel: z.nativeEnum(HubChannel),
        subject: z.string().max(300).optional(),
        body: z.string().min(1).max(20000),
        variables: z.array(z.string()).optional(),
      })
      .parse(raw);

    const template = await createCommunicationTemplate({
      organizationId: ctx.organization.id,
      name: data.name,
      slug: data.slug ?? data.name,
      channel: data.channel,
      subject: data.subject ?? null,
      body: data.body,
      variables: data.variables,
      actorUserId: ctx.user.id,
    });
    revalidateComms();
    return { ok: true as const, data: template };
  } catch (error) {
    return actionError(error);
  }
}

export async function updateTemplateAction(raw: unknown) {
  try {
    const ctx = await requirePermission(Permission.COMMUNICATION_TEMPLATES);
    const data = z
      .object({
        templateId: z.string().min(1),
        name: z.string().min(1).max(160).optional(),
        subject: z.string().max(300).optional().nullable(),
        body: z.string().min(1).max(20000).optional(),
        variables: z.array(z.string()).optional(),
        isActive: z.boolean().optional(),
      })
      .parse(raw);

    const template = await updateCommunicationTemplate({
      organizationId: ctx.organization.id,
      ...data,
      actorUserId: ctx.user.id,
    });
    revalidateComms();
    return { ok: true as const, data: template };
  } catch (error) {
    return actionError(error);
  }
}

export async function listCampaignsAction() {
  try {
    const ctx = await requirePermission(Permission.COMMUNICATION_READ);
    const data = await listCommunicationCampaigns(ctx.organization.id);
    return { ok: true as const, data };
  } catch (error) {
    return actionError(error);
  }
}

export async function getCampaignAction(campaignId: string) {
  try {
    const ctx = await requirePermission(Permission.COMMUNICATION_READ);
    const data = await getCommunicationCampaign(
      ctx.organization.id,
      campaignId
    );
    return { ok: true as const, data };
  } catch (error) {
    return actionError(error);
  }
}

export async function createCampaignAction(raw: unknown) {
  try {
    const ctx = await requirePermission(Permission.COMMUNICATION_WRITE);
    const data = z
      .object({
        name: z.string().min(1).max(200),
        description: z.string().max(2000).optional(),
        channel: z.nativeEnum(HubChannel),
        audienceType: z.nativeEnum(HubAudienceType),
        audienceFilter: audienceFilterSchema,
        templateId: z.string().optional(),
        subject: z.string().max(300).optional(),
        body: z.string().min(1).max(20000),
        scheduledFor: z.string().datetime().optional().nullable(),
      })
      .parse(raw);

    const campaign = await createCommunicationCampaign({
      organizationId: ctx.organization.id,
      name: data.name,
      description: data.description ?? null,
      channel: data.channel,
      audienceType: data.audienceType,
      audienceFilter: data.audienceFilter ?? null,
      templateId: data.templateId ?? null,
      subject: data.subject ?? null,
      body: data.body,
      scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : null,
      actorUserId: ctx.user.id,
    });
    revalidateComms("/communications/campaigns");
    return { ok: true as const, data: campaign };
  } catch (error) {
    return actionError(error);
  }
}

export async function updateCampaignAction(raw: unknown) {
  try {
    const ctx = await requirePermission(Permission.COMMUNICATION_WRITE);
    const data = z
      .object({
        campaignId: z.string().min(1),
        name: z.string().min(1).max(200).optional(),
        description: z.string().max(2000).optional().nullable(),
        channel: z.nativeEnum(HubChannel).optional(),
        audienceType: z.nativeEnum(HubAudienceType).optional(),
        audienceFilter: audienceFilterSchema,
        templateId: z.string().optional().nullable(),
        subject: z.string().max(300).optional().nullable(),
        body: z.string().min(1).max(20000).optional(),
        scheduledFor: z.string().datetime().optional().nullable(),
        status: z.nativeEnum(HubMessageStatus).optional(),
      })
      .parse(raw);

    const campaign = await updateCommunicationCampaign({
      organizationId: ctx.organization.id,
      campaignId: data.campaignId,
      name: data.name,
      description: data.description,
      channel: data.channel,
      audienceType: data.audienceType,
      audienceFilter:
        data.audienceFilter === undefined
          ? undefined
          : (data.audienceFilter ?? null),
      templateId: data.templateId,
      subject: data.subject,
      body: data.body,
      scheduledFor:
        data.scheduledFor === undefined
          ? undefined
          : data.scheduledFor
            ? new Date(data.scheduledFor)
            : null,
      status: data.status,
      actorUserId: ctx.user.id,
    });
    revalidateComms(`/communications/campaigns`);
    return { ok: true as const, data: campaign };
  } catch (error) {
    return actionError(error);
  }
}

export async function sendCampaignAction(campaignId: string) {
  try {
    const ctx = await requirePermission(Permission.COMMUNICATION_SEND);
    const data = await sendCommunicationCampaign({
      organizationId: ctx.organization.id,
      campaignId,
      actorUserId: ctx.user.id,
    });
    revalidateComms();
    return { ok: true as const, data };
  } catch (error) {
    return actionError(error);
  }
}

export async function createMessageAction(raw: unknown) {
  try {
    const ctx = await requirePermission(Permission.COMMUNICATION_WRITE);
    const data = z
      .object({
        channel: z.nativeEnum(HubChannel),
        direction: z.nativeEnum(HubMessageDirection).optional(),
        subject: z.string().max(300).optional(),
        body: z.string().min(1).max(20000),
        audienceType: z.nativeEnum(HubAudienceType).optional(),
        audienceFilter: audienceFilterSchema,
        templateId: z.string().optional(),
        campaignId: z.string().optional(),
        scheduledFor: z.string().datetime().optional().nullable(),
        memberId: z.string().optional(),
        visitorId: z.string().optional(),
        householdId: z.string().optional(),
      })
      .parse(raw);

    const message = await createCommunicationMessage({
      organizationId: ctx.organization.id,
      channel: data.channel,
      direction: data.direction,
      subject: data.subject ?? null,
      body: data.body,
      audienceType: data.audienceType ?? null,
      audienceFilter: data.audienceFilter ?? null,
      templateId: data.templateId ?? null,
      campaignId: data.campaignId ?? null,
      scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : null,
      memberId: data.memberId ?? null,
      visitorId: data.visitorId ?? null,
      householdId: data.householdId ?? null,
      actorUserId: ctx.user.id,
    });
    revalidateComms();
    return { ok: true as const, data: message };
  } catch (error) {
    return actionError(error);
  }
}

export async function sendMessageAction(messageId: string) {
  try {
    const ctx = await requirePermission(Permission.COMMUNICATION_SEND);
    const data = await sendCommunicationMessage({
      organizationId: ctx.organization.id,
      messageId,
      actorUserId: ctx.user.id,
    });
    revalidateComms(`/communications/${messageId}`);
    return { ok: true as const, data };
  } catch (error) {
    return actionError(error);
  }
}

export async function archiveMessageAction(messageId: string) {
  try {
    const ctx = await requirePermission(Permission.COMMUNICATION_WRITE);
    const data = await updateCommunicationMessageStatus({
      organizationId: ctx.organization.id,
      messageId,
      status: HubMessageStatus.ARCHIVED,
      actorUserId: ctx.user.id,
    });
    revalidateComms();
    return { ok: true as const, data };
  } catch (error) {
    return actionError(error);
  }
}

export async function getMessageAction(messageId: string) {
  try {
    const ctx = await requirePermission(Permission.COMMUNICATION_READ);
    const [message, deliveries] = await Promise.all([
      getCommunicationMessage(ctx.organization.id, messageId),
      listMessageDeliveries(ctx.organization.id, messageId),
    ]);
    return { ok: true as const, data: { message, deliveries } };
  } catch (error) {
    return actionError(error);
  }
}

export async function listAutomationsAction() {
  try {
    const ctx = await requirePermission(Permission.COMMUNICATION_READ);
    const data = await listCommunicationAutomations(ctx.organization.id);
    return { ok: true as const, data };
  } catch (error) {
    return actionError(error);
  }
}

export async function createAutomationAction(raw: unknown) {
  try {
    const ctx = await requirePermission(Permission.COMMUNICATION_WRITE);
    const data = z
      .object({
        name: z.string().min(1).max(160),
        trigger: z.nativeEnum(HubAutomationTrigger),
        channel: z.nativeEnum(HubChannel),
        templateId: z.string().optional(),
        subject: z.string().max(300).optional(),
        body: z.string().min(1).max(20000),
        isActive: z.boolean().optional(),
      })
      .parse(raw);

    const automation = await createCommunicationAutomation({
      organizationId: ctx.organization.id,
      name: data.name,
      trigger: data.trigger,
      channel: data.channel,
      templateId: data.templateId ?? null,
      subject: data.subject ?? null,
      body: data.body,
      isActive: data.isActive,
      actorUserId: ctx.user.id,
    });
    revalidateComms("/communications/automations");
    return { ok: true as const, data: automation };
  } catch (error) {
    return actionError(error);
  }
}

export async function updateAutomationAction(raw: unknown) {
  try {
    const ctx = await requirePermission(Permission.COMMUNICATION_WRITE);
    const data = z
      .object({
        automationId: z.string().min(1),
        name: z.string().min(1).max(160).optional(),
        channel: z.nativeEnum(HubChannel).optional(),
        templateId: z.string().optional().nullable(),
        subject: z.string().max(300).optional().nullable(),
        body: z.string().min(1).max(20000).optional(),
        isActive: z.boolean().optional(),
      })
      .parse(raw);

    const automation = await updateCommunicationAutomation({
      organizationId: ctx.organization.id,
      ...data,
      actorUserId: ctx.user.id,
    });
    revalidateComms("/communications/automations");
    return { ok: true as const, data: automation };
  } catch (error) {
    return actionError(error);
  }
}

export async function fireAutomationAction(raw: unknown) {
  try {
    const ctx = await requirePermission(Permission.COMMUNICATION_SEND);
    const data = z
      .object({
        automationId: z.string().min(1),
        memberId: z.string().optional(),
        visitorId: z.string().optional(),
        householdId: z.string().optional(),
        FirstName: z.string().optional(),
        LastName: z.string().optional(),
        EventName: z.string().optional(),
      })
      .parse(raw);

    const message = await fireCommunicationAutomation({
      organizationId: ctx.organization.id,
      automationId: data.automationId,
      memberId: data.memberId ?? null,
      visitorId: data.visitorId ?? null,
      householdId: data.householdId ?? null,
      context: {
        FirstName: data.FirstName,
        LastName: data.LastName,
        EventName: data.EventName,
      },
      actorUserId: ctx.user.id,
    });
    revalidateComms();
    return { ok: true as const, data: message };
  } catch (error) {
    return actionError(error);
  }
}

export async function updateDeliveryStatusAction(raw: unknown) {
  try {
    const ctx = await requirePermission(Permission.COMMUNICATION_WRITE);
    const data = z
      .object({
        deliveryId: z.string().min(1),
        status: z.nativeEnum(HubDeliveryStatus),
      })
      .parse(raw);

    const delivery = await updateDeliveryStatus({
      organizationId: ctx.organization.id,
      deliveryId: data.deliveryId,
      status: data.status,
    });
    revalidateComms();
    return { ok: true as const, data: delivery };
  } catch (error) {
    return actionError(error);
  }
}

export async function upsertProviderAction(raw: unknown) {
  try {
    const ctx = await requirePermission(Permission.COMMUNICATION_WRITE);
    const data = z
      .object({
        provider: z.nativeEnum(HubProviderKind),
        channel: z.nativeEnum(HubChannel),
        isEnabled: z.boolean(),
      })
      .parse(raw);

    const config = await upsertCommunicationProvider({
      organizationId: ctx.organization.id,
      provider: data.provider,
      channel: data.channel,
      isEnabled: data.isEnabled,
      config: { provider: data.provider, queued: false },
    });
    revalidateComms();
    return { ok: true as const, data: config };
  } catch (error) {
    return actionError(error);
  }
}
