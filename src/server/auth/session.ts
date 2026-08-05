import { auth, currentUser } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import type { TenantContext } from "@/domain/entities/tenant";
import type { Permission } from "@/domain/permissions/rbac";
import {
  roleHasAllPermissions,
  roleHasAnyPermission,
  roleHasPermission,
} from "@/domain/permissions/rbac";
import { Role } from "@/domain/enums/role";
import {
  ensureOrganizationWithOwner,
  listUserMemberships,
  syncClerkUser,
} from "@/application/organization/organization-service";
import { membershipRepository } from "@/infrastructure/repositories";
import {
  ACTIVE_ORG_COOKIE,
  forbidden,
  unauthorized,
} from "@/server/errors";
import { cache } from "@/server/cache";

async function resolveActiveOrganizationId(
  userId: string,
  memberships: Awaited<ReturnType<typeof listUserMemberships>>
): Promise<string | null> {
  if (memberships.length === 0) return null;

  const cookieStore = await cookies();
  const cookieOrgId = cookieStore.get(ACTIVE_ORG_COOKIE)?.value;

  if (cookieOrgId) {
    const match = memberships.find((m) => m.organizationId === cookieOrgId);
    if (match) return match.organizationId;
  }

  // Prefer Clerk active org when linked
  const session = await auth();
  if (session.orgId) {
    const byClerk = memberships.find(
      (m) => m.organization.clerkOrgId === session.orgId
    );
    if (byClerk) return byClerk.organizationId;
  }

  return memberships[0]?.organizationId ?? null;
}

/**
 * Ensures the Clerk user exists in our database and returns the domain user.
 * Request-memoized so layout + page + actions don't triple-upsert.
 */
export const requireDbUser = cache(async () => {
  const clerk = await currentUser();
  if (!clerk) throw unauthorized();

  const primaryEmail =
    clerk.emailAddresses.find((e) => e.id === clerk.primaryEmailAddressId)
      ?.emailAddress ?? clerk.emailAddresses[0]?.emailAddress;

  if (!primaryEmail) {
    throw unauthorized("Clerk user is missing an email address");
  }

  return syncClerkUser({
    clerkUserId: clerk.id,
    email: primaryEmail,
    firstName: clerk.firstName,
    lastName: clerk.lastName,
    imageUrl: clerk.imageUrl,
  });
});

/**
 * Optional session helper — returns null when signed out.
 */
export async function getSessionUser() {
  const { userId } = await auth();
  if (!userId) return null;
  try {
    return await requireDbUser();
  } catch {
    return null;
  }
}

/**
 * Resolves the active tenant context for the signed-in user.
 * Throws when unauthenticated or when no organization membership exists.
 * Request-memoized across layout, RSC pages, and nested calls.
 */
export const requireTenantContext = cache(async (): Promise<TenantContext> => {
  const user = await requireDbUser();
  const memberships = await listUserMemberships(user.id);

  if (memberships.length === 0) {
    throw forbidden("No organization membership. Complete onboarding first.");
  }

  const organizationId = await resolveActiveOrganizationId(user.id, memberships);
  const active = memberships.find((m) => m.organizationId === organizationId);

  if (!active) {
    throw forbidden("Active organization is not accessible");
  }

  return {
    user,
    organization: active.organization,
    membership: active,
    role: active.role,
  };
});

export async function requirePermission(permission: Permission) {
  const ctx = await requireTenantContext();
  if (!roleHasPermission(ctx.role, permission)) {
    throw forbidden(`Missing permission: ${permission}`);
  }
  return ctx;
}

export async function requireAnyPermission(permissions: Permission[]) {
  const ctx = await requireTenantContext();
  if (!roleHasAnyPermission(ctx.role, permissions)) {
    throw forbidden("Missing required permissions");
  }
  return ctx;
}

export async function requireAllPermissions(permissions: Permission[]) {
  const ctx = await requireTenantContext();
  if (!roleHasAllPermissions(ctx.role, permissions)) {
    throw forbidden("Missing required permissions");
  }
  return ctx;
}

export async function requireRole(...roles: Role[]) {
  const ctx = await requireTenantContext();
  if (!roles.includes(ctx.role)) {
    throw forbidden(`Requires one of roles: ${roles.join(", ")}`);
  }
  return ctx;
}

/**
 * Switches the active organization for the current user (cookie-based).
 */
export async function switchActiveOrganization(organizationId: string) {
  const user = await requireDbUser();
  const membership = await membershipRepository.findByUserAndOrg(
    user.id,
    organizationId
  );

  if (!membership || membership.status !== "ACTIVE") {
    throw forbidden("You are not an active member of that organization");
  }

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_ORG_COOKIE, organizationId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  return membership;
}

/**
 * Creates a personal/default church org for first-time users (onboarding).
 */
export async function bootstrapPersonalOrganization(input: {
  churchName: string;
  slug?: string;
}) {
  const user = await requireDbUser();
  return ensureOrganizationWithOwner({
    name: input.churchName,
    slug: input.slug,
    ownerUserId: user.id,
    ownerRole: Role.CHURCH_ADMIN,
  });
}
