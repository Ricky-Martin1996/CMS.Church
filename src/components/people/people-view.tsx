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
import { Plus, Users } from "lucide-react";
import {
  exportMembersCsvAction,
  getPreferencesAction,
  importMembersCsvAction,
  listMembersAction,
  listSavedFiltersAction,
  listTagsAction,
  saveFilterAction,
  savePreferencesAction,
} from "@/application/people/actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { MemberBulkBar } from "@/components/people/member-bulk-bar";
import { MemberCreateDialog } from "@/components/people/member-create-dialog";
import { MemberStatusBadge } from "@/components/people/member-status-badge";
import { PeopleToolbar } from "@/components/people/people-toolbar";
import {
  downloadCsv,
  formatMemberDate,
  getInitials,
} from "@/components/people/utils";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/shared/states";
import { FadeIn } from "@/components/motion/page-transition";
import type {
  MemberFilterDefinition,
  MemberListColumn,
  MemberListItem,
} from "@/domain/entities/member";
import { DEFAULT_MEMBER_COLUMNS } from "@/domain/entities/member";
import { MemberStatus } from "@/domain/enums/member";
import { cn } from "@/lib/utils";

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
  statuses: MemberStatus[],
  tagIds: string[]
): MemberFilterDefinition {
  return {
    ...(query.trim() ? { query: query.trim() } : {}),
    ...(statuses.length ? { statuses } : {}),
    ...(tagIds.length ? { tagIds } : {}),
  };
}

function renderCell(
  member: MemberListItem,
  col: MemberListColumn
): React.ReactNode {
  switch (col) {
    case "name":
      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            {member.avatarUrl && (
              <AvatarImage src={member.avatarUrl} alt="" />
            )}
            <AvatarFallback className="text-xs">
              {getInitials(member.displayName)}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium">{member.displayName}</span>
        </div>
      );
    case "email":
      return (
        <span className="text-muted-foreground">{member.email ?? "—"}</span>
      );
    case "phone":
      return member.phone ?? "—";
    case "status":
      return <MemberStatusBadge status={member.status} />;
    case "campus":
      return member.campus ?? "—";
    case "ministryRole":
      return member.ministryRole ?? "—";
    case "tags":
      return (
        <div className="flex flex-wrap gap-1">
          {member.tags.slice(0, 3).map((t) => (
            <Badge
              key={t.id}
              variant="outline"
              className="text-[10px]"
              style={{ borderColor: t.color, color: t.color }}
            >
              {t.name}
            </Badge>
          ))}
          {member.tags.length > 3 && (
            <span className="text-xs text-muted-foreground">
              +{member.tags.length - 3}
            </span>
          )}
        </div>
      );
    case "engagement":
      return (
        <span className="tabular-nums">{member.engagementScore}</span>
      );
    case "joinedAt":
      return formatMemberDate(member.joinedAt);
    case "leader":
      return member.assignedLeaderId ? "Assigned" : "—";
    default:
      return null;
  }
}

