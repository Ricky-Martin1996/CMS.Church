import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { Webhook } from "svix";
import type { WebhookEvent } from "@clerk/nextjs/server";
import { syncClerkUser } from "@/application/organization/organization-service";
import { prisma } from "@/infrastructure/db/prisma";
import { Role } from "@/domain/enums/role";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CLERK_WEBHOOK_SECRET is not configured" },
      { status: 500 }
    );
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
        await prisma.user.deleteMany({ where: { clerkUserId: id } });
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
        await prisma.organization.create({
          data: {
            clerkOrgId: org.id,
            name: org.name,
            slug: org.slug,
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
        organization = await prisma.organization.create({
          data: {
            clerkOrgId,
            name: membership.organization.name,
            slug: membership.organization.slug,
            imageUrl: membership.organization.image_url,
          },
        });
      }

      if (user && organization) {
        const role =
          membership.role === "org:admin" ? Role.CHURCH_ADMIN : Role.MEMBER;
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
          },
          update: { role },
        });
      }
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ ok: true });
}
