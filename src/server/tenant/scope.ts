import { notFound, forbidden } from "@/server/errors";
import {
  householdRepository,
  memberRepository,
} from "@/infrastructure/repositories";

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
    throw forbidden(message);
  }
}

/** Ensures a member exists inside the active organization. */
export async function requireMemberInOrg(
  organizationId: string,
  memberId: string
) {
  const member = await memberRepository.getById(organizationId, memberId);
  if (!member) throw notFound("Member not found");
  return member;
}

/** Ensures a household exists inside the active organization. */
export async function requireHouseholdInOrg(
  organizationId: string,
  householdId: string
) {
  const household = await householdRepository.getById(
    organizationId,
    householdId
  );
  if (!household) throw notFound("Household not found");
  return household;
}
