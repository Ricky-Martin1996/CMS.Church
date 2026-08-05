import type {
  CreateOrganizationInput,
  MembershipRepository,
  OrganizationRepository,
  UpsertUserInput,
  UserRepository,
} from "@/application/ports/repositories";
import type {
  MembershipEntity,
  MembershipWithOrganization,
  OrganizationEntity,
  UserEntity,
} from "@/domain/entities/tenant";
import { MembershipStatus, Role } from "@/domain/enums/role";
import { prisma } from "@/infrastructure/db/prisma";
import type {
  Membership as PrismaMembership,
  Organization as PrismaOrganization,
  User as PrismaUser,
  Role as PrismaRole,
  MembershipStatus as PrismaMembershipStatus,
} from "@prisma/client";

function mapUser(user: PrismaUser): UserEntity {
  return {
    id: user.id,
    clerkUserId: user.clerkUserId,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    imageUrl: user.imageUrl,
  };
}

function mapOrg(org: PrismaOrganization): OrganizationEntity {
  return {
    id: org.id,
    clerkOrgId: org.clerkOrgId,
    name: org.name,
    slug: org.slug,
    imageUrl: org.imageUrl,
  };
}

function mapMembership(m: PrismaMembership): MembershipEntity {
  return {
    id: m.id,
    userId: m.userId,
    organizationId: m.organizationId,
    role: m.role as Role,
    status: m.status as MembershipStatus,
  };
}

export const userRepository: UserRepository = {
  async findByClerkId(clerkUserId) {
    const user = await prisma.user.findUnique({ where: { clerkUserId } });
    return user ? mapUser(user) : null;
  },

  async findById(id) {
    const user = await prisma.user.findUnique({ where: { id } });
    return user ? mapUser(user) : null;
  },

  async upsertFromClerk(input: UpsertUserInput) {
    const user = await prisma.user.upsert({
      where: { clerkUserId: input.clerkUserId },
      create: {
        clerkUserId: input.clerkUserId,
        email: input.email,
        firstName: input.firstName ?? null,
        lastName: input.lastName ?? null,
        imageUrl: input.imageUrl ?? null,
      },
      update: {
        email: input.email,
        firstName: input.firstName ?? null,
        lastName: input.lastName ?? null,
        imageUrl: input.imageUrl ?? null,
      },
    });
    return mapUser(user);
  },
};

export const organizationRepository: OrganizationRepository = {
  async findById(id) {
    const org = await prisma.organization.findUnique({ where: { id } });
    return org ? mapOrg(org) : null;
  },

  async findBySlug(slug) {
    const org = await prisma.organization.findUnique({ where: { slug } });
    return org ? mapOrg(org) : null;
  },

  async findByClerkOrgId(clerkOrgId) {
    const org = await prisma.organization.findUnique({ where: { clerkOrgId } });
    return org ? mapOrg(org) : null;
  },

  async create(input: CreateOrganizationInput) {
    const org = await prisma.organization.create({
      data: {
        name: input.name,
        slug: input.slug,
        clerkOrgId: input.clerkOrgId ?? null,
        imageUrl: input.imageUrl ?? null,
      },
    });
    return mapOrg(org);
  },

  async listForUser(userId) {
    const rows = await prisma.membership.findMany({
      where: { userId, status: "ACTIVE" },
      include: { organization: true },
      orderBy: { createdAt: "asc" },
    });
    return rows.map((r) => mapOrg(r.organization));
  },
};

export { memberRepository } from "@/infrastructure/repositories/member-repository";
export {
  activityRepository,
  attendanceRepository,
  documentRepository,
  familyRepository,
  givingRepository,
  listPreferenceRepository,
  noteRepository,
  prayerRepository,
  savedFilterRepository,
  tagRepository,
  volunteerRepository,
} from "@/infrastructure/repositories/crm-repositories";
export { householdRepository } from "@/infrastructure/repositories/household-repository";
export {
  householdActivityRepository,
  householdDocumentRepository,
  householdListPreferenceRepository,
  householdNoteRepository,
  householdSavedFilterRepository,
} from "@/infrastructure/repositories/household-supporting";
export {
  attendanceSessionRepository,
  attendanceRecordRepository,
  visitorRepository,
} from "@/infrastructure/repositories/attendance-repository";

export const membershipRepository: MembershipRepository = {
  async findByUserAndOrg(userId, organizationId) {
    const m = await prisma.membership.findUnique({
      where: {
        userId_organizationId: { userId, organizationId },
      },
    });
    return m ? mapMembership(m) : null;
  },

  async listActiveForUser(userId): Promise<MembershipWithOrganization[]> {
    const rows = await prisma.membership.findMany({
      where: { userId, status: "ACTIVE" },
      include: { organization: true },
      orderBy: { createdAt: "asc" },
    });
    return rows.map((r) => ({
      ...mapMembership(r),
      organization: mapOrg(r.organization),
    }));
  },

  async upsert(input) {
    const m = await prisma.membership.upsert({
      where: {
        userId_organizationId: {
          userId: input.userId,
          organizationId: input.organizationId,
        },
      },
      create: {
        userId: input.userId,
        organizationId: input.organizationId,
        role: input.role as PrismaRole,
        status: (input.status ?? MembershipStatus.ACTIVE) as PrismaMembershipStatus,
      },
      update: {
        role: input.role as PrismaRole,
        status: (input.status ?? MembershipStatus.ACTIVE) as PrismaMembershipStatus,
      },
    });
    return mapMembership(m);
  },
};
