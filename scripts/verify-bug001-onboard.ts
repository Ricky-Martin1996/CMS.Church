/**
 * Manual BUG-001 verification for POST /api/organizations/onboard.
 * Mocks Clerk and invokes the route handler directly.
 *
 * Before the fix, cookies() from next/headers threw
 * "cookies was called outside a request scope" → 500 Internal server error
 * after the organization was already inserted.
 *
 * After the fix, the handler sets the cookie on NextResponse and returns 201.
 */
import { NextRequest } from "next/server";
import Module from "node:module";

process.env.DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/churchos?schema=public";

const clerkUserId = `user_bug001_manual_${Date.now().toString(36)}`;

type NodeModuleLoad = (
  request: string,
  parent: NodeModule | undefined,
  isMain: boolean
) => unknown;

const moduleWithLoad = Module as unknown as { _load: NodeModuleLoad };
const originalLoad = moduleWithLoad._load;
moduleWithLoad._load = function (
  request: string,
  parent: NodeModule | undefined,
  isMain: boolean
) {
  if (request === "@clerk/nextjs/server") {
    return {
      auth: async () => ({ userId: clerkUserId, orgId: null }),
      currentUser: async () => ({
        id: clerkUserId,
        firstName: "Manual",
        lastName: "Verify",
        imageUrl: null,
        primaryEmailAddressId: "email_1",
        emailAddresses: [
          { id: "email_1", emailAddress: `${clerkUserId}@example.com` },
        ],
      }),
    };
  }
  return originalLoad(request, parent, isMain);
};

async function main() {
  const { POST } = await import("@/app/api/organizations/onboard/route");
  const { prisma } = await import("@/infrastructure/db/prisma");
  const { ACTIVE_ORG_COOKIE } = await import("@/server/errors");

  const slug = `manual-verify-${Date.now().toString(36)}`;
  const req = new NextRequest(
    "http://localhost:3000/api/organizations/onboard",
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "http://localhost:3000",
      },
      body: JSON.stringify({
        churchName: "Manual Verify Church",
        slug,
      }),
    }
  );

  const res = await POST(req);
  const body = await res.json();
  const setCookie = res.headers.get("set-cookie") ?? "";

  console.log("status", res.status);
  console.log("body", JSON.stringify(body, null, 2));
  console.log("set-cookie", setCookie);

  if (res.status !== 201) {
    throw new Error(`Expected 201, got ${res.status}`);
  }
  if (body?.error?.message === "Internal server error") {
    throw new Error("BUG-001 still returning Internal server error");
  }
  if (!body?.organization?.id || body.organization.slug !== slug) {
    throw new Error("Organization missing from response");
  }
  if (!setCookie.includes(ACTIVE_ORG_COOKIE)) {
    throw new Error(`Missing ${ACTIVE_ORG_COOKIE} on Set-Cookie`);
  }

  const row = await prisma.organization.findUnique({ where: { slug } });
  if (!row) throw new Error("Organization not persisted");

  console.log("BUG-001 manual verification PASSED");
  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error("BUG-001 manual verification FAILED", error);
  try {
    const { prisma } = await import("@/infrastructure/db/prisma");
    await prisma.$disconnect();
  } catch {
    // ignore
  }
  process.exit(1);
});
