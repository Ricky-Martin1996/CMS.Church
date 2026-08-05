"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Home, Plus } from "lucide-react";
import {
  exportHouseholdsCsvAction,
  getHouseholdPreferencesAction,
  importHouseholdsCsvAction,
  listHouseholdFiltersAction,
  listHouseholdsAction,
  saveHouseholdFilterAction,
  saveHouseholdPreferencesAction,
} from "@/application/households/actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { HouseholdBulkBar } from "@/components/households/household-bulk-bar";
import { HouseholdCreateDialog } from "@/components/households/household-create-dialog";
import { HouseholdStatusBadge } from "@/components/households/household-status-badge";
import { HouseholdToolbar } from "@/components/households/household-toolbar";
import {
  downloadCsv,
  formatHouseholdDate,
  getInitials,
} from "@/components/households/utils";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/shared/states";
import { FadeIn } from "@/components/motion/page-transition";
import type {
  HouseholdFilterDefinition,
  HouseholdListColumn,
  HouseholdListItem,
} from "@/domain/entities/household";
import { DEFAULT_HOUSEHOLD_COLUMNS } from "@/domain/entities/household";
import { HouseholdStatus } from "@/domain/enums/member";

function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function buildFilter(
  query: string,
  statuses: HouseholdStatus[]
): HouseholdFilterDefinition {
  return {
    ...(query.trim() ? { query: query.trim() } : {}),
    ...(statuses.length ? { statuses } : {}),
  };
}

const COLUMN_LABELS: Record<HouseholdListColumn, string> = {
  familyName: "Family name",
  householdCode: "Code",
  members: "Members",
  head: "Head",
  status: "Status",
  cellGroup: "Cell group",
  engagement: "Engagement",
  city: "City",
  updatedAt: "Updated",
};

function renderCell(
  household: HouseholdListItem,
  col: HouseholdListColumn
): React.ReactNode {
  switch (col) {
    case "familyName":
      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 rounded-xl">
            {household.headAvatar && (
              <AvatarImage src={household.headAvatar} alt="" />
            )}
            <AvatarFallback className="rounded-xl text-xs">
              {getInitials(household.familyName)}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium">{household.familyName}</span>
        </div>
      );
    case "householdCode":
      return (
        <span className="font-mono text-xs text-muted-foreground">
          {household.householdCode}
        </span>
      );
    case "members":
      return (
        <span className="tabular-nums">{household.memberCount}</span>
      );
    case "head":
      return household.headName ?? "—";
    case "status":
      return <HouseholdStatusBadge status={household.status} />;
    case "cellGroup":
      return household.cellGroup ?? "—";
    case "engagement":
      return (
        <span className="tabular-nums">{household.engagementScore}</span>
      );
    case "city":
      return household.city ?? "—";
    case "updatedAt":
      return formatHouseholdDate(household.updatedAt);
    default:
      return null;
  }
}

