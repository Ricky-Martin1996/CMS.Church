export enum HubChannel {
  EMAIL = "EMAIL",
  WHATSAPP = "WHATSAPP",
  SMS = "SMS",
  PUSH = "PUSH",
  INTERNAL = "INTERNAL",
}

export enum HubMessageStatus {
  DRAFT = "DRAFT",
  SCHEDULED = "SCHEDULED",
  QUEUED = "QUEUED",
  SENDING = "SENDING",
  SENT = "SENT",
  FAILED = "FAILED",
  ARCHIVED = "ARCHIVED",
}

export enum HubMessageDirection {
  OUTBOUND = "OUTBOUND",
  INBOUND = "INBOUND",
}

export enum HubAudienceType {
  ALL_MEMBERS = "ALL_MEMBERS",
  VISITORS = "VISITORS",
  HOUSEHOLDS = "HOUSEHOLDS",
  CELL_GROUPS = "CELL_GROUPS",
  VOLUNTEERS = "VOLUNTEERS",
  MINISTRY = "MINISTRY",
  EVENT_REGISTRANTS = "EVENT_REGISTRANTS",
  CUSTOM = "CUSTOM",
}

export enum HubAutomationTrigger {
  NEW_VISITOR = "NEW_VISITOR",
  BIRTHDAY = "BIRTHDAY",
  ANNIVERSARY = "ANNIVERSARY",
  EVENT_REMINDER = "EVENT_REMINDER",
  VOLUNTEER_ASSIGNMENT = "VOLUNTEER_ASSIGNMENT",
  ATTENDANCE_MISSED = "ATTENDANCE_MISSED",
  PRAYER_ASSIGNED = "PRAYER_ASSIGNED",
  MEMBERSHIP_APPROVED = "MEMBERSHIP_APPROVED",
  FOLLOW_UP_TASK_DUE = "FOLLOW_UP_TASK_DUE",
}

export enum HubDeliveryStatus {
  PENDING = "PENDING",
  SENT = "SENT",
  DELIVERED = "DELIVERED",
  OPENED = "OPENED",
  CLICKED = "CLICKED",
  FAILED = "FAILED",
  BOUNCED = "BOUNCED",
}

export enum HubProviderKind {
  RESEND = "RESEND",
  TWILIO = "TWILIO",
  WHATSAPP_BUSINESS = "WHATSAPP_BUSINESS",
  FIREBASE = "FIREBASE",
  INTERNAL = "INTERNAL",
}

export enum HubActivityType {
  CREATED = "CREATED",
  UPDATED = "UPDATED",
  SCHEDULED = "SCHEDULED",
  QUEUED = "QUEUED",
  SENT = "SENT",
  FAILED = "FAILED",
  ARCHIVED = "ARCHIVED",
  TEMPLATE_USED = "TEMPLATE_USED",
  AUTOMATION_FIRED = "AUTOMATION_FIRED",
  DELIVERY_UPDATED = "DELIVERY_UPDATED",
}

export const HUB_CHANNEL_LABELS: Record<HubChannel, string> = {
  [HubChannel.EMAIL]: "Email",
  [HubChannel.WHATSAPP]: "WhatsApp",
  [HubChannel.SMS]: "SMS",
  [HubChannel.PUSH]: "Push",
  [HubChannel.INTERNAL]: "Internal",
};

export const HUB_STATUS_LABELS: Record<HubMessageStatus, string> = {
  [HubMessageStatus.DRAFT]: "Draft",
  [HubMessageStatus.SCHEDULED]: "Scheduled",
  [HubMessageStatus.QUEUED]: "Queued",
  [HubMessageStatus.SENDING]: "Sending",
  [HubMessageStatus.SENT]: "Sent",
  [HubMessageStatus.FAILED]: "Failed",
  [HubMessageStatus.ARCHIVED]: "Archived",
};

export const HUB_AUDIENCE_LABELS: Record<HubAudienceType, string> = {
  [HubAudienceType.ALL_MEMBERS]: "All Members",
  [HubAudienceType.VISITORS]: "Visitors",
  [HubAudienceType.HOUSEHOLDS]: "Households",
  [HubAudienceType.CELL_GROUPS]: "Cell Groups",
  [HubAudienceType.VOLUNTEERS]: "Volunteers",
  [HubAudienceType.MINISTRY]: "Specific Ministry",
  [HubAudienceType.EVENT_REGISTRANTS]: "Event Registrants",
  [HubAudienceType.CUSTOM]: "Custom Filter",
};

export const HUB_TRIGGER_LABELS: Record<HubAutomationTrigger, string> = {
  [HubAutomationTrigger.NEW_VISITOR]: "New Visitor",
  [HubAutomationTrigger.BIRTHDAY]: "Birthday",
  [HubAutomationTrigger.ANNIVERSARY]: "Anniversary",
  [HubAutomationTrigger.EVENT_REMINDER]: "Event Reminder",
  [HubAutomationTrigger.VOLUNTEER_ASSIGNMENT]: "Volunteer Assignment",
  [HubAutomationTrigger.ATTENDANCE_MISSED]: "Attendance Missed",
  [HubAutomationTrigger.PRAYER_ASSIGNED]: "Prayer Assigned",
  [HubAutomationTrigger.MEMBERSHIP_APPROVED]: "Membership Approved",
  [HubAutomationTrigger.FOLLOW_UP_TASK_DUE]: "Follow-up Task Due",
};

export const HUB_DELIVERY_LABELS: Record<HubDeliveryStatus, string> = {
  [HubDeliveryStatus.PENDING]: "Pending",
  [HubDeliveryStatus.SENT]: "Sent",
  [HubDeliveryStatus.DELIVERED]: "Delivered",
  [HubDeliveryStatus.OPENED]: "Opened",
  [HubDeliveryStatus.CLICKED]: "Clicked",
  [HubDeliveryStatus.FAILED]: "Failed",
  [HubDeliveryStatus.BOUNCED]: "Bounced",
};

export const TEMPLATE_VARIABLES = [
  "FirstName",
  "LastName",
  "FamilyName",
  "EventName",
  "ServiceTime",
  "ChurchName",
  "Campus",
  "MinistryName",
  "LeaderName",
] as const;

export type TemplateVariable = (typeof TEMPLATE_VARIABLES)[number];
