/**
 * Example of a tenant-scoped write payload.
 * Member Management is intentionally not implemented yet —
 * this demonstrates the required organizationId stamp.
 */
import { withTenant } from "@/server/tenant/scope";
import type { TenantContext } from "@/domain/entities/tenant";

export function exampleTenantScopedCreate(
  tenant: TenantContext,
  input: { title: string }
) {
  return withTenant(tenant.organization.id, {
    title: input.title,
    createdById: tenant.user.id,
  });
}
