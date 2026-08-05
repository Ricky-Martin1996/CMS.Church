import {
  type Permission,
  roleHasPermission,
} from "@/domain/permissions/rbac";
import type { Role } from "@/domain/enums/role";
import { forbidden } from "@/server/errors";

/**
 * Pure permission gate — use in server actions / route handlers after
 * resolving the tenant role. Prefer `requirePermission` for full auth.
 */
export function assertPermission(role: Role, permission: Permission): void {
  if (!roleHasPermission(role, permission)) {
    throw forbidden(`Missing permission: ${permission}`);
  }
}

export function can(role: Role, permission: Permission): boolean {
  return roleHasPermission(role, permission);
}
