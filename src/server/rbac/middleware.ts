import type { NextRequest } from "next/server";
import type { Permission } from "@/domain/permissions/rbac";
import type { TenantContext } from "@/domain/entities/tenant";
import { requirePermission } from "@/server/auth/session";
import { handleRouteError } from "@/server/http";

type TenantRouteContext = {
  tenant: TenantContext;
  params?: Promise<Record<string, string>>;
};

type TenantHandler = (
  req: NextRequest,
  ctx: TenantRouteContext
) => Promise<Response> | Response;

/**
 * Route-handler wrapper that enforces authentication + a single permission.
 */
export function withPermission(permission: Permission, handler: TenantHandler) {
  return async (req: NextRequest, routeCtx?: { params?: Promise<Record<string, string>> }) => {
    try {
      const tenant = await requirePermission(permission);
      return await handler(req, {
        tenant,
        params: routeCtx?.params,
      });
    } catch (error) {
      return handleRouteError(error);
    }
  };
}

/**
 * Route-handler wrapper that only requires an authenticated tenant context.
 */
export function withTenantContext(handler: TenantHandler) {
  return async (req: NextRequest, routeCtx?: { params?: Promise<Record<string, string>> }) => {
    try {
      const { requireTenantContext } = await import("@/server/auth/session");
      const tenant = await requireTenantContext();
      return await handler(req, {
        tenant,
        params: routeCtx?.params,
      });
    } catch (error) {
      return handleRouteError(error);
    }
  };
}

/** @deprecated Prefer `withTenantContext` — avoids clash with `stampTenant`/`withTenant` scope helper. */
export const withTenant = withTenantContext;
