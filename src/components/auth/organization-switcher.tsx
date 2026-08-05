"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { Building2, Check, ChevronsUpDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ROLE_LABELS, type Role } from "@/domain/enums/role";

type OrgItem = {
  id: string;
  name: string;
  slug: string;
  role: Role;
};

type ActivePayload = {
  activeOrganizationId: string | null;
  organizations: OrgItem[];
};

export function OrganizationSwitcher({
  collapsed,
  initialOrganizations,
  initialActiveOrganizationId,
}: {
  collapsed?: boolean;
  initialOrganizations?: OrgItem[];
  initialActiveOrganizationId?: string | null;
}) {
  const router = useRouter();
  const [data, setData] = useState<ActivePayload | null>(
    initialOrganizations?.length
      ? {
          activeOrganizationId: initialActiveOrganizationId ?? null,
          organizations: initialOrganizations,
        }
      : null
  );
  const [pending, startTransition] = useTransition();

  const load = useCallback(async () => {
    const res = await fetch("/api/organizations/switch");
    if (!res.ok) return;
    const json = (await res.json()) as ActivePayload;
    setData(json);
  }, []);

  useEffect(() => {
    if (initialOrganizations?.length) return;
    void load();
  }, [initialOrganizations, load]);

  const active = data?.organizations.find(
    (o) => o.id === data.activeOrganizationId
  );

  async function switchOrg(organizationId: string) {
    startTransition(async () => {
      const res = await fetch("/api/organizations/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId }),
      });
      if (res.ok) {
        await load();
        router.refresh();
      }
    });
  }

  if (!data?.organizations.length) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={collapsed ? "icon" : "sm"}
          className={cn("w-full", !collapsed && "justify-between gap-2 px-2")}
          disabled={pending}
          aria-label="Switch organization"
        >
          <span className="flex min-w-0 items-center gap-2">
            <Building2 className="h-4 w-4 shrink-0" />
            {!collapsed && (
              <span className="truncate text-left">
                <span className="block truncate text-sm font-medium">
                  {active?.name ?? "Select church"}
                </span>
                {active && (
                  <span className="block truncate text-[11px] text-muted-foreground">
                    {ROLE_LABELS[active.role]}
                  </span>
                )}
              </span>
            )}
          </span>
          {!collapsed && <ChevronsUpDown className="h-3.5 w-3.5 opacity-60" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Organizations</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {data.organizations.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onClick={() => void switchOrg(org.id)}
            className="justify-between"
          >
            <span className="min-w-0">
              <span className="block truncate font-medium">{org.name}</span>
              <span className="block truncate text-xs text-muted-foreground">
                {ROLE_LABELS[org.role]}
              </span>
            </span>
            {org.id === data.activeOrganizationId && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
