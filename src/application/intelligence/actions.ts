"use server";

import { unstable_cache } from "next/cache";
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
    const ctx = await requirePermission(Permission.PEOPLE_READ);
    const cached = unstable_cache(
      async () => getExecutiveDashboard(ctx),
      ["executive-dashboard", ctx.organization.id, ctx.role],
      {
        revalidate: 45,
        tags: [
          `org:${ctx.organization.id}`,
          `org:${ctx.organization.id}:dashboard`,
        ],
      }
    );
    const data = await cached();
    return { ok: true as const, data };
  } catch (error) {
    return actionError(error);
  }
}
