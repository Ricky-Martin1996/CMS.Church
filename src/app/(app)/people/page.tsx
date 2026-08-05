import type { Metadata } from "next";
import {
  PeopleView,
  type PeopleInitialData,
} from "@/components/people/people-view";
import {
  ensureOrgTags,
  getListPreferences,
  listMembers,
  listSavedFilters,
} from "@/application/people/member-service";
import { DEFAULT_MEMBER_COLUMNS } from "@/domain/entities/member";
import { Permission } from "@/domain/permissions/rbac";
import { requirePermission } from "@/server/auth/session";

export const metadata: Metadata = {
  title: "People",
};

export const dynamic = "force-dynamic";

export default async function PeoplePage() {
  let initial: PeopleInitialData | undefined;

  try {
    const ctx = await requirePermission(Permission.PEOPLE_READ);
    const orgId = ctx.organization.id;
    const [tags, prefs, filters, page] = await Promise.all([
      ensureOrgTags(orgId),
      getListPreferences(orgId, ctx.user.id),
      listSavedFilters(orgId, ctx.user.id),
      listMembers({ organizationId: orgId, limit: 40 }),
    ]);

    initial = {
      members: JSON.parse(JSON.stringify(page.items)),
      nextCursor: page.nextCursor,
      total: page.total,
      tags: JSON.parse(JSON.stringify(tags)),
      savedFilters: JSON.parse(JSON.stringify(filters)),
      columns: prefs?.columns ?? DEFAULT_MEMBER_COLUMNS,
      viewMode:
        (prefs?.viewMode as PeopleInitialData["viewMode"]) ?? "table",
    };
  } catch (error) {
    console.error("[people] SSR prefetch failed", error);
  }

  return <PeopleView initialData={initial} />;
}
