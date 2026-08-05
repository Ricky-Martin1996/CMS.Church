import { z } from "zod";
import {
  requireDbUser,
  requireTenantContext,
  switchActiveOrganization,
} from "@/server/auth/session";
import { handleRouteError, jsonOk } from "@/server/http";
import { listUserMemberships } from "@/application/organization/organization-service";
import { assertSameOrigin } from "@/server/security/csrf";
import { assertRateLimit, RateLimits } from "@/server/security/rate-limit";

const switchSchema = z.object({
  organizationId: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const user = await requireDbUser();
    assertRateLimit(`org-switch:${user.id}`, RateLimits.apiWrite);
    const body = switchSchema.parse(await req.json());
    const membership = await switchActiveOrganization(body.organizationId);
    return jsonOk({
      organizationId: membership.organizationId,
      role: membership.role,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function GET() {
  try {
    const user = await requireDbUser();
    const memberships = await listUserMemberships(user.id);
    let activeOrganizationId: string | null = null;
    let role: string | null = null;

    try {
      const ctx = await requireTenantContext();
      activeOrganizationId = ctx.organization.id;
      role = ctx.role;
    } catch {
      // User may not have an org yet (onboarding).
    }

    return jsonOk({
      activeOrganizationId,
      role,
      organizations: memberships.map((m) => ({
        id: m.organization.id,
        name: m.organization.name,
        slug: m.organization.slug,
        role: m.role,
      })),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
