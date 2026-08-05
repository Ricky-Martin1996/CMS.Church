import { Role } from "@/domain/enums/role";

/**
 * Application permissions. Keep coarse for the SaaS foundation;
 * expand as modules (People, Giving, etc.) ship.
 */
export const Permission = {
  // Platform
  PLATFORM_MANAGE: "platform:manage",

  // Organization
  ORG_READ: "org:read",
  ORG_UPDATE: "org:update",
  ORG_BILLING: "org:billing",
  ORG_MEMBERS_MANAGE: "org:members:manage",
  ORG_ROLES_ASSIGN: "org:roles:assign",

  // People / CRM
  PEOPLE_READ: "people:read",
  PEOPLE_WRITE: "people:write",
  PEOPLE_EXPORT: "people:export",
  PEOPLE_IMPORT: "people:import",
  PEOPLE_NOTES_PRIVATE: "people:notes:private",
  PEOPLE_NOTES_PASTORAL: "people:notes:pastoral",
  PEOPLE_NOTES_LEADER: "people:notes:leader",
  PEOPLE_DOCUMENTS: "people:documents",
  PEOPLE_GIVING_VIEW: "people:giving:view",

  // Households / Families
  HOUSEHOLDS_READ: "households:read",
  HOUSEHOLDS_WRITE: "households:write",
  HOUSEHOLDS_DELETE: "households:delete",
  HOUSEHOLDS_MERGE: "households:merge",
  HOUSEHOLDS_EXPORT: "households:export",
  HOUSEHOLDS_IMPORT: "households:import",

  // Attendance & Check-in
  ATTENDANCE_READ: "attendance:read",
  ATTENDANCE_WRITE: "attendance:write",
  ATTENDANCE_MANAGE: "attendance:manage",
  ATTENDANCE_EXPORT: "attendance:export",
  ATTENDANCE_SESSIONS: "attendance:sessions",

  // Visitor Journey
  VISITOR_READ: "visitor:read",
  VISITOR_WRITE: "visitor:write",
  VISITOR_ASSIGN: "visitor:assign",
  VISITOR_COMMUNICATE: "visitor:communicate",
  VISITOR_CONVERT: "visitor:convert",

  // Events
  EVENTS_READ: "events:read",
  EVENTS_WRITE: "events:write",

  // Groups / cells
  GROUPS_READ: "groups:read",
  GROUPS_WRITE: "groups:write",

  // Giving / finance
  GIVING_READ: "giving:read",
  GIVING_WRITE: "giving:write",
  FINANCE_REPORTS: "finance:reports",

  // Volunteers (legacy coarse + ministry platform)
  VOLUNTEERS_READ: "volunteers:read",
  VOLUNTEERS_WRITE: "volunteers:write",
  MINISTRY_READ: "ministry:read",
  MINISTRY_WRITE: "ministry:write",
  VOLUNTEER_READ: "volunteer:read",
  VOLUNTEER_WRITE: "volunteer:write",
  SCHEDULE_MANAGE: "schedule:manage",

  // Settings
  SETTINGS_READ: "settings:read",
  SETTINGS_WRITE: "settings:write",
} as const;

export type Permission = (typeof Permission)[keyof typeof Permission];

const ALL_PERMISSIONS = Object.values(Permission);

