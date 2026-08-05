import type {
  MembershipEntity,
  MembershipWithOrganization,
  OrganizationEntity,
  UserEntity,
} from "@/domain/entities/tenant";
import type { MembershipStatus, Role } from "@/domain/enums/role";

export type UpsertUserInput = {
  clerkUserId: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  imageUrl?: string | null;
};

export type CreateOrganizationInput = {
  name: string;
  slug: string;
  clerkOrgId?: string | null;
  imageUrl?: string | null;
};

export interface UserRepository {
  findByClerkId(clerkUserId: string): Promise<UserEntity | null>;
  findById(id: string): Promise<UserEntity | null>;
  upsertFromClerk(input: UpsertUserInput): Promise<UserEntity>;
}

export interface OrganizationRepository {
  findById(id: string): Promise<OrganizationEntity | null>;
  findBySlug(slug: string): Promise<OrganizationEntity | null>;
  findByClerkOrgId(clerkOrgId: string): Promise<OrganizationEntity | null>;
  create(input: CreateOrganizationInput): Promise<OrganizationEntity>;
  listForUser(userId: string): Promise<OrganizationEntity[]>;
}

export interface MembershipRepository {
  findByUserAndOrg(
    userId: string,
    organizationId: string
  ): Promise<MembershipEntity | null>;
  listActiveForUser(userId: string): Promise<MembershipWithOrganization[]>;
  upsert(input: {
    userId: string;
    organizationId: string;
    role: Role;
    status?: MembershipStatus;
  }): Promise<MembershipEntity>;
}
