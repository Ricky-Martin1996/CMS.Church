"use client";

import { useState } from "react";
import {
  Columns3,
  Download,
  Filter,
  Grid3X3,
  LayoutGrid,
  List,
  Rows3,
  Save,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { MemberImportDialog } from "@/components/people/member-import-dialog";
import {
  MEMBER_STATUS_LABELS,
  MemberStatus,
} from "@/domain/enums/member";
import type {
  MemberFilterDefinition,
  MemberListColumn,
  TagEntity,
} from "@/domain/entities/member";
import { DEFAULT_MEMBER_COLUMNS } from "@/domain/entities/member";
import { cn } from "@/lib/utils";

const VIEW_MODES = [
  { id: "table" as const, icon: List, label: "Table" },
  { id: "grid" as const, icon: Grid3X3, label: "Grid" },
  { id: "card" as const, icon: LayoutGrid, label: "Cards" },
  { id: "compact" as const, icon: Rows3, label: "Compact" },
];

const COLUMN_LABELS: Record<MemberListColumn, string> = {
  name: "Name",
  email: "Email",
  phone: "Phone",
  status: "Status",
  campus: "Campus",
  ministryRole: "Ministry role",
  tags: "Tags",
  engagement: "Engagement",
  joinedAt: "Joined",
  leader: "Leader",
};

const ALL_COLUMNS = Object.keys(COLUMN_LABELS) as MemberListColumn[];

export type PeopleToolbarProps = {
  query: string;
  onQueryChange: (q: string) => void;
  statuses: MemberStatus[];
  onStatusesChange: (s: MemberStatus[]) => void;
  tagIds: string[];
  onTagIdsChange: (ids: string[]) => void;
  tags: TagEntity[];
  viewMode: "table" | "grid" | "card" | "compact";
  onViewModeChange: (mode: "table" | "grid" | "card" | "compact") => void;
  columns: MemberListColumn[];
  onColumnsChange: (cols: MemberListColumn[]) => void;
  savedFilters: Array<{
    id: string;
    name: string;
    definition: MemberFilterDefinition;
  }>;
  onApplyFilter: (def: MemberFilterDefinition) => void;
  onSaveFilter: (name: string) => void;
  onImported: (summary: {
    created: number;
    skipped: number;
    message: string;
  }) => void;
  onExportCsv: () => void;
  exportPending?: boolean;
};

export function PeopleToolbar({
  query,
  onQueryChange,
  statuses,
  onStatusesChange,
  tagIds,
  onTagIdsChange,
  tags,
  viewMode,
  onViewModeChange,
  columns,
  onColumnsChange,
  savedFilters,
  onApplyFilter,
  onSaveFilter,
  onImported,
  onExportCsv,
  exportPending,
}: PeopleToolbarProps) {
  const [saveName, setSaveName] = useState("");
  const [saveOpen, setSaveOpen] = useState(false);

  const toggleStatus = (status: MemberStatus) => {
    onStatusesChange(
      statuses.includes(status)
        ? statuses.filter((s) => s !== status)
        : [...statuses, status]
    );
  };

  const toggleTag = (id: string) => {
    onTagIdsChange(
      tagIds.includes(id) ? tagIds.filter((t) => t !== id) : [...tagIds, id]
    );
  };

  const toggleColumn = (col: MemberListColumn) => {
    if (columns.includes(col)) {
      if (columns.length <= 1) return;
      onColumnsChange(columns.filter((c) => c !== col));
    } else {
      onColumnsChange([...columns, col]);
    }
  };

  return (
    <div className="glass-strong space-y-4 rounded-[1.75rem] p-4 sm:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search name, email, phone, campus…"
            className="h-11 border-border/50 bg-background/40 pl-9"
            aria-label="Search members"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="glass" size="sm">
                <Filter className="h-4 w-4" />
                Saved filters
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {savedFilters.length === 0 ? (
                <DropdownMenuItem disabled>No saved filters</DropdownMenuItem>
              ) : (
                savedFilters.map((f) => (
                  <DropdownMenuItem
                    key={f.id}
                    onClick={() => onApplyFilter(f.definition)}
                  >
                    {f.name}
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
            <DialogTrigger asChild>
              <Button variant="glass" size="sm">
                <Save className="h-4 w-4" />
                Save filter
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogTitle>Save current filter</DialogTitle>
              <div className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="filterName">Filter name</Label>
                  <Input
                    id="filterName"
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    placeholder="e.g. Active volunteers"
                  />
                </div>
                <Button
                  onClick={() => {
                    if (saveName.trim()) {
                      onSaveFilter(saveName.trim());
                      setSaveName("");
                      setSaveOpen(false);
                    }
                  }}
                >
                  Save
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <MemberImportDialog onImported={onImported} />

          <Button
            variant="glass"
            size="sm"
            onClick={onExportCsv}
            disabled={exportPending}
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap gap-2">
          {Object.values(MemberStatus).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => toggleStatus(status)}
              className={cn(
                "rounded-xl px-3 py-1.5 text-xs font-medium transition-all",
                statuses.includes(status)
                  ? "bg-primary text-primary-foreground shadow-[var(--shadow-glow)]"
                  : "bg-background/40 text-muted-foreground hover:bg-accent"
              )}
            >
              {MEMBER_STATUS_LABELS[status]}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {tags.slice(0, 8).map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggleTag(tag.id)}
              className={cn(
                "rounded-xl border px-2.5 py-1 text-xs font-medium transition-colors",
                tagIds.includes(tag.id) && "shadow-sm"
              )}
              style={{
                borderColor: tagIds.includes(tag.id) ? tag.color : undefined,
                backgroundColor: tagIds.includes(tag.id)
                  ? `${tag.color}22`
                  : undefined,
              }}
            >
              {tag.name}
            </button>
          ))}

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Customize columns">
                <Columns3 className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogTitle>Table columns</DialogTitle>
              <div className="mt-4 space-y-3">
                {ALL_COLUMNS.map((col) => (
                  <label
                    key={col}
                    className="flex cursor-pointer items-center gap-3 text-sm"
                  >
                    <Checkbox
                      checked={columns.includes(col)}
                      onCheckedChange={() => toggleColumn(col)}
                    />
                    {COLUMN_LABELS[col]}
                  </label>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onColumnsChange([...DEFAULT_MEMBER_COLUMNS])}
                >
                  Reset to default
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <div className="flex rounded-xl bg-background/40 p-0.5">
            {VIEW_MODES.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => onViewModeChange(id)}
                className={cn(
                  "rounded-lg p-2 transition-colors",
                  viewMode === id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-label={label}
                title={label}
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
