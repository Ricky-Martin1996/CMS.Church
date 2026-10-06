import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import {
  DashboardView,
  type SerializedDashboard,
} from "@/components/dashboard/dashboard-view";
import { executiveDashboardCacheKey } from "@/application/intelligence/dashboard-cache-key";
import { getExecutiveDashboard } from "@/application/intelligence/dashboard-service";
import { Permission } from "@/domain/permissions/rbac";
import { requirePermission } from "@/server/auth/session";

export const metadata: Metadata = {
  title: "Dashboard",
};

export const dynamic = "force-dynamic";

async function loadDashboard(): Promise<SerializedDashboard | null> {
  try {
    const ctx = await requirePermission(Permission.PEOPLE_READ);
    const cached = unstable_cache(
      async () => getExecutiveDashboard(ctx),
      executiveDashboardCacheKey({
        organizationId: ctx.organization.id,
        role: ctx.role,
        userId: ctx.user.id,
      }),
      {
        revalidate: 45,
        tags: [
          `org:${ctx.organization.id}`,
          `org:${ctx.organization.id}:dashboard`,
        ],
      }
    );
    const data = await cached();
    // Cross the RSC → client boundary once (Dates → ISO strings).
    return JSON.parse(JSON.stringify(data)) as SerializedDashboard;
  } catch (error) {
    console.error("[dashboard] SSR prefetch failed", error);
    return null;
  }
}

export default async function DashboardPage() {
  const initialData = await loadDashboard();
  return <DashboardView initialData={initialData} />;
}
