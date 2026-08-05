export enum ChurchEventType {
  SUNDAY_SERVICE = "SUNDAY_SERVICE",
  YOUTH_SERVICE = "YOUTH_SERVICE",
  PRAYER_MEETING = "PRAYER_MEETING",
  BIBLE_STUDY = "BIBLE_STUDY",
  CELL_GROUP = "CELL_GROUP",
  CONFERENCE = "CONFERENCE",
  RETREAT = "RETREAT",
  WEDDING = "WEDDING",
  FUNERAL = "FUNERAL",
  OUTREACH = "OUTREACH",
  TRAINING = "TRAINING",
  CHILDREN_EVENT = "CHILDREN_EVENT",
  VOLUNTEER_MEETING = "VOLUNTEER_MEETING",
  CUSTOM = "CUSTOM",
}

export enum ChurchEventStatus {
  DRAFT = "DRAFT",
  PUBLISHED = "PUBLISHED",
  CANCELLED = "CANCELLED",
  COMPLETED = "COMPLETED",
  ARCHIVED = "ARCHIVED",
}

export enum EventVisibility {
  PUBLIC = "PUBLIC",
  MEMBERS = "MEMBERS",
  INVITE_ONLY = "INVITE_ONLY",
  PRIVATE = "PRIVATE",
}

export enum RecurrenceFrequency {
  NONE = "NONE",
  DAILY = "DAILY",
  WEEKLY = "WEEKLY",
  BIWEEKLY = "BIWEEKLY",
  MONTHLY = "MONTHLY",
  YEARLY = "YEARLY",
  CUSTOM = "CUSTOM",
}

export enum RegistrationStatus {
  REGISTERED = "REGISTERED",
  WAITLISTED = "WAITLISTED",
  CANCELLED = "CANCELLED",
  CHECKED_IN = "CHECKED_IN",
  NO_SHOW = "NO_SHOW",
}

export enum RegistrantType {
  MEMBER = "MEMBER",
  VISITOR = "VISITOR",
  HOUSEHOLD = "HOUSEHOLD",
  GUEST = "GUEST",
  GROUP = "GROUP",
}

export enum EventTicketStatus {
  VALID = "VALID",
  USED = "USED",
  REVOKED = "REVOKED",
  EXPIRED = "EXPIRED",
}

export enum EventResourceType {
  ROOM = "ROOM",
  EQUIPMENT = "EQUIPMENT",
  VEHICLE = "VEHICLE",
  OTHER = "OTHER",
}

export enum EventActivityType {
  CREATED = "CREATED",
  UPDATED = "UPDATED",
  PUBLISHED = "PUBLISHED",
  CANCELLED = "CANCELLED",
  REGISTRATION = "REGISTRATION",
  WAITLIST = "WAITLIST",
  CHECKED_IN = "CHECKED_IN",
  MESSAGE_QUEUED = "MESSAGE_QUEUED",
  VOLUNTEER_LINKED = "VOLUNTEER_LINKED",
  ATTACHMENT_ADDED = "ATTACHMENT_ADDED",
}

export enum EventMessageChannel {
  EMAIL = "EMAIL",
  WHATSAPP = "WHATSAPP",
  SMS = "SMS",
  PUSH = "PUSH",
  IN_APP = "IN_APP",
}

export const CHURCH_EVENT_TYPE_LABELS: Record<ChurchEventType, string> = {
  [ChurchEventType.SUNDAY_SERVICE]: "Sunday Service",
  [ChurchEventType.YOUTH_SERVICE]: "Youth Service",
  [ChurchEventType.PRAYER_MEETING]: "Prayer Meeting",
  [ChurchEventType.BIBLE_STUDY]: "Bible Study",
  [ChurchEventType.CELL_GROUP]: "Cell Group",
  [ChurchEventType.CONFERENCE]: "Conference",
  [ChurchEventType.RETREAT]: "Retreat",
  [ChurchEventType.WEDDING]: "Wedding",
  [ChurchEventType.FUNERAL]: "Funeral",
  [ChurchEventType.OUTREACH]: "Outreach",
  [ChurchEventType.TRAINING]: "Training",
  [ChurchEventType.CHILDREN_EVENT]: "Children Event",
  [ChurchEventType.VOLUNTEER_MEETING]: "Volunteer Meeting",
  [ChurchEventType.CUSTOM]: "Custom",
};

export const CHURCH_EVENT_STATUS_LABELS: Record<ChurchEventStatus, string> = {
  [ChurchEventStatus.DRAFT]: "Draft",
  [ChurchEventStatus.PUBLISHED]: "Published",
  [ChurchEventStatus.CANCELLED]: "Cancelled",
  [ChurchEventStatus.COMPLETED]: "Completed",
  [ChurchEventStatus.ARCHIVED]: "Archived",
};

export const REGISTRATION_STATUS_LABELS: Record<RegistrationStatus, string> = {
  [RegistrationStatus.REGISTERED]: "Registered",
  [RegistrationStatus.WAITLISTED]: "Waitlisted",
  [RegistrationStatus.CANCELLED]: "Cancelled",
  [RegistrationStatus.CHECKED_IN]: "Checked in",
  [RegistrationStatus.NO_SHOW]: "No-show",
};

export const RECURRENCE_LABELS: Record<RecurrenceFrequency, string> = {
  [RecurrenceFrequency.NONE]: "Does not repeat",
  [RecurrenceFrequency.DAILY]: "Daily",
  [RecurrenceFrequency.WEEKLY]: "Weekly",
  [RecurrenceFrequency.BIWEEKLY]: "Every 2 weeks",
  [RecurrenceFrequency.MONTHLY]: "Monthly",
  [RecurrenceFrequency.YEARLY]: "Yearly",
  [RecurrenceFrequency.CUSTOM]: "Custom",
};

export const EVENT_MESSAGE_CHANNEL_LABELS: Record<EventMessageChannel, string> = {
  [EventMessageChannel.EMAIL]: "Email",
  [EventMessageChannel.WHATSAPP]: "WhatsApp",
  [EventMessageChannel.SMS]: "SMS",
  [EventMessageChannel.PUSH]: "Push",
  [EventMessageChannel.IN_APP]: "In-app",
};
