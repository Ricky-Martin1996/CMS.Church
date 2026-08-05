import { Role } from "@/domain/enums/role";
import {
  membershipRepository,
  organizationRepository,
  userRepository,
} from "@/infrastructure/repositories";
import { slugify } from "@/lib/slug";
import { conflict } from "@/server/errors";

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

/**
 * Creates (or links via Clerk org id) an organization and ensures the caller
 * is a member. Never joins an existing org solely because a slug collides —
 * that would allow organization takeover via onboarding.
 */
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
      // Only reuse when the caller already owns membership (idempotent re-onboard)
      const existingMembership = await membershipRepository.findByUserAndOrg(
        input.ownerUserId,
        existingSlug.id
      );
      if (existingMembership && existingMembership.status === "ACTIVE") {
        organization = existingSlug;
      } else {
        throw conflict(
          "That church URL slug is already taken. Choose a different name or slug."
        );
      }
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
