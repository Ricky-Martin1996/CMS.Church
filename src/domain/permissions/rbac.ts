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

  // People (reserved — not implemented yet)
  PEOPLE_READ: "people:read",
  PEOPLE_WRITE: "people:write",

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

  // Volunteers
  VOLUNTEERS_READ: "volunteers:read",
  VOLUNTEERS_WRITE: "volunteers:write",

  // Settings
  SETTINGS_READ: "settings:read",
  SETTINGS_WRITE: "settings:write",
} as const;

export type Permission = (typeof Permission)[keyof typeof Permission];

const ALL_PERMISSIONS = Object.values(Permission);

const MEMBER_BASE: Permission[] = [
  Permission.ORG_READ,
  Permission.PEOPLE_READ,
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
    Permission.EVENTS_READ,
    Permission.EVENTS_WRITE,
    Permission.GROUPS_READ,
    Permission.GROUPS_WRITE,
    Permission.GIVING_READ,
    Permission.GIVING_WRITE,
    Permission.FINANCE_REPORTS,
    Permission.VOLUNTEERS_READ,
    Permission.VOLUNTEERS_WRITE,
    Permission.SETTINGS_READ,
    Permission.SETTINGS_WRITE,
  ],

  [Role.PASTOR]: [
    ...MEMBER_BASE,
    Permission.PEOPLE_WRITE,
    Permission.EVENTS_READ,
    Permission.EVENTS_WRITE,
    Permission.GROUPS_READ,
    Permission.GROUPS_WRITE,
    Permission.GIVING_READ,
    Permission.VOLUNTEERS_READ,
    Permission.SETTINGS_WRITE,
  ],

  [Role.CELL_LEADER]: [
    ...MEMBER_BASE,
    Permission.GROUPS_WRITE,
    Permission.PEOPLE_READ,
    Permission.EVENTS_READ,
  ],

  [Role.VOLUNTEER_LEADER]: [
    ...MEMBER_BASE,
    Permission.VOLUNTEERS_READ,
    Permission.VOLUNTEERS_WRITE,
    Permission.EVENTS_READ,
    Permission.EVENTS_WRITE,
  ],

  [Role.FINANCE_MANAGER]: [
    ...MEMBER_BASE,
    Permission.GIVING_READ,
    Permission.GIVING_WRITE,
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
