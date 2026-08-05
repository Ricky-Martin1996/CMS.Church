import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { Webhook } from "svix";
import type { WebhookEvent } from "@clerk/nextjs/server";
import { syncClerkUser } from "@/application/organization/organization-service";
import { prisma } from "@/infrastructure/db/prisma";
import { Role } from "@/domain/enums/role";
import { assertRateLimit, RateLimits } from "@/server/security/rate-limit";

export const runtime = "nodejs";

/** Roles that Clerk org membership sync is allowed to set/overwrite. */
const CLERK_SYNCABLE_ROLES = new Set<Role>([
  Role.CHURCH_ADMIN,
  Role.MEMBER,
  Role.GUEST,
]);

function mapClerkOrgRole(clerkRole: string): Role {
  return clerkRole === "org:admin" ? Role.CHURCH_ADMIN : Role.MEMBER;
}

/**
 * Preserve rich ChurchOS roles (PASTOR, CELL_LEADER, etc.) that Clerk cannot
 * represent. Only sync the coarse admin/member axis for syncable roles.
 */
function resolveSyncedRole(
  existingRole: Role | null,
  clerkRole: string
): Role {
  const mapped = mapClerkOrgRole(clerkRole);
  if (!existingRole) return mapped;
  if (!CLERK_SYNCABLE_ROLES.has(existingRole)) {
    // Keep PASTOR / FINANCE_MANAGER / etc.
    return existingRole;
  }
  return mapped;
}

export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CLERK_WEBHOOK_SECRET is not configured" },
      { status: 500 }
    );
  }

  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";
    assertRateLimit(`webhook:clerk:${ip}`, RateLimits.webhook);
  } catch {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  const payload = await req.text();
  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Missing svix headers" }, { status: 400 });
  }

  const wh = new Webhook(secret);
  let event: WebhookEvent;

  try {
    event = wh.verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;
  } catch (error) {
    console.error("[clerk webhook] verification failed", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "user.created":
    case "user.updated": {
      const user = event.data;
      const email =
        user.email_addresses.find((e) => e.id === user.primary_email_address_id)
          ?.email_address ?? user.email_addresses[0]?.email_address;

      if (email) {
        await syncClerkUser({
          clerkUserId: user.id,
          email,
          firstName: user.first_name,
          lastName: user.last_name,
          imageUrl: user.image_url,
        });
      }
      break;
    }
    case "user.deleted": {
      const id = event.data.id;
      if (id) {
        // Soft-deactivate instead of hard-delete to preserve audit/history FKs.
        const user = await prisma.user.findUnique({
          where: { clerkUserId: id },
        });
        if (user) {
          await prisma.membership.updateMany({
            where: { userId: user.id },
            data: { status: "SUSPENDED" },
          });
          await prisma.user.update({
            where: { id: user.id },
            data: {
              clerkUserId: `deleted_${id}`,
              email: `deleted+${id}@invalid.local`,
              firstName: null,
              lastName: null,
              imageUrl: null,
            },
          });
        }
      }
      break;
    }
    case "organization.created":
    case "organization.updated": {
      const org = event.data;
      const existing = await prisma.organization.findUnique({
        where: { clerkOrgId: org.id },
      });

      if (existing) {
        await prisma.organization.update({
          where: { id: existing.id },
          data: {
            name: org.name,
            slug: org.slug,
            imageUrl: org.image_url,
          },
        });
      } else {
        // Avoid slug collision takeover from webhook — append suffix if needed
        let slug = org.slug;
        const slugOwner = await prisma.organization.findUnique({
          where: { slug },
        });
        if (slugOwner && slugOwner.clerkOrgId !== org.id) {
          slug = `${org.slug}-${org.id.slice(-6)}`;
        }
        await prisma.organization.create({
          data: {
            clerkOrgId: org.id,
            name: org.name,
            slug,
            imageUrl: org.image_url,
          },
        });
      }
      break;
    }
    case "organizationMembership.created":
    case "organizationMembership.updated": {
      const membership = event.data;
      const clerkUserId = membership.public_user_data.user_id;
      const clerkOrgId = membership.organization.id;

      const user = await prisma.user.findUnique({ where: { clerkUserId } });
      let organization = await prisma.organization.findUnique({
        where: { clerkOrgId },
      });

      if (!organization) {
        let slug = membership.organization.slug;
        const slugOwner = await prisma.organization.findUnique({
          where: { slug },
        });
        if (slugOwner) {
          slug = `${slug}-${clerkOrgId.slice(-6)}`;
        }
        organization = await prisma.organization.create({
          data: {
            clerkOrgId,
            name: membership.organization.name,
            slug,
            imageUrl: membership.organization.image_url,
          },
        });
      }

      if (user && organization) {
        const existing = await prisma.membership.findUnique({
          where: {
            userId_organizationId: {
              userId: user.id,
              organizationId: organization.id,
            },
          },
        });

        const role = resolveSyncedRole(
          (existing?.role as Role | undefined) ?? null,
          membership.role
        );

        await prisma.membership.upsert({
          where: {
            userId_organizationId: {
              userId: user.id,
              organizationId: organization.id,
            },
          },
          create: {
            userId: user.id,
            organizationId: organization.id,
            role,
            status: "ACTIVE",
          },
          update: {
            role,
            status: "ACTIVE",
          },
        });
      }
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ ok: true });
}