export function PeopleView() {
  const [members, setMembers] = useState<MemberListItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query);
  const [statuses, setStatuses] = useState<MemberStatus[]>([]);
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [tags, setTags] = useState<
    import("@/domain/entities/member").TagEntity[]
  >([]);
  const [savedFilters, setSavedFilters] = useState<
    Array<{ id: string; name: string; definition: MemberFilterDefinition }>
  >([]);

  const [viewMode, setViewMode] = useState<
    "table" | "grid" | "card" | "compact"
  >("table");
  const [columns, setColumns] = useState<MemberListColumn[]>(
    DEFAULT_MEMBER_COLUMNS
  );
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [prefsLoaded, setPrefsLoaded] = useState(false);

  const [importPending, startImport] = useTransition();
  const [exportPending, startExport] = useTransition();

  const sentinelRef = useRef<HTMLDivElement>(null);
  const filter = useMemo(
    () => buildFilter(debouncedQuery, statuses, tagIds),
    [debouncedQuery, statuses, tagIds]
  );

  const loadMembers = useCallback(
    async (nextCursor: string | null, append: boolean) => {
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError(null);

      const res = await listMembersAction({
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

      setMembers((prev) =>
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
    listTagsAction().then((res) => {
      if (res.ok) setTags(res.data);
    });
    listSavedFiltersAction().then((res) => {
      if (res.ok) setSavedFilters(res.data);
    });
    getPreferencesAction().then((res) => {
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
    loadMembers(null, false);
  }, [filter, prefsLoaded, loadMembers]);

  useEffect(() => {
    if (!prefsLoaded) return;
    savePreferencesAction({
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
          loadMembers(cursor, true);
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [cursor, hasMore, loading, loadingMore, loadMembers]);

  const selectedMembers = useMemo(
    () => members.filter((m) => selected.has(m.id)),
    [members, selected]
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
    if (selected.size === members.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(members.map((m) => m.id)));
    }
  };

  const applyFilter = (def: MemberFilterDefinition) => {
    setQuery(def.query ?? "");
    setStatuses(def.statuses ?? []);
    setTagIds(def.tagIds ?? []);
  };

  return (
    <div className="space-y-6 pb-24">
      <FadeIn>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-primary">Member CRM</p>
            <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              People
            </h1>
            <p className="max-w-lg text-muted-foreground">
              {total > 0
                ? `${total.toLocaleString()} members in your directory`
                : "Members, visitors, and ministry leaders — your living directory."}
            </p>
          </div>
          <MemberCreateDialog
            trigger={
              <Button variant="glow">
                <Plus className="h-4 w-4" />
                Add member
              </Button>
            }
          />
        </div>
      </FadeIn>

      <FadeIn delay={0.06}>
        <PeopleToolbar
          query={query}
          onQueryChange={setQuery}
          statuses={statuses}
          onStatusesChange={setStatuses}
          tagIds={tagIds}
          onTagIdsChange={setTagIds}
          tags={tags}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          columns={columns}
          onColumnsChange={setColumns}
          savedFilters={savedFilters}
          onApplyFilter={applyFilter}
          onSaveFilter={(name) => {
            saveFilterAction(name, filter).then((res) => {
              if (res.ok) {
                listSavedFiltersAction().then((r) => {
                  if (r.ok) setSavedFilters(r.data);
                });
              }
            });
          }}
          onImportCsv={(text) => {
            startImport(async () => {
              const res = await importMembersCsvAction(text);
              if (res.ok) loadMembers(null, false);
            });
          }}
          onExportCsv={() => {
            startExport(async () => {
              const res = await exportMembersCsvAction(filter);
              if (res.ok) {
                downloadCsv(`members-${Date.now()}.csv`, res.data);
              }
            });
          }}
          importPending={importPending}
          exportPending={exportPending}
        />
      </FadeIn>

      {loading ? (
        <div className="glass rounded-[1.75rem]">
          <LoadingState label="Loading members…" />
        </div>
      ) : error ? (
        <div className="glass rounded-[1.75rem]">
          <ErrorState
            description={error}
            onRetry={() => loadMembers(null, false)}
          />
        </div>
      ) : members.length === 0 ? (
        <div className="glass rounded-[1.75rem]">
          <EmptyState
            icon={Users}
            title="No members found"
            description="Try adjusting your search or filters, or add your first member."
            action={{
              label: "Clear filters",
              onClick: () => {
                setQuery("");
                setStatuses([]);
                setTagIds([]);
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
                            selected.size === members.length &&
                            members.length > 0
                          }
                          onCheckedChange={toggleSelectAll}
                          aria-label="Select all"
                        />
                      </th>
                      {columns.map((col) => (
                        <th key={col} className="px-4 py-3 font-medium">
                          {col === "name"
                            ? "Name"
                            : col === "ministryRole"
                              ? "Role"
                              : col.charAt(0).toUpperCase() + col.slice(1)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((member, i) => (
                      <motion.tr
                        key={member.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(i * 0.02, 0.3) }}
                        className="border-b border-border/30 transition-colors hover:bg-accent/20"
                      >
                        <td className="px-4 py-3">
                          <Checkbox
                            checked={selected.has(member.id)}
                            onCheckedChange={() => toggleSelect(member.id)}
                            aria-label={`Select ${member.displayName}`}
                          />
                        </td>
                        {columns.map((col) => (
                          <td key={col} className="px-4 py-3">
                            {col === "name" ? (
                              <Link
                                href={`/people/${member.id}`}
                                className="block hover:underline"
                              >
                                {renderCell(member, col)}
                              </Link>
                            ) : (
                              renderCell(member, col)
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
              {members.map((member, i) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: Math.min(i * 0.02, 0.3) }}
                >
                  <Link
                    href={`/people/${member.id}`}
                    className="group flex flex-col items-center gap-2 rounded-2xl glass p-4 text-center transition-all hover-lift"
                  >
                    <Avatar className="h-14 w-14">
                      {member.avatarUrl && (
                        <AvatarImage src={member.avatarUrl} alt="" />
                      )}
                      <AvatarFallback>
                        {getInitials(member.displayName)}
                      </AvatarFallback>
                    </Avatar>
                    <p className="truncate text-sm font-medium">
                      {member.displayName}
                    </p>
                    <MemberStatusBadge
                      status={member.status}
                      className="scale-90"
                    />
                  </Link>
                </motion.div>
              ))}
            </div>
          )}

          {viewMode === "card" && (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {members.map((member, i) => (
                <motion.article
                  key={member.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.35) }}
                >
                  <Link
                    href={`/people/${member.id}`}
                    className="group block glass rounded-[1.75rem] p-5 hover-lift"
                  >
                    <div className="flex items-start gap-4">
                      <Avatar className="h-14 w-14 rounded-[1.25rem]">
                        {member.avatarUrl && (
                          <AvatarImage src={member.avatarUrl} alt="" />
                        )}
                        <AvatarFallback className="rounded-[1.25rem]">
                          {getInitials(member.displayName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <h2 className="font-display text-lg font-semibold">
                          {member.displayName}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          {member.ministryRole ?? member.email ?? "—"}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {member.campus && (
                            <Badge variant="outline">{member.campus}</Badge>
                          )}
                          <MemberStatusBadge status={member.status} />
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="rounded-xl bg-background/40 p-2">
                        <p className="font-semibold tabular-nums">
                          {member.engagementScore}
                        </p>
                        <p className="text-muted-foreground">Engagement</p>
                      </div>
                      <div className="rounded-xl bg-background/40 p-2">
                        <p className="font-semibold tabular-nums">
                          {member.growthScore}
                        </p>
                        <p className="text-muted-foreground">Growth</p>
                      </div>
                      <div className="rounded-xl bg-background/40 p-2">
                        <p className="font-semibold tabular-nums">
                          {member.riskScore}
                        </p>
                        <p className="text-muted-foreground">Risk</p>
                      </div>
                    </div>
                  </Link>
                </motion.article>
              ))}
            </div>
          )}

          {viewMode === "compact" && (
            <div className="glass divide-y divide-border/40 overflow-hidden rounded-[1.75rem]">
              {members.map((member, i) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(i * 0.015, 0.25) }}
                >
                  <Link
                    href={`/people/${member.id}`}
                    className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-accent/30"
                  >
                    <Avatar className="h-7 w-7">
                      {member.avatarUrl && (
                        <AvatarImage src={member.avatarUrl} alt="" />
                      )}
                      <AvatarFallback className="text-[10px]">
                        {getInitials(member.displayName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                      {member.displayName}
                    </span>
                    <span className="hidden truncate text-xs text-muted-foreground sm:block">
                      {member.email}
                    </span>
                    <MemberStatusBadge
                      status={member.status}
                      className="scale-90"
                    />
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {member.engagementScore}
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

      <MemberBulkBar
        selectedIds={[...selected]}
        selectedMembers={selectedMembers}
        tags={tags}
        onClear={() => setSelected(new Set())}
        onComplete={() => loadMembers(null, false)}
      />
    </div>
  );
}
