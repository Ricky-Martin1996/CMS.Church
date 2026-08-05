import type {
  HubActivityType,
  HubAudienceType,
  HubAutomationTrigger,
  HubChannel,
  HubDeliveryStatus,
  HubMessageDirection,
  HubMessageStatus,
  HubProviderKind,
} from "@/domain/enums/communication";

export type AudienceFilter = {
  ministryId?: string;
  eventId?: string;
  cellGroup?: string;
  memberIds?: string[];
  visitorIds?: string[];
  householdIds?: string[];
  tagSlugs?: string[];
  search?: string;
};

export type CommunicationTemplateEntity = {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  channel: HubChannel;
  subject: string | null;
  body: string;
  variables: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type CommunicationCampaignEntity = {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  channel: HubChannel;
  audienceType: HubAudienceType;
  audienceFilter: AudienceFilter | null;
  templateId: string | null;
  subject: string | null;
  body: string;
  status: HubMessageStatus;
  scheduledFor: Date | null;
  sentAt: Date | null;
  createdByUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
  deliveryCount?: number;
  openRate?: number;
  clickRate?: number;
  failureCount?: number;
};

export type CommunicationMessageEntity = {
  id: string;
  organizationId: string;
  campaignId: string | null;
  templateId: string | null;
  channel: HubChannel;
  direction: HubMessageDirection;
  status: HubMessageStatus;
  subject: string | null;
  body: string;
  audienceType: HubAudienceType | null;
  audienceFilter: AudienceFilter | null;
  metadata: Record<string, unknown> | null;
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
  campaignName?: string | null;
  recipientPreview?: string | null;
};

export type CommunicationDeliveryEntity = {
  id: string;
  organizationId: string;
  messageId: string;
  campaignId: string | null;
  channel: HubChannel;
  status: HubDeliveryStatus;
  recipientName: string | null;
  recipientEmail: string | null;
  recipientPhone: string | null;
  memberId: string | null;
  visitorId: string | null;
  householdId: string | null;
  provider: HubProviderKind;
  externalId: string | null;
  metadata: Record<string, unknown> | null;
  errorMessage: string | null;
  sentAt: Date | null;
  deliveredAt: Date | null;
  openedAt: Date | null;
  clickedAt: Date | null;
  failedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CommunicationAutomationEntity = {
  id: string;
  organizationId: string;
  name: string;
  trigger: HubAutomationTrigger;
  channel: HubChannel;
  templateId: string | null;
  subject: string | null;
  body: string;
  isActive: boolean;
  config: Record<string, unknown> | null;
  lastFiredAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CommunicationActivityEntity = {
  id: string;
  organizationId: string;
  type: HubActivityType;
  title: string;
  description: string | null;
  actorUserId: string | null;
  campaignId: string | null;
  messageId: string | null;
  metadata: Record<string, unknown> | null;
  occurredAt: Date;
  createdAt: Date;
};

export type CommunicationProviderConfigEntity = {
  id: string;
  organizationId: string;
  provider: HubProviderKind;
  channel: HubChannel;
  isEnabled: boolean;
  config: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CommunicationAnalytics = {
  totalMessages: number;
  sentCount: number;
  scheduledCount: number;
  draftCount: number;
  failedCount: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  failureRate: number;
  byChannel: Array<{ channel: HubChannel; count: number }>;
  recentActivity: CommunicationActivityEntity[];
};

export type MessageCenterQuery = {
  organizationId: string;
  direction?: HubMessageDirection;
  status?: HubMessageStatus;
  channel?: HubChannel;
  search?: string;
  limit?: number;
};

export type CreateTemplateInput = {
  organizationId: string;
  name: string;
  slug: string;
  channel: HubChannel;
  subject?: string | null;
  body: string;
  variables?: string[];
  actorUserId?: string | null;
};

export type CreateCampaignInput = {
  organizationId: string;
  name: string;
  description?: string | null;
  channel: HubChannel;
  audienceType: HubAudienceType;
  audienceFilter?: AudienceFilter | null;
  templateId?: string | null;
  subject?: string | null;
  body: string;
  scheduledFor?: Date | null;
  actorUserId?: string | null;
};

export type CreateMessageInput = {
  organizationId: string;
  channel: HubChannel;
  direction?: HubMessageDirection;
  subject?: string | null;
  body: string;
  audienceType?: HubAudienceType | null;
  audienceFilter?: AudienceFilter | null;
  templateId?: string | null;
  campaignId?: string | null;
  scheduledFor?: Date | null;
  memberId?: string | null;
  visitorId?: string | null;
  householdId?: string | null;
  actorUserId?: string | null;
};

export type CreateAutomationInput = {
  organizationId: string;
  name: string;
  trigger: HubAutomationTrigger;
  channel: HubChannel;
  templateId?: string | null;
  subject?: string | null;
  body: string;
  isActive?: boolean;
  config?: Record<string, unknown> | null;
  actorUserId?: string | null;
};

export type TemplateRenderContext = {
  FirstName?: string;
  LastName?: string;
  FamilyName?: string;
  EventName?: string;
  ServiceTime?: string;
  ChurchName?: string;
  Campus?: string;
  MinistryName?: string;
  LeaderName?: string;
  [key: string]: string | undefined;
};
