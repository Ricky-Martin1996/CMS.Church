export enum MinistryStatus {
  ACTIVE = "ACTIVE",
  PAUSED = "PAUSED",
  ARCHIVED = "ARCHIVED",
}

export enum TrainingStatus {
  NOT_STARTED = "NOT_STARTED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  EXPIRED = "EXPIRED",
}

export enum ScheduleEventType {
  SUNDAY_SERVICE = "SUNDAY_SERVICE",
  CONFERENCE = "CONFERENCE",
  YOUTH_NIGHT = "YOUTH_NIGHT",
  PRAYER_MEETING = "PRAYER_MEETING",
  SPECIAL_EVENT = "SPECIAL_EVENT",
  OTHER = "OTHER",
}

export enum ScheduleAssignmentStatus {
  ASSIGNED = "ASSIGNED",
  CONFIRMED = "CONFIRMED",
  DECLINED = "DECLINED",
  CANCELLED = "CANCELLED",
  COMPLETED = "COMPLETED",
  NO_SHOW = "NO_SHOW",
}

export enum SwapRequestStatus {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  DECLINED = "DECLINED",
  CANCELLED = "CANCELLED",
}

export enum VolunteerCheckInStatus {
  CHECKED_IN = "CHECKED_IN",
  LATE = "LATE",
  ABSENT = "ABSENT",
  EXCUSED = "EXCUSED",
}

export enum VolunteerMessageChannel {
  EMAIL = "EMAIL",
  WHATSAPP = "WHATSAPP",
  SMS = "SMS",
  IN_APP = "IN_APP",
}

export enum VolunteerActivityType {
  CREATED = "CREATED",
  UPDATED = "UPDATED",
  ASSIGNED = "ASSIGNED",
  CONFIRMED = "CONFIRMED",
  DECLINED = "DECLINED",
  SWAP_REQUESTED = "SWAP_REQUESTED",
  SWAP_ACCEPTED = "SWAP_ACCEPTED",
  CHECKED_IN = "CHECKED_IN",
  MESSAGE_SENT = "MESSAGE_SENT",
  TRAINING_UPDATED = "TRAINING_UPDATED",
}

export enum Weekday {
  SUN = "SUN",
  MON = "MON",
  TUE = "TUE",
  WED = "WED",
  THU = "THU",
  FRI = "FRI",
  SAT = "SAT",
}

export const MINISTRY_STATUS_LABELS: Record<MinistryStatus, string> = {
  [MinistryStatus.ACTIVE]: "Active",
  [MinistryStatus.PAUSED]: "Paused",
  [MinistryStatus.ARCHIVED]: "Archived",
};

export const TRAINING_STATUS_LABELS: Record<TrainingStatus, string> = {
  [TrainingStatus.NOT_STARTED]: "Not started",
  [TrainingStatus.IN_PROGRESS]: "In progress",
  [TrainingStatus.COMPLETED]: "Completed",
  [TrainingStatus.EXPIRED]: "Expired",
};

export const SCHEDULE_EVENT_TYPE_LABELS: Record<ScheduleEventType, string> = {
  [ScheduleEventType.SUNDAY_SERVICE]: "Sunday Service",
  [ScheduleEventType.CONFERENCE]: "Conference",
  [ScheduleEventType.YOUTH_NIGHT]: "Youth Night",
  [ScheduleEventType.PRAYER_MEETING]: "Prayer Meeting",
  [ScheduleEventType.SPECIAL_EVENT]: "Special Event",
  [ScheduleEventType.OTHER]: "Other",
};

export const ASSIGNMENT_STATUS_LABELS: Record<ScheduleAssignmentStatus, string> = {
  [ScheduleAssignmentStatus.ASSIGNED]: "Assigned",
  [ScheduleAssignmentStatus.CONFIRMED]: "Confirmed",
  [ScheduleAssignmentStatus.DECLINED]: "Declined",
  [ScheduleAssignmentStatus.CANCELLED]: "Cancelled",
  [ScheduleAssignmentStatus.COMPLETED]: "Completed",
  [ScheduleAssignmentStatus.NO_SHOW]: "No show",
};

export const DEFAULT_MINISTRIES: Array<{
  name: string;
  slug: string;
  color: string;
  description: string;
  roles: string[];
}> = [
  {
    name: "Worship",
    slug: "worship",
    color: "#0d9488",
    description: "Music, vocals, and stage leadership",
    roles: ["Worship Leader", "Vocalist", "Instrumentalist"],
  },
  {
    name: "Media",
    slug: "media",
    color: "#0284c7",
    description: "Livestream, cameras, and graphics",
    roles: ["Camera", "Graphics", "Sound"],
  },
  {
    name: "Hospitality",
    slug: "hospitality",
    color: "#ea580c",
    description: "Greeting, ushering, and guest care",
    roles: ["Greeter", "Usher", "Cafe"],
  },
  {
    name: "Kids",
    slug: "kids",
    color: "#db2777",
    description: "Children's ministry and check-in",
    roles: ["Teacher", "Helper", "Check-in"],
  },
  {
    name: "Youth",
    slug: "youth",
    color: "#7c3aed",
    description: "Youth nights and discipleship",
    roles: ["Leader", "Small Group", "Games"],
  },
  {
    name: "Prayer",
    slug: "prayer",
    color: "#9333ea",
    description: "Prayer covering and altar ministry",
    roles: ["Prayer Team", "Altar Worker"],
  },
  {
    name: "Parking",
    slug: "parking",
    color: "#64748b",
    description: "Parking lot flow and safety",
    roles: ["Lot Lead", "Attendant"],
  },
  {
    name: "Security",
    slug: "security",
    color: "#475569",
    description: "Campus safety and emergency response",
    roles: ["Team Lead", "Floor Walker"],
  },
  {
    name: "Administration",
    slug: "administration",
    color: "#0f766e",
    description: "Ops, info desk, and coordination",
    roles: ["Info Desk", "Coordinator"],
  },
];
