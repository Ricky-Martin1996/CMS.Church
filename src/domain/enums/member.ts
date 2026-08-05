export enum MemberStatus {
  ACTIVE = "ACTIVE",
  VISITOR = "VISITOR",
  INACTIVE = "INACTIVE",
  NEW_MEMBER = "NEW_MEMBER",
  TRANSFERRED = "TRANSFERRED",
  DECEASED = "DECEASED",
}

export enum MemberLifecycle {
  PROSPECT = "PROSPECT",
  VISITOR = "VISITOR",
  REGULAR = "REGULAR",
  MEMBER = "MEMBER",
  LEADER = "LEADER",
  ALUMNI = "ALUMNI",
}

export enum Gender {
  FEMALE = "FEMALE",
  MALE = "MALE",
  OTHER = "OTHER",
  PREFER_NOT_TO_SAY = "PREFER_NOT_TO_SAY",
}

export enum MaritalStatus {
  SINGLE = "SINGLE",
  MARRIED = "MARRIED",
  WIDOWED = "WIDOWED",
  DIVORCED = "DIVORCED",
  SEPARATED = "SEPARATED",
  UNKNOWN = "UNKNOWN",
}

export enum NoteVisibility {
  PRIVATE = "PRIVATE",
  PASTORAL = "PASTORAL",
  LEADER = "LEADER",
}

export enum DocumentType {
  ID = "ID",
  CERTIFICATE = "CERTIFICATE",
  BAPTISM = "BAPTISM",
  MEMBERSHIP = "MEMBERSHIP",
  OTHER = "OTHER",
}

export enum ActivityType {
  CREATED = "CREATED",
  EDITED = "EDITED",
  VISITED = "VISITED",
  ATTENDED = "ATTENDED",
  PRAYER_REQUESTED = "PRAYER_REQUESTED",
  BAPTIZED = "BAPTIZED",
  FOUNDATION_COURSE_COMPLETED = "FOUNDATION_COURSE_COMPLETED",
  VOLUNTEER_JOINED = "VOLUNTEER_JOINED",
  NOTE_ADDED = "NOTE_ADDED",
  DOCUMENT_UPLOADED = "DOCUMENT_UPLOADED",
  TAG_ADDED = "TAG_ADDED",
  TAG_REMOVED = "TAG_REMOVED",
  FAMILY_LINKED = "FAMILY_LINKED",
  EMAIL_SENT = "EMAIL_SENT",
  CALL_LOGGED = "CALL_LOGGED",
  WHATSAPP_SENT = "WHATSAPP_SENT",
  LEADER_ASSIGNED = "LEADER_ASSIGNED",
  STATUS_CHANGED = "STATUS_CHANGED",
  IMPORTED = "IMPORTED",
}

export enum FamilyRelation {
  HEAD = "HEAD",
  SPOUSE = "SPOUSE",
  CHILD = "CHILD",
  PARENT = "PARENT",
  SIBLING = "SIBLING",
  OTHER = "OTHER",
}

export enum AttendanceMethod {
  MANUAL = "MANUAL",
  QR = "QR",
  IMPORT = "IMPORT",
}

export enum PrayerStatus {
  OPEN = "OPEN",
  PRAYING = "PRAYING",
  ANSWERED = "ANSWERED",
  ARCHIVED = "ARCHIVED",
}

export enum VolunteerStatus {
  ACTIVE = "ACTIVE",
  PAUSED = "PAUSED",
  ENDED = "ENDED",
}

export const MEMBER_STATUS_LABELS: Record<MemberStatus, string> = {
  [MemberStatus.ACTIVE]: "Active",
  [MemberStatus.VISITOR]: "Visitor",
  [MemberStatus.INACTIVE]: "Inactive",
  [MemberStatus.NEW_MEMBER]: "New Member",
  [MemberStatus.TRANSFERRED]: "Transferred",
  [MemberStatus.DECEASED]: "Deceased",
};

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  [ActivityType.CREATED]: "Created",
  [ActivityType.EDITED]: "Edited",
  [ActivityType.VISITED]: "Visited",
  [ActivityType.ATTENDED]: "Attended",
  [ActivityType.PRAYER_REQUESTED]: "Prayer Requested",
  [ActivityType.BAPTIZED]: "Baptized",
  [ActivityType.FOUNDATION_COURSE_COMPLETED]: "Foundation Course Completed",
  [ActivityType.VOLUNTEER_JOINED]: "Volunteer Joined",
  [ActivityType.NOTE_ADDED]: "Note Added",
  [ActivityType.DOCUMENT_UPLOADED]: "Document Uploaded",
  [ActivityType.TAG_ADDED]: "Tag Added",
  [ActivityType.TAG_REMOVED]: "Tag Removed",
  [ActivityType.FAMILY_LINKED]: "Family Linked",
  [ActivityType.EMAIL_SENT]: "Email Sent",
  [ActivityType.CALL_LOGGED]: "Call Logged",
  [ActivityType.WHATSAPP_SENT]: "WhatsApp Sent",
  [ActivityType.LEADER_ASSIGNED]: "Leader Assigned",
  [ActivityType.STATUS_CHANGED]: "Status Changed",
  [ActivityType.IMPORTED]: "Imported",
};

export const FAMILY_RELATION_LABELS: Record<FamilyRelation, string> = {
  [FamilyRelation.HEAD]: "Family Head",
  [FamilyRelation.SPOUSE]: "Spouse",
  [FamilyRelation.CHILD]: "Child",
  [FamilyRelation.PARENT]: "Parent",
  [FamilyRelation.SIBLING]: "Sibling",
  [FamilyRelation.OTHER]: "Other",
};

export const NOTE_VISIBILITY_LABELS: Record<NoteVisibility, string> = {
  [NoteVisibility.PRIVATE]: "Private",
  [NoteVisibility.PASTORAL]: "Pastoral",
  [NoteVisibility.LEADER]: "Leader",
};

export const DEFAULT_TAGS = [
  { name: "Youth", slug: "youth", color: "#0284c7" },
  { name: "Volunteer", slug: "volunteer", color: "#0d9488" },
  { name: "Leader", slug: "leader", color: "#7c3aed" },
  { name: "Visitor", slug: "visitor", color: "#ea580c" },
  { name: "Baptized", slug: "baptized", color: "#2563eb" },
  { name: "New Member", slug: "new-member", color: "#16a34a" },
  { name: "Senior", slug: "senior", color: "#64748b" },
  { name: "Musician", slug: "musician", color: "#db2777" },
  { name: "Teacher", slug: "teacher", color: "#ca8a04" },
  { name: "Prayer Warrior", slug: "prayer-warrior", color: "#9333ea" },
] as const;
