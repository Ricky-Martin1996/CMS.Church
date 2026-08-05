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
  HUSBAND = "HUSBAND",
  WIFE = "WIFE",
  SPOUSE = "SPOUSE",
  SON = "SON",
  DAUGHTER = "DAUGHTER",
  CHILD = "CHILD",
  PARENT = "PARENT",
  GRANDPARENT = "GRANDPARENT",
  GUARDIAN = "GUARDIAN",
  SIBLING = "SIBLING",
  RELATIVE = "RELATIVE",
  OTHER = "OTHER",
}

export enum HouseholdStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  ARCHIVED = "ARCHIVED",
}

export enum HouseholdActivityType {
  CREATED = "CREATED",
  EDITED = "EDITED",
  MEMBER_ADDED = "MEMBER_ADDED",
  MEMBER_REMOVED = "MEMBER_REMOVED",
  MEMBER_MOVED = "MEMBER_MOVED",
  RELATION_CHANGED = "RELATION_CHANGED",
  HEAD_CHANGED = "HEAD_CHANGED",
  MERGED = "MERGED",
  SPLIT = "SPLIT",
  VISITED = "VISITED",
  EMAIL_SENT = "EMAIL_SENT",
  WHATSAPP_SENT = "WHATSAPP_SENT",
  PRAYER_REQUESTED = "PRAYER_REQUESTED",
  CELL_LEADER_ASSIGNED = "CELL_LEADER_ASSIGNED",
  HOME_VISIT_SCHEDULED = "HOME_VISIT_SCHEDULED",
  NOTE_ADDED = "NOTE_ADDED",
  DOCUMENT_UPLOADED = "DOCUMENT_UPLOADED",
  IMPORTED = "IMPORTED",
  STATUS_CHANGED = "STATUS_CHANGED",
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
  [FamilyRelation.HEAD]: "Head of Household",
  [FamilyRelation.HUSBAND]: "Husband",
  [FamilyRelation.WIFE]: "Wife",
  [FamilyRelation.SPOUSE]: "Spouse",
  [FamilyRelation.SON]: "Son",
  [FamilyRelation.DAUGHTER]: "Daughter",
  [FamilyRelation.CHILD]: "Child",
  [FamilyRelation.PARENT]: "Parent",
  [FamilyRelation.GRANDPARENT]: "Grandparent",
  [FamilyRelation.GUARDIAN]: "Guardian",
  [FamilyRelation.SIBLING]: "Sibling",
  [FamilyRelation.RELATIVE]: "Relative",
  [FamilyRelation.OTHER]: "Other",
};

export const HOUSEHOLD_STATUS_LABELS: Record<HouseholdStatus, string> = {
  [HouseholdStatus.ACTIVE]: "Active",
  [HouseholdStatus.INACTIVE]: "Inactive",
  [HouseholdStatus.ARCHIVED]: "Archived",
};

export const HOUSEHOLD_ACTIVITY_LABELS: Record<HouseholdActivityType, string> = {
  [HouseholdActivityType.CREATED]: "Created",
  [HouseholdActivityType.EDITED]: "Edited",
  [HouseholdActivityType.MEMBER_ADDED]: "Member Added",
  [HouseholdActivityType.MEMBER_REMOVED]: "Member Removed",
  [HouseholdActivityType.MEMBER_MOVED]: "Member Moved",
  [HouseholdActivityType.RELATION_CHANGED]: "Relation Changed",
  [HouseholdActivityType.HEAD_CHANGED]: "Head Changed",
  [HouseholdActivityType.MERGED]: "Merged",
  [HouseholdActivityType.SPLIT]: "Split",
  [HouseholdActivityType.VISITED]: "Visited",
  [HouseholdActivityType.EMAIL_SENT]: "Email Sent",
  [HouseholdActivityType.WHATSAPP_SENT]: "WhatsApp Sent",
  [HouseholdActivityType.PRAYER_REQUESTED]: "Prayer Requested",
  [HouseholdActivityType.CELL_LEADER_ASSIGNED]: "Cell Leader Assigned",
  [HouseholdActivityType.HOME_VISIT_SCHEDULED]: "Home Visit Scheduled",
  [HouseholdActivityType.NOTE_ADDED]: "Note Added",
  [HouseholdActivityType.DOCUMENT_UPLOADED]: "Document Uploaded",
  [HouseholdActivityType.IMPORTED]: "Imported",
  [HouseholdActivityType.STATUS_CHANGED]: "Status Changed",
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