export function HouseholdsView() {
  const [households, setHouseholds] = useState<HouseholdListItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query);
  const [statuses, setStatuses] = useState<HouseholdStatus[]>([]);
  const [savedFilters, setSavedFilters] = useState<
    Array<{ id: string; name: string; definition: HouseholdFilterDefinition }>
  >([]);

  const [viewMode, setViewMode] = useState<
    "table" | "grid" | "card" | "compact"
  >("table");
  const [columns, setColumns] = useState<HouseholdListColumn[]>(
    DEFAULT_HOUSEHOLD_COLUMNS
  );
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [prefsLoaded, setPrefsLoaded] = useState(false);

  const [importPending, startImport] = useTransition();
  const [exportPending, startExport] = useTransition();

  const sentinelRef = useRef<HTMLDivElement>(null);
  const filter = useMemo(
    () => buildFilter(debouncedQuery, statuses),
    [debouncedQuery, statuses]
  );

  const loadHouseholds = useCallback(
    async (nextCursor: string | null, append: boolean) => {
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError(null);

      const res = await listHouseholdsAction({
        cursor: nextCursor,
        limit: 40,
        filter,
      });

      if (!res.ok) {
        setError(res.error);
        setLoading(false);
        setLoadingMore(false);
        return;
      }

      setHouseholds((prev) =>
        append ? [...prev, ...res.data.items] : res.data.items
      );
      setCursor(res.data.nextCursor);
      setHasMore(!!res.data.nextCursor);
      setTotal(res.data.total);
      setLoading(false);
      setLoadingMore(false);
    },
    [filter]
  );

  useEffect(() => {
    listHouseholdFiltersAction().then((res) => {
      if (res.ok) setSavedFilters(res.data);
    });
    getHouseholdPreferencesAction().then((res) => {
      if (res.ok) {
        setViewMode(res.data.viewMode as typeof viewMode);
        setColumns(res.data.columns);
      }
      setPrefsLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!prefsLoaded) return;
    setSelected(new Set());
    loadHouseholds(null, false);
  }, [filter, prefsLoaded, loadHouseholds]);

  useEffect(() => {
    if (!prefsLoaded) return;
    saveHouseholdPreferencesAction({
      columns,
      viewMode,
      density: "comfortable",
    });
  }, [columns, viewMode, prefsLoaded]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore || loading || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && cursor) {
          loadHouseholds(cursor, true);
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [cursor, hasMore, loading, loadingMore, loadHouseholds]);

  const selectedHouseholds = useMemo(
    () => households.filter((h) => selected.has(h.id)),
    [households, selected]
  );

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === households.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(households.map((h) => h.id)));
    }
  };

  const applyFilter = (def: HouseholdFilterDefinition) => {
    setQuery(def.query ?? "");
    setStatuses(def.statuses ?? []);
  };

  return (
    <div className="space-y-6 pb-24">
      <FadeIn>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-primary">Family Directory</p>
            <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Households
            </h1>
            <p className="max-w-lg text-muted-foreground">
              {total > 0
                ? `${total.toLocaleString()} households in your church`
                : "Families, addresses, and connections — your household directory."}
            </p>
          </div>
          <HouseholdCreateDialog
            trigger={
              <Button variant="glow">
                <Plus className="h-4 w-4" />
                Create household
              </Button>
            }
          />
        </div>
      </FadeIn>

      <FadeIn delay={0.06}>
        <HouseholdToolbar
          query={query}
          onQueryChange={setQuery}
          statuses={statuses}
          onStatusesChange={setStatuses}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          columns={columns}
          onColumnsChange={setColumns}
          savedFilters={savedFilters}
          onApplyFilter={applyFilter}
          onSaveFilter={(name) => {
            saveHouseholdFilterAction(name, filter).then((res) => {
              if (res.ok) {
                listHouseholdFiltersAction().then((r) => {
                  if (r.ok) setSavedFilters(r.data);
                });
              }
            });
          }}
          onImportCsv={(text) => {
            startImport(async () => {
              const res = await importHouseholdsCsvAction(text);
              if (res.ok) loadHouseholds(null, false);
            });
          }}
          onExportCsv={() => {
            startExport(async () => {
              const res = await exportHouseholdsCsvAction(filter);
              if (res.ok) {
                downloadCsv(`households-${Date.now()}.csv`, res.data);
              }
            });
          }}
          importPending={importPending}
          exportPending={exportPending}
        />
      </FadeIn>

      {loading ? (
        <div className="glass rounded-[1.75rem]">
          <LoadingState label="Loading households…" />
        </div>
      ) : error ? (
        <div className="glass rounded-[1.75rem]">
          <ErrorState
            description={error}
            onRetry={() => loadHouseholds(null, false)}
          />
        </div>
      ) : households.length === 0 ? (
        <div className="glass rounded-[1.75rem]">
          <EmptyState
            icon={Home}
            title="No households found"
            description="Try adjusting your search or filters, or create your first household."
            action={{
              label: "Clear filters",
              onClick: () => {
                setQuery("");
                setStatuses([]);
              },
            }}
          />
        </div>
      ) : (
        <>
          {viewMode === "table" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass overflow-hidden rounded-[1.75rem]"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50 text-left text-muted-foreground">
                      <th className="w-10 px-4 py-3">
                        <Checkbox
                          checked={
                            selected.size === households.length &&
                            households.length > 0
                          }
                          onCheckedChange={toggleSelectAll}
                          aria-label="Select all"
                        />
                      </th>
                      {columns.map((col) => (
                        <th key={col} className="px-4 py-3 font-medium">
                          {COLUMN_LABELS[col]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {households.map((household, i) => (
                      <motion.tr
                        key={household.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(i * 0.02, 0.3) }}
                        className="border-b border-border/30 transition-colors hover:bg-accent/20"
                      >
                        <td className="px-4 py-3">
                          <Checkbox
                            checked={selected.has(household.id)}
                            onCheckedChange={() => toggleSelect(household.id)}
                            aria-label={`Select ${household.familyName}`}
                          />
                        </td>
                        {columns.map((col) => (
                          <td key={col} className="px-4 py-3">
                            {col === "familyName" ? (
                              <Link
                                href={`/households/${household.id}`}
                                className="block hover:underline"
                              >
                                {renderCell(household, col)}
                              </Link>
                            ) : (
                              renderCell(household, col)
                            )}
                          </td>
                        ))}
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {viewMode === "grid" && (
            <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {households.map((household, i) => (
                <motion.div
                  key={household.id}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: Math.min(i * 0.02, 0.3) }}
                >
                  <Link
                    href={`/households/${household.id}`}
                    className="group flex flex-col items-center gap-2 rounded-2xl glass p-4 text-center transition-all hover-lift"
                  >
                    <Avatar className="h-14 w-14 rounded-xl">
                      {household.headAvatar && (
                        <AvatarImage src={household.headAvatar} alt="" />
                      )}
                      <AvatarFallback className="rounded-xl">
                        {getInitials(household.familyName)}
                      </AvatarFallback>
                    </Avatar>
                    <p className="truncate text-sm font-medium">
                      {household.familyName}
                    </p>
                    <HouseholdStatusBadge
                      status={household.status}
                      className="scale-90"
                    />
                  </Link>
                </motion.div>
              ))}
            </div>
          )}

          {viewMode === "card" && (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {households.map((household, i) => (
                <motion.article
                  key={household.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.35) }}
                >
                  <Link
                    href={`/households/${household.id}`}
                    className="group block glass rounded-[1.75rem] p-5 hover-lift"
                  >
                    <div className="flex items-start gap-4">
                      <Avatar className="h-14 w-14 rounded-[1.25rem]">
                        {household.headAvatar && (
                          <AvatarImage src={household.headAvatar} alt="" />
                        )}
                        <AvatarFallback className="rounded-[1.25rem]">
                          {getInitials(household.familyName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <h2 className="font-display text-lg font-semibold">
                          {household.familyName}
                        </h2>
                        <p className="font-mono text-xs text-muted-foreground">
                          {household.householdCode}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {household.cellGroup && (
                            <Badge variant="outline">{household.cellGroup}</Badge>
                          )}
                          <HouseholdStatusBadge status={household.status} />
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="rounded-xl bg-background/40 p-2">
                        <p className="font-semibold tabular-nums">
                          {household.memberCount}
                        </p>
                        <p className="text-muted-foreground">Members</p>
                      </div>
                      <div className="rounded-xl bg-background/40 p-2">
                        <p className="font-semibold tabular-nums">
                          {household.engagementScore}
                        </p>
                        <p className="text-muted-foreground">Engagement</p>
                      </div>
                      <div className="rounded-xl bg-background/40 p-2">
                        <p className="truncate font-semibold">
                          {household.city ?? "—"}
                        </p>
                        <p className="text-muted-foreground">City</p>
                      </div>
                    </div>
                  </Link>
                </motion.article>
              ))}
            </div>
          )}

          {viewMode === "compact" && (
            <div className="glass divide-y divide-border/40 overflow-hidden rounded-[1.75rem]">
              {households.map((household, i) => (
                <motion.div
                  key={household.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(i * 0.015, 0.25) }}
                >
                  <Link
                    href={`/households/${household.id}`}
                    className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-accent/30"
                  >
                    <Avatar className="h-7 w-7 rounded-lg">
                      {household.headAvatar && (
                        <AvatarImage src={household.headAvatar} alt="" />
                      )}
                      <AvatarFallback className="rounded-lg text-[10px]">
                        {getInitials(household.familyName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                      {household.familyName}
                    </span>
                    <span className="hidden truncate text-xs text-muted-foreground sm:block">
                      {household.householdCode}
                    </span>
                    <HouseholdStatusBadge
                      status={household.status}
                      className="scale-90"
                    />
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {household.memberCount}
                    </span>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}

          {loadingMore && (
            <p className="text-center text-sm text-muted-foreground">
              Loading more…
            </p>
          )}
          <div ref={sentinelRef} className="h-1" aria-hidden />
        </>
      )}

      <HouseholdBulkBar
        selectedIds={[...selected]}
        selectedHouseholds={selectedHouseholds}
        onClear={() => setSelected(new Set())}
        onComplete={() => loadHouseholds(null, false)}
      />
    </div>
  );
}
