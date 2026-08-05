export enum VisitorPipelineStage {
  FIRST_VISIT = "FIRST_VISIT",
  WELCOME_SENT = "WELCOME_SENT",
  ASSIGNED_LEADER = "ASSIGNED_LEADER",
  CONTACTED = "CONTACTED",
  SECOND_VISIT = "SECOND_VISIT",
  CELL_GROUP_INVITED = "CELL_GROUP_INVITED",
  FOUNDATION_COURSE = "FOUNDATION_COURSE",
  MEMBERSHIP_INTERVIEW = "MEMBERSHIP_INTERVIEW",
  MEMBER = "MEMBER",
}

export enum FollowUpTaskType {
  CALL = "CALL",
  WHATSAPP = "WHATSAPP",
  EMAIL_WELCOME = "EMAIL_WELCOME",
  INVITE_SERVICE = "INVITE_SERVICE",
  INVITE_CELL = "INVITE_CELL",
  HOME_VISIT = "HOME_VISIT",
  CUSTOM = "CUSTOM",
}

export enum FollowUpTaskStatus {
  OPEN = "OPEN",
  IN_PROGRESS = "IN_PROGRESS",
  DONE = "DONE",
  CANCELLED = "CANCELLED",
  SNOOZED = "SNOOZED",
}

export enum FollowUpPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  URGENT = "URGENT",
}

export enum CommunicationChannel {
  PHONE = "PHONE",
  EMAIL = "EMAIL",
  WHATSAPP = "WHATSAPP",
  SMS = "SMS",
  IN_PERSON = "IN_PERSON",
  NOTE = "NOTE",
}

export enum CommunicationDirection {
  OUTBOUND = "OUTBOUND",
  INBOUND = "INBOUND",
}

export enum VisitorActivityType {
  CREATED = "CREATED",
  STAGE_CHANGED = "STAGE_CHANGED",
  LEADER_ASSIGNED = "LEADER_ASSIGNED",
  TASK_CREATED = "TASK_CREATED",
  TASK_COMPLETED = "TASK_COMPLETED",
  COMMUNICATION = "COMMUNICATION",
  ATTENDED = "ATTENDED",
  NOTE_ADDED = "NOTE_ADDED",
  CONVERTED = "CONVERTED",
  AUTOMATION = "AUTOMATION",
}

export const VISITOR_PIPELINE_ORDER: VisitorPipelineStage[] = [
  VisitorPipelineStage.FIRST_VISIT,
  VisitorPipelineStage.WELCOME_SENT,
  VisitorPipelineStage.ASSIGNED_LEADER,
  VisitorPipelineStage.CONTACTED,
  VisitorPipelineStage.SECOND_VISIT,
  VisitorPipelineStage.CELL_GROUP_INVITED,
  VisitorPipelineStage.FOUNDATION_COURSE,
  VisitorPipelineStage.MEMBERSHIP_INTERVIEW,
  VisitorPipelineStage.MEMBER,
];

export const VISITOR_PIPELINE_LABELS: Record<VisitorPipelineStage, string> = {
  [VisitorPipelineStage.FIRST_VISIT]: "First Visit",
  [VisitorPipelineStage.WELCOME_SENT]: "Welcome Sent",
  [VisitorPipelineStage.ASSIGNED_LEADER]: "Assigned Leader",
  [VisitorPipelineStage.CONTACTED]: "Contacted",
  [VisitorPipelineStage.SECOND_VISIT]: "Second Visit",
  [VisitorPipelineStage.CELL_GROUP_INVITED]: "Cell Group Invited",
  [VisitorPipelineStage.FOUNDATION_COURSE]: "Foundation Course",
  [VisitorPipelineStage.MEMBERSHIP_INTERVIEW]: "Membership Interview",
  [VisitorPipelineStage.MEMBER]: "Member",
};

