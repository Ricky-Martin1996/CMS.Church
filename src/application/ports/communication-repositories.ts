import type {
  AudienceFilter,
  CommunicationActivityEntity,
  CommunicationAnalytics,
  CommunicationAutomationEntity,
  CommunicationCampaignEntity,
  CommunicationDeliveryEntity,
  CommunicationMessageEntity,
  CommunicationProviderConfigEntity,
  CommunicationTemplateEntity,
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

export type CommunicationRepository = {
  listTemplates(organizationId: string): Promise<CommunicationTemplateEntity[]>;
  createTemplate(input: CreateTemplateInput): Promise<CommunicationTemplateEntity>;
  updateTemplate(input: {
    organizationId: string;
    templateId: string;
    name?: string;
    subject?: string | null;
    body?: string;
    variables?: string[];
    isActive?: boolean;
    actorUserId?: string | null;
  }): Promise<CommunicationTemplateEntity>;

  listCampaigns(organizationId: string): Promise<CommunicationCampaignEntity[]>;
  getCampaign(
    organizationId: string,
    campaignId: string
  ): Promise<CommunicationCampaignEntity | null>;
  createCampaign(input: CreateCampaignInput): Promise<CommunicationCampaignEntity>;
  updateCampaign(input: {
    organizationId: string;
    campaignId: string;
    name?: string;
    description?: string | null;
    channel?: HubChannel;
    audienceType?: HubAudienceType;
    audienceFilter?: AudienceFilter | null;
    templateId?: string | null;
    subject?: string | null;
    body?: string;
    scheduledFor?: Date | null;
    status?: HubMessageStatus;
    actorUserId?: string | null;
  }): Promise<CommunicationCampaignEntity>;
  sendCampaign(input: {
    organizationId: string;
    campaignId: string;
    actorUserId?: string | null;
  }): Promise<CommunicationCampaignEntity>;

  listMessages(query: MessageCenterQuery): Promise<CommunicationMessageEntity[]>;
  getMessage(
    organizationId: string,
    messageId: string
  ): Promise<CommunicationMessageEntity | null>;
  createMessage(input: CreateMessageInput): Promise<CommunicationMessageEntity>;
  updateMessageStatus(input: {
    organizationId: string;
    messageId: string;
    status: HubMessageStatus;
    actorUserId?: string | null;
  }): Promise<CommunicationMessageEntity>;
  sendMessage(input: {
    organizationId: string;
    messageId: string;
    actorUserId?: string | null;
  }): Promise<CommunicationMessageEntity>;

  listAutomations(
    organizationId: string
  ): Promise<CommunicationAutomationEntity[]>;
  createAutomation(
    input: CreateAutomationInput
  ): Promise<CommunicationAutomationEntity>;
  updateAutomation(input: {
    organizationId: string;
    automationId: string;
    name?: string;
    channel?: HubChannel;
    templateId?: string | null;
    subject?: string | null;
    body?: string;
    isActive?: boolean;
    config?: Record<string, unknown> | null;
    actorUserId?: string | null;
  }): Promise<CommunicationAutomationEntity>;
  fireAutomation(input: {
    organizationId: string;
    automationId: string;
    context?: TemplateRenderContext;
    memberId?: string | null;
    visitorId?: string | null;
    householdId?: string | null;
    actorUserId?: string | null;
  }): Promise<CommunicationMessageEntity>;

  listDeliveries(
    organizationId: string,
    messageId: string
  ): Promise<CommunicationDeliveryEntity[]>;
  updateDeliveryStatus(input: {
    organizationId: string;
    deliveryId: string;
    status: HubDeliveryStatus;
  }): Promise<CommunicationDeliveryEntity>;

  listProviders(
    organizationId: string
  ): Promise<CommunicationProviderConfigEntity[]>;
  upsertProvider(input: {
    organizationId: string;
    provider: HubProviderKind;
    channel: HubChannel;
    isEnabled: boolean;
    config?: Record<string, unknown> | null;
  }): Promise<CommunicationProviderConfigEntity>;

  getAnalytics(organizationId: string): Promise<CommunicationAnalytics>;
  listActivities(
    organizationId: string,
    limit?: number
  ): Promise<CommunicationActivityEntity[]>;

  renderTemplate(body: string, context: TemplateRenderContext): string;
};
