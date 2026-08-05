/**
 * Multi-tenant helpers.
 * Every write path must include organizationId from TenantContext.
 */

export type TenantScoped = {
  organizationId: string;
};

export function withTenant<T extends Record<string, unknown>>(
  organizationId: string,
  data: T
): T & TenantScoped {
  return { ...data, organizationId };
}

export function assertSameTenant(
  recordOrgId: string,
  activeOrgId: string,
  message = "Cross-tenant access denied"
): void {
  if (recordOrgId !== activeOrgId) {
    throw new Error(message);
  }
}