export const FOLLOW_UP_TASK_TYPE_LABELS: Record<FollowUpTaskType, string> = {
  [FollowUpTaskType.CALL]: "Call visitor",
  [FollowUpTaskType.WHATSAPP]: "Send WhatsApp",
  [FollowUpTaskType.EMAIL_WELCOME]: "Email welcome",
  [FollowUpTaskType.INVITE_SERVICE]: "Invite to next service",
  [FollowUpTaskType.INVITE_CELL]: "Invite to cell group",
  [FollowUpTaskType.HOME_VISIT]: "Schedule home visit",
  [FollowUpTaskType.CUSTOM]: "Custom task",
};

export const FOLLOW_UP_STATUS_LABELS: Record<FollowUpTaskStatus, string> = {
  [FollowUpTaskStatus.OPEN]: "Open",
  [FollowUpTaskStatus.IN_PROGRESS]: "In progress",
  [FollowUpTaskStatus.DONE]: "Done",
  [FollowUpTaskStatus.CANCELLED]: "Cancelled",
  [FollowUpTaskStatus.SNOOZED]: "Snoozed",
};

export const FOLLOW_UP_PRIORITY_LABELS: Record<FollowUpPriority, string> = {
  [FollowUpPriority.LOW]: "Low",
  [FollowUpPriority.MEDIUM]: "Medium",
  [FollowUpPriority.HIGH]: "High",
  [FollowUpPriority.URGENT]: "Urgent",
};

export const COMMUNICATION_CHANNEL_LABELS: Record<CommunicationChannel, string> = {
  [CommunicationChannel.PHONE]: "Phone",
  [CommunicationChannel.EMAIL]: "Email",
  [CommunicationChannel.WHATSAPP]: "WhatsApp",
  [CommunicationChannel.SMS]: "SMS",
  [CommunicationChannel.IN_PERSON]: "In person",
  [CommunicationChannel.NOTE]: "Note",
};

/** Default stage configs seeded per organization (automation-ready). */
export const DEFAULT_VISITOR_STAGE_CONFIGS: Array<{
  stageKey: VisitorPipelineStage;
  label: string;
  sortOrder: number;
  autoTaskTypes: FollowUpTaskType[];
  slaHours: number | null;
}> = [
  {
    stageKey: VisitorPipelineStage.FIRST_VISIT,
    label: "First Visit",
    sortOrder: 10,
    autoTaskTypes: [FollowUpTaskType.EMAIL_WELCOME, FollowUpTaskType.CALL],
    slaHours: 48,
  },
  {
    stageKey: VisitorPipelineStage.WELCOME_SENT,
    label: "Welcome Sent",
    sortOrder: 20,
    autoTaskTypes: [FollowUpTaskType.WHATSAPP],
    slaHours: 72,
  },
  {
    stageKey: VisitorPipelineStage.ASSIGNED_LEADER,
    label: "Assigned Leader",
    sortOrder: 30,
    autoTaskTypes: [FollowUpTaskType.CALL],
    slaHours: 48,
  },
  {
    stageKey: VisitorPipelineStage.CONTACTED,
    label: "Contacted",
    sortOrder: 40,
    autoTaskTypes: [FollowUpTaskType.INVITE_SERVICE],
    slaHours: 168,
  },
  {
    stageKey: VisitorPipelineStage.SECOND_VISIT,
    label: "Second Visit",
    sortOrder: 50,
    autoTaskTypes: [FollowUpTaskType.INVITE_CELL],
    slaHours: 168,
  },
  {
    stageKey: VisitorPipelineStage.CELL_GROUP_INVITED,
    label: "Cell Group Invited",
    sortOrder: 60,
    autoTaskTypes: [FollowUpTaskType.HOME_VISIT],
    slaHours: 336,
  },
  {
    stageKey: VisitorPipelineStage.FOUNDATION_COURSE,
    label: "Foundation Course",
    sortOrder: 70,
    autoTaskTypes: [],
    slaHours: 720,
  },
  {
    stageKey: VisitorPipelineStage.MEMBERSHIP_INTERVIEW,
    label: "Membership Interview",
    sortOrder: 80,
    autoTaskTypes: [FollowUpTaskType.CALL],
    slaHours: 336,
  },
  {
    stageKey: VisitorPipelineStage.MEMBER,
    label: "Member",
    sortOrder: 90,
    autoTaskTypes: [],
    slaHours: null,
  },
];
