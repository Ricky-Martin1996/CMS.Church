import { requireTenantContext } from "@/server/auth/session";
import { handleRouteError, jsonOk } from "@/server/http";
import {
  permissionsForRole,
} from "@/domain/permissions/rbac";

export async function GET() {
  try {
    const ctx = await requireTenantContext();
    return jsonOk({
      user: {
        id: ctx.user.id,
        email: ctx.user.email,
        firstName: ctx.user.firstName,
        lastName: ctx.user.lastName,
        imageUrl: ctx.user.imageUrl,
      },
      organization: ctx.organization,
      membership: {
        id: ctx.membership.id,
        role: ctx.role,
        status: ctx.membership.status,
      },
      permissions: permissionsForRole(ctx.role),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
