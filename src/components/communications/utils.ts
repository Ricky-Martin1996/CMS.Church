import {
  HUB_AUDIENCE_LABELS,
  HUB_CHANNEL_LABELS,
  HUB_STATUS_LABELS,
  HubAudienceType,
  HubChannel,
  HubMessageStatus,
} from "@/domain/enums/communication";

export function channelLabel(channel: HubChannel | string) {
  return HUB_CHANNEL_LABELS[channel as HubChannel] ?? String(channel);
}

export function statusLabel(status: HubMessageStatus | string) {
  return HUB_STATUS_LABELS[status as HubMessageStatus] ?? String(status);
}

export function audienceLabel(audience: HubAudienceType | string) {
  return HUB_AUDIENCE_LABELS[audience as HubAudienceType] ?? String(audience);
}

export function statusVariant(
  status: HubMessageStatus | string
): "default" | "success" | "warning" | "secondary" | "muted" | "outline" {
  switch (status) {
    case HubMessageStatus.SENT:
      return "success";
    case HubMessageStatus.SCHEDULED:
    case HubMessageStatus.QUEUED:
      return "default";
    case HubMessageStatus.DRAFT:
      return "secondary";
    case HubMessageStatus.FAILED:
      return "warning";
    case HubMessageStatus.ARCHIVED:
      return "muted";
    default:
      return "outline";
  }
}

export const CHANNEL_OPTIONS = Object.values(HubChannel);
export const AUDIENCE_OPTIONS = Object.values(HubAudienceType);
export const STATUS_FILTERS: Array<HubMessageStatus | "ALL"> = [
  "ALL",
  HubMessageStatus.DRAFT,
  HubMessageStatus.SCHEDULED,
  HubMessageStatus.SENT,
  HubMessageStatus.FAILED,
  HubMessageStatus.ARCHIVED,
];
