import { communicationRepository } from "@/infrastructure/repositories/communication-repository";
import type {
  AudienceFilter,
  CreateAutomationInput,
  CreateCampaignInput,
  CreateMessageInput,
  CreateTemplateInput,
  MessageCenterQuery,
  TemplateRenderContext,
} from "@/domain/entities/communication";
import type {
  HubAudienceType,
  HubChannel,
  HubDeliveryStatus,
  HubMessageStatus,
  HubProviderKind,
} from "@/domain/enums/communication";
import { notFound } from "@/server/errors";

export async function listCommunicationTemplates(organizationId: string) {
  return communicationRepository.listTemplates(organizationId);
}

export async function createCommunicationTemplate(input: CreateTemplateInput) {
  return communicationRepository.createTemplate(input);
}

export async function updateCommunicationTemplate(
  input: Parameters<typeof communicationRepository.updateTemplate>[0]
) {
  return communicationRepository.updateTemplate(input);
}

export async function listCommunicationCampaigns(organizationId: string) {
  return communicationRepository.listCampaigns(organizationId);
}

export async function getCommunicationCampaign(
  organizationId: string,
  campaignId: string
) {
  const campaign = await communicationRepository.getCampaign(
    organizationId,
    campaignId
  );
  if (!campaign) throw notFound("Campaign not found");
  return campaign;
}

export async function createCommunicationCampaign(input: CreateCampaignInput) {
  return communicationRepository.createCampaign(input);
}

export async function updateCommunicationCampaign(
  input: Parameters<typeof communicationRepository.updateCampaign>[0]
) {
  return communicationRepository.updateCampaign(input);
}

export async function sendCommunicationCampaign(input: {
  organizationId: string;
  campaignId: string;
  actorUserId?: string | null;
}) {
  return communicationRepository.sendCampaign(input);
}

export async function listMessageCenter(query: MessageCenterQuery) {
  return communicationRepository.listMessages(query);
}

export async function getCommunicationMessage(
  organizationId: string,
  messageId: string
) {
  const message = await communicationRepository.getMessage(
    organizationId,
    messageId
  );
  if (!message) throw notFound("Message not found");
  return message;
}

export async function createCommunicationMessage(input: CreateMessageInput) {
  return communicationRepository.createMessage(input);
}

export async function updateCommunicationMessageStatus(input: {
  organizationId: string;
  messageId: string;
  status: HubMessageStatus;
  actorUserId?: string | null;
}) {
  return communicationRepository.updateMessageStatus(input);
}

export async function sendCommunicationMessage(input: {
  organizationId: string;
  messageId: string;
  actorUserId?: string | null;
}) {
  return communicationRepository.sendMessage(input);
}

export async function listCommunicationAutomations(organizationId: string) {
  return communicationRepository.listAutomations(organizationId);
}

export async function createCommunicationAutomation(
  input: CreateAutomationInput
) {
  return communicationRepository.createAutomation(input);
}

export async function updateCommunicationAutomation(
  input: Parameters<typeof communicationRepository.updateAutomation>[0]
) {
  return communicationRepository.updateAutomation(input);
}

export async function fireCommunicationAutomation(input: {
  organizationId: string;
  automationId: string;
  context?: TemplateRenderContext;
  memberId?: string | null;
  visitorId?: string | null;
  householdId?: string | null;
  actorUserId?: string | null;
}) {
  return communicationRepository.fireAutomation(input);
}

export async function listMessageDeliveries(
  organizationId: string,
  messageId: string
) {
  return communicationRepository.listDeliveries(organizationId, messageId);
}

export async function updateDeliveryStatus(input: {
  organizationId: string;
  deliveryId: string;
  status: HubDeliveryStatus;
}) {
  return communicationRepository.updateDeliveryStatus(input);
}

export async function listCommunicationProviders(organizationId: string) {
  return communicationRepository.listProviders(organizationId);
}

export async function upsertCommunicationProvider(input: {
  organizationId: string;
  provider: HubProviderKind;
  channel: HubChannel;
  isEnabled: boolean;
  config?: Record<string, unknown> | null;
}) {
  return communicationRepository.upsertProvider(input);
}

export async function getCommunicationAnalytics(organizationId: string) {
  return communicationRepository.getAnalytics(organizationId);
}

export async function listCommunicationActivities(
  organizationId: string,
  limit?: number
) {
  return communicationRepository.listActivities(organizationId, limit);
}

export type { AudienceFilter, HubAudienceType, HubChannel };
