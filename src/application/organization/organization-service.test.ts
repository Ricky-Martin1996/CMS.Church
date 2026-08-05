import assert from "node:assert/strict";
import { after, describe, it } from "node:test";
import {
  ensureOrganizationWithOwner,
  syncClerkUser,
} from "@/application/organization/organization-service";
import { Role } from "@/domain/enums/role";
import { prisma } from "@/infrastructure/db/prisma";
import { AppError } from "@/server/errors";
import { handleRouteError } from "@/server/http";

/**
 * BUG-001 regression: creating a church must not surface as a generic 500.
 * Covers happy-path create + slug collision → 409 Conflict (not Prisma 500).
 */
describe("BUG-001 ensureOrganizationWithOwner", () => {
  after(async () => {
    await prisma.$disconnect();
  });

  it("creates an organization and CHURCH_ADMIN membership", async () => {
    const suffix = Date.now().toString(36);
    const user = await syncClerkUser({
      clerkUserId: `user_bug001_${suffix}`,
      email: `bug001-${suffix}@example.com`,
      firstName: "Bug",
      lastName: "001",
    });

    const result = await ensureOrganizationWithOwner({
      name: `Bug001 Church ${suffix}`,
      slug: `bug001-church-${suffix}`,
      ownerUserId: user.id,
      ownerRole: Role.CHURCH_ADMIN,
    });

    assert.equal(result.organization.slug, `bug001-church-${suffix}`);
    assert.equal(result.membership.userId, user.id);
    assert.equal(result.membership.organizationId, result.organization.id);
    assert.equal(result.membership.role, Role.CHURCH_ADMIN);
    assert.equal(result.membership.status, "ACTIVE");
  });

  it("maps slug collisions to AppError CONFLICT (not unhandled 500)", async () => {
    const suffix = Date.now().toString(36);
    const slug = `bug001-taken-${suffix}`;

    const owner = await syncClerkUser({
      clerkUserId: `user_bug001_owner_${suffix}`,
      email: `owner-${suffix}@example.com`,
    });
    await ensureOrganizationWithOwner({
      name: "Taken Church",
      slug,
      ownerUserId: owner.id,
      ownerRole: Role.CHURCH_ADMIN,
    });

    const other = await syncClerkUser({
      clerkUserId: `user_bug001_other_${suffix}`,
      email: `other-${suffix}@example.com`,
    });

    await assert.rejects(
      () =>
        ensureOrganizationWithOwner({
          name: "Taken Church",
          slug,
          ownerUserId: other.id,
          ownerRole: Role.CHURCH_ADMIN,
        }),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.code, "CONFLICT");
        assert.equal(error.status, 409);
        return true;
      }
    );

    const response = handleRouteError(
      new AppError(
        "That church URL slug is already taken. Choose a different name or slug.",
        "CONFLICT",
        409
      )
    );
    assert.equal(response.status, 409);
    const body = await response.json();
    assert.equal(body.error.code, "CONFLICT");
    assert.notEqual(body.error.message, "Internal server error");
  });

  it("idempotent re-onboard returns existing org for the same owner", async () => {
    const suffix = Date.now().toString(36);
    const slug = `bug001-idem-${suffix}`;
    const user = await syncClerkUser({
      clerkUserId: `user_bug001_idem_${suffix}`,
      email: `idem-${suffix}@example.com`,
    });

    const first = await ensureOrganizationWithOwner({
      name: "Idempotent Church",
      slug,
      ownerUserId: user.id,
      ownerRole: Role.CHURCH_ADMIN,
    });
    const second = await ensureOrganizationWithOwner({
      name: "Idempotent Church",
      slug,
      ownerUserId: user.id,
      ownerRole: Role.CHURCH_ADMIN,
    });

    assert.equal(first.organization.id, second.organization.id);
    assert.equal(first.membership.id, second.membership.id);
  });
});
