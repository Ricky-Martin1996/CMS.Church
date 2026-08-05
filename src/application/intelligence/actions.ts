"use server";

import { getExecutiveDashboard } from "@/application/intelligence/dashboard-service";
import { requireTenantContext } from "@/server/auth/session";
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
    const ctx = await requireTenantContext();
    const data = await getExecutiveDashboard(ctx);
    return { ok: true as const, data };
  } catch (error) {
    return actionError(error);
  }
}
