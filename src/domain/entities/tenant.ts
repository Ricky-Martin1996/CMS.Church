import type { MembershipStatus, Role } from "@/domain/enums/role";

export type UserEntity = {
  id: string;
  clerkUserId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
};

export type OrganizationEntity = {
  id: string;
  clerkOrgId: string | null;
  name: string;
  slug: string;
  imageUrl: string | null;
};

export type MembershipEntity = {
  id: string;
  userId: string;
  organizationId: string;
  role: Role;
  status: MembershipStatus;
};

export type MembershipWithOrganization = MembershipEntity & {
  organization: OrganizationEntity;
};

export type TenantContext = {
  user: UserEntity;
  organization: OrganizationEntity;
  membership: MembershipEntity;
  role: Role;
};