const MEMBER_BASE: Permission[] = [
  Permission.ORG_READ,
  Permission.PEOPLE_READ,
  Permission.HOUSEHOLDS_READ,
  Permission.ATTENDANCE_READ,
  Permission.VISITOR_READ,
  Permission.MINISTRY_READ,
  Permission.VOLUNTEER_READ,
  Permission.EVENTS_READ,
  Permission.GROUPS_READ,
  Permission.SETTINGS_READ,
];

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  [Role.SUPER_ADMIN]: ALL_PERMISSIONS,

  [Role.CHURCH_ADMIN]: [
    Permission.ORG_READ,
    Permission.ORG_UPDATE,
    Permission.ORG_BILLING,
    Permission.ORG_MEMBERS_MANAGE,
    Permission.ORG_ROLES_ASSIGN,
    Permission.PEOPLE_READ,
    Permission.PEOPLE_WRITE,
    Permission.PEOPLE_EXPORT,
    Permission.PEOPLE_IMPORT,
    Permission.PEOPLE_NOTES_PRIVATE,
    Permission.PEOPLE_NOTES_PASTORAL,
    Permission.PEOPLE_NOTES_LEADER,
    Permission.PEOPLE_DOCUMENTS,
    Permission.PEOPLE_GIVING_VIEW,
    Permission.HOUSEHOLDS_READ,
    Permission.HOUSEHOLDS_WRITE,
    Permission.HOUSEHOLDS_DELETE,
    Permission.HOUSEHOLDS_MERGE,
    Permission.HOUSEHOLDS_EXPORT,
    Permission.HOUSEHOLDS_IMPORT,
    Permission.ATTENDANCE_READ,
    Permission.ATTENDANCE_WRITE,
    Permission.ATTENDANCE_MANAGE,
    Permission.ATTENDANCE_EXPORT,
    Permission.ATTENDANCE_SESSIONS,
    Permission.VISITOR_READ,
    Permission.VISITOR_WRITE,
    Permission.VISITOR_ASSIGN,
    Permission.VISITOR_COMMUNICATE,
    Permission.VISITOR_CONVERT,
    Permission.EVENTS_READ,
    Permission.EVENTS_WRITE,
    Permission.GROUPS_READ,
    Permission.GROUPS_WRITE,
    Permission.GIVING_READ,
    Permission.GIVING_WRITE,
    Permission.FINANCE_REPORTS,
    Permission.VOLUNTEERS_READ,
    Permission.VOLUNTEERS_WRITE,
    Permission.MINISTRY_READ,
    Permission.MINISTRY_WRITE,
    Permission.VOLUNTEER_READ,
    Permission.VOLUNTEER_WRITE,
    Permission.SCHEDULE_MANAGE,
    Permission.SETTINGS_READ,
    Permission.SETTINGS_WRITE,
  ],

  [Role.PASTOR]: [
    ...MEMBER_BASE,
    Permission.PEOPLE_WRITE,
    Permission.PEOPLE_EXPORT,
    Permission.PEOPLE_IMPORT,
    Permission.PEOPLE_NOTES_PRIVATE,
    Permission.PEOPLE_NOTES_PASTORAL,
    Permission.PEOPLE_NOTES_LEADER,
    Permission.PEOPLE_DOCUMENTS,
    Permission.PEOPLE_GIVING_VIEW,
    Permission.HOUSEHOLDS_READ,
    Permission.HOUSEHOLDS_WRITE,
    Permission.HOUSEHOLDS_DELETE,
    Permission.HOUSEHOLDS_MERGE,
    Permission.HOUSEHOLDS_EXPORT,
    Permission.HOUSEHOLDS_IMPORT,
    Permission.ATTENDANCE_WRITE,
    Permission.ATTENDANCE_MANAGE,
    Permission.ATTENDANCE_EXPORT,
    Permission.ATTENDANCE_SESSIONS,
    Permission.VISITOR_WRITE,
    Permission.VISITOR_ASSIGN,
    Permission.VISITOR_COMMUNICATE,
    Permission.VISITOR_CONVERT,
    Permission.EVENTS_READ,
    Permission.EVENTS_WRITE,
    Permission.GROUPS_READ,
    Permission.GROUPS_WRITE,
    Permission.GIVING_READ,
    Permission.VOLUNTEERS_READ,
    Permission.MINISTRY_READ,
    Permission.MINISTRY_WRITE,
    Permission.VOLUNTEER_READ,
    Permission.VOLUNTEER_WRITE,
    Permission.SCHEDULE_MANAGE,
    Permission.SETTINGS_WRITE,
  ],

  [Role.CELL_LEADER]: [
    ...MEMBER_BASE,
    Permission.GROUPS_WRITE,
    Permission.PEOPLE_READ,
    Permission.PEOPLE_NOTES_LEADER,
    Permission.PEOPLE_DOCUMENTS,
    Permission.HOUSEHOLDS_READ,
    Permission.HOUSEHOLDS_WRITE,
    Permission.ATTENDANCE_WRITE,
    Permission.ATTENDANCE_SESSIONS,
    Permission.VISITOR_WRITE,
    Permission.VISITOR_ASSIGN,
    Permission.VISITOR_COMMUNICATE,
    Permission.EVENTS_READ,
  ],

  [Role.VOLUNTEER_LEADER]: [
    ...MEMBER_BASE,
    Permission.VOLUNTEERS_READ,
    Permission.VOLUNTEERS_WRITE,
    Permission.MINISTRY_READ,
    Permission.MINISTRY_WRITE,
    Permission.VOLUNTEER_READ,
    Permission.VOLUNTEER_WRITE,
    Permission.SCHEDULE_MANAGE,
    Permission.PEOPLE_NOTES_LEADER,
    Permission.ATTENDANCE_WRITE,
    Permission.ATTENDANCE_SESSIONS,
    Permission.EVENTS_READ,
    Permission.EVENTS_WRITE,
  ],

  [Role.FINANCE_MANAGER]: [
    ...MEMBER_BASE,
    Permission.GIVING_READ,
    Permission.GIVING_WRITE,
    Permission.PEOPLE_GIVING_VIEW,
    Permission.PEOPLE_EXPORT,
    Permission.HOUSEHOLDS_READ,
    Permission.HOUSEHOLDS_EXPORT,
    Permission.FINANCE_REPORTS,
    Permission.ORG_BILLING,
  ],

  [Role.MEMBER]: MEMBER_BASE,

  [Role.GUEST]: [
    Permission.ORG_READ,
    Permission.EVENTS_READ,
  ],
};

export function permissionsForRole(role: Role): readonly Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function roleHasPermission(role: Role, permission: Permission): boolean {
  return permissionsForRole(role).includes(permission);
}

export function roleHasAnyPermission(
  role: Role,
  permissions: Permission[]
): boolean {
  return permissions.some((p) => roleHasPermission(role, p));
}

export function roleHasAllPermissions(
  role: Role,
  permissions: Permission[]
): boolean {
  return permissions.every((p) => roleHasPermission(role, p));
}
