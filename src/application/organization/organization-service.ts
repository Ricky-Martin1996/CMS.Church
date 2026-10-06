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

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: string }).code === "P2002"
  );
}

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
      try {
        organization = await organizationRepository.create({
          name: input.name,
          slug,
          clerkOrgId: input.clerkOrgId ?? null,
          imageUrl: input.imageUrl ?? null,
        });
      } catch (error) {
        // Race: another request inserted the same slug between find and create.
        // Map Prisma P2002 to a 409 instead of an unhandled 500.
        if (isUniqueConstraintError(error)) {
          throw conflict(
            "That church URL slug is already taken. Choose a different name or slug."
          );
        }
        throw error;
      }
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
