export {
  requireDbUser,
  getSessionUser,
  requireTenantContext,
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,
  requireRole,
  switchActiveOrganization,
  bootstrapPersonalOrganization,
} from "@/server/auth/session";
export {
  withPermission,
  withTenantContext,
  withTenant,
} from "@/server/rbac/middleware";
export { can, assertPermission } from "@/server/rbac/permissions";
export {
  withTenant as stampTenant,
  assertSameTenant,
} from "@/server/tenant/scope";
export { ACTIVE_ORG_COOKIE, AUTH_ROUTES, AppError } from "@/server/errors";
