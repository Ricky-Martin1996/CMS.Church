import type { HubChannel, HubProviderKind } from "@/domain/enums/communication";

export type ProviderSendInput = {
  organizationId: string;
  channel: HubChannel;
  toEmail?: string | null;
  toPhone?: string | null;
  pushToken?: string | null;
  subject?: string | null;
  body: string;
  recipientName?: string | null;
  metadata?: Record<string, unknown>;
};

export type ProviderSendResult = {
  ok: boolean;
  queued: boolean;
  provider: HubProviderKind;
  externalId: string | null;
  error?: string | null;
  metadata: Record<string, unknown>;
};

export type CommunicationProvider = {
  kind: HubProviderKind;
  channels: HubChannel[];
  send(input: ProviderSendInput): Promise<ProviderSendResult>;
};

export function defaultProviderMetadata(
  provider: HubProviderKind,
  extra?: Record<string, unknown>
): Record<string, unknown> {
  return {
    provider,
    queued: false,
    configured: false,
    ...extra,
  };
}
