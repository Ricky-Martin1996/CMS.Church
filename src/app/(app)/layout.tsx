import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { AppShell } from "@/components/layout/app-shell";
import { listUserMemberships } from "@/application/organization/organization-service";
import {
  requireDbUser,
  requireTenantContext,
} from "@/server/auth/session";
import { AUTH_ROUTES } from "@/server/errors";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) {
    redirect(AUTH_ROUTES.signIn);
  }

  let organizations:
    | Array<{ id: string; name: string; slug: string; role: import("@/domain/enums/role").Role }>
    | undefined;
  let activeOrganizationId: string | null | undefined;

  try {
    const user = await requireDbUser();
    const memberships = await listUserMemberships(user.id);
    if (memberships.length === 0) {
      redirect(AUTH_ROUTES.onboarding);
    }
    organizations = memberships.map((m) => ({
      id: m.organization.id,
      name: m.organization.name,
      slug: m.organization.slug,
      role: m.role,
    }));
    try {
      const ctx = await requireTenantContext();
      activeOrganizationId = ctx.organization.id;
    } catch {
      activeOrganizationId = memberships[0]?.organizationId ?? null;
    }
  } catch (error) {
    // Allow UI to render when DATABASE_URL is unset during local design work.
    // Auth is still enforced by Clerk middleware + the userId check above.
    if (process.env.DATABASE_URL) {
      console.error("[churchos] Failed to resolve tenant memberships", error);
      throw error;
    }
    console.warn(
      "[churchos] DATABASE_URL missing — skipping membership gate"
    );
  }

  return (
    <AppShell
      organizations={organizations}
      activeOrganizationId={activeOrganizationId}
    >
      {children}
    </AppShell>
  );
}
