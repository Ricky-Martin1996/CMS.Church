"use server";

import { getExecutiveDashboard } from "@/application/intelligence/dashboard-service";
import { Permission } from "@/domain/permissions/rbac";
import { requirePermission } from "@/server/auth/session";
import { AppError } from "@/server/errors";

function actionError(error: unknown): { ok: false; error: string } {
  if (error instanceof AppError) {
    return { ok: false, error: error.message };
  }
  console.error("[intelligence action]", error);
  return { ok: false, error: "Something went wrong" };
}

export async function getExecutiveDashboardAction() {
  try {
    // ORG_READ alone is too broad (GUEST). Require PEOPLE_READ which all
    // operational roles have; the service further gates KPI modules by role.
    const ctx = await requirePermission(Permission.PEOPLE_READ);
    const data = await getExecutiveDashboard(ctx);
    return { ok: true as const, data };
  } catch (error) {
    return actionError(error);
  }
}
