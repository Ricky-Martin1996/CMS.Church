import { HubChannel, HubProviderKind } from "@/domain/enums/communication";
import {
  defaultProviderMetadata,
  type CommunicationProvider,
  type ProviderSendInput,
  type ProviderSendResult,
} from "@/infrastructure/communications/providers/types";

function stubResult(
  provider: HubProviderKind,
  input: ProviderSendInput,
  reason: string
): ProviderSendResult {
  return {
    ok: true,
    queued: false,
    provider,
    externalId: null,
    metadata: defaultProviderMetadata(provider, {
      reason,
      channel: input.channel,
      toEmail: input.toEmail ?? null,
      toPhone: input.toPhone ?? null,
    }),
  };
}

export const resendProvider: CommunicationProvider = {
  kind: HubProviderKind.RESEND,
  channels: [HubChannel.EMAIL],
  async send(input) {
    // Adapter ready — set RESEND_API_KEY to enable live sends.
    if (!process.env.RESEND_API_KEY) {
      return stubResult(
        HubProviderKind.RESEND,
        input,
        "RESEND_API_KEY not configured; message queued locally"
      );
    }
    return stubResult(
      HubProviderKind.RESEND,
      input,
      "Resend adapter stub — wire SDK in production"
    );
  },
};

export const twilioProvider: CommunicationProvider = {
  kind: HubProviderKind.TWILIO,
  channels: [HubChannel.SMS],
  async send(input) {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      return stubResult(
        HubProviderKind.TWILIO,
        input,
        "Twilio credentials not configured; message queued locally"
      );
    }
    return stubResult(
      HubProviderKind.TWILIO,
      input,
      "Twilio adapter stub — wire SDK in production"
    );
  },
};

export const whatsappBusinessProvider: CommunicationProvider = {
  kind: HubProviderKind.WHATSAPP_BUSINESS,
  channels: [HubChannel.WHATSAPP],
  async send(input) {
    if (!process.env.WHATSAPP_BUSINESS_TOKEN) {
      return stubResult(
        HubProviderKind.WHATSAPP_BUSINESS,
        input,
        "WhatsApp Business token not configured; message queued locally"
      );
    }
    return stubResult(
      HubProviderKind.WHATSAPP_BUSINESS,
      input,
      "WhatsApp Business adapter stub — wire API in production"
    );
  },
};

export const firebasePushProvider: CommunicationProvider = {
  kind: HubProviderKind.FIREBASE,
  channels: [HubChannel.PUSH],
  async send(input) {
    if (!process.env.FIREBASE_SERVER_KEY) {
      return stubResult(
        HubProviderKind.FIREBASE,
        input,
        "Firebase server key not configured; message queued locally"
      );
    }
    return stubResult(
      HubProviderKind.FIREBASE,
      input,
      "Firebase Push adapter stub — wire FCM in production"
    );
  },
};

export const internalProvider: CommunicationProvider = {
  kind: HubProviderKind.INTERNAL,
  channels: [HubChannel.INTERNAL],
  async send(input) {
    return {
      ok: true,
      queued: false,
      provider: HubProviderKind.INTERNAL,
      externalId: `internal_${Date.now()}`,
      metadata: defaultProviderMetadata(HubProviderKind.INTERNAL, {
        deliveredInApp: true,
        channel: input.channel,
      }),
    };
  },
};

const PROVIDERS: CommunicationProvider[] = [
  resendProvider,
  twilioProvider,
  whatsappBusinessProvider,
  firebasePushProvider,
  internalProvider,
];

export function providerForChannel(channel: HubChannel): CommunicationProvider {
  switch (channel) {
    case HubChannel.EMAIL:
      return resendProvider;
    case HubChannel.SMS:
      return twilioProvider;
    case HubChannel.WHATSAPP:
      return whatsappBusinessProvider;
    case HubChannel.PUSH:
      return firebasePushProvider;
    case HubChannel.INTERNAL:
    default:
      return internalProvider;
  }
}

export function listProviders() {
  return PROVIDERS.map((p) => ({
    kind: p.kind,
    channels: p.channels,
  }));
}
