export enum Role {
  SUPER_ADMIN = "SUPER_ADMIN",
  CHURCH_ADMIN = "CHURCH_ADMIN",
  PASTOR = "PASTOR",
  CELL_LEADER = "CELL_LEADER",
  VOLUNTEER_LEADER = "VOLUNTEER_LEADER",
  FINANCE_MANAGER = "FINANCE_MANAGER",
  MEMBER = "MEMBER",
  GUEST = "GUEST",
}

export enum MembershipStatus {
  ACTIVE = "ACTIVE",
  INVITED = "INVITED",
  SUSPENDED = "SUSPENDED",
}

export const ROLE_LABELS: Record<Role, string> = {
  [Role.SUPER_ADMIN]: "Super Admin",
  [Role.CHURCH_ADMIN]: "Church Admin",
  [Role.PASTOR]: "Pastor",
  [Role.CELL_LEADER]: "Cell Leader",
  [Role.VOLUNTEER_LEADER]: "Volunteer Leader",
  [Role.FINANCE_MANAGER]: "Finance Manager",
  [Role.MEMBER]: "Member",
  [Role.GUEST]: "Guest",
};

export const ALL_ROLES = Object.values(Role);
