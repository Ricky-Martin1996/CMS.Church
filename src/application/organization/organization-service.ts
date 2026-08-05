import { Role } from "@/domain/enums/role";
import {
  membershipRepository,
  organizationRepository,
  userRepository,
} from "@/infrastructure/repositories";
import { slugify } from "@/lib/slug";

export type SyncClerkUserInput = {
  clerkUserId: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  imageUrl?: string | null;
};

export async function syncClerkUser(input: SyncClerkUserInput) {
  return userRepository.upsertFromClerk(input);
}

export type EnsureOrganizationInput = {
  name: string;
  slug?: string;
  clerkOrgId?: string | null;
  imageUrl?: string | null;
  ownerUserId: string;
  ownerRole?: Role;
};

export async function ensureOrganizationWithOwner(
  input: EnsureOrganizationInput
) {
  const slug = input.slug?.trim() || slugify(input.name);

  let organization = input.clerkOrgId
    ? await organizationRepository.findByClerkOrgId(input.clerkOrgId)
    : null;

  if (!organization) {
    const existingSlug = await organizationRepository.findBySlug(slug);
    if (existingSlug) {
      organization = existingSlug;
    } else {
      organization = await organizationRepository.create({
        name: input.name,
        slug,
        clerkOrgId: input.clerkOrgId ?? null,
        imageUrl: input.imageUrl ?? null,
      });
    }
  }

  const membership = await membershipRepository.upsert({
    userId: input.ownerUserId,
    organizationId: organization.id,
    role: input.ownerRole ?? Role.CHURCH_ADMIN,
  });

  return { organization, membership };
}

export async function listUserMemberships(userId: string) {
  return membershipRepository.listActiveForUser(userId);
}
