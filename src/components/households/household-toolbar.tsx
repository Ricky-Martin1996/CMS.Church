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
  Upload,
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
import {
  HOUSEHOLD_STATUS_LABELS,
  HouseholdStatus,
} from "@/domain/enums/member";
import type {
  HouseholdFilterDefinition,
  HouseholdListColumn,
} from "@/domain/entities/household";
import { DEFAULT_HOUSEHOLD_COLUMNS } from "@/domain/entities/household";
import { cn } from "@/lib/utils";

const VIEW_MODES = [
  { id: "table" as const, icon: List, label: "Table" },
  { id: "grid" as const, icon: Grid3X3, label: "Grid" },
  { id: "card" as const, icon: LayoutGrid, label: "Cards" },
  { id: "compact" as const, icon: Rows3, label: "Compact" },
];

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

const ALL_COLUMNS = Object.keys(COLUMN_LABELS) as HouseholdListColumn[];

export type HouseholdToolbarProps = {
  query: string;
  onQueryChange: (q: string) => void;
  statuses: HouseholdStatus[];
  onStatusesChange: (s: HouseholdStatus[]) => void;
  viewMode: "table" | "grid" | "card" | "compact";
  onViewModeChange: (mode: "table" | "grid" | "card" | "compact") => void;
  columns: HouseholdListColumn[];
  onColumnsChange: (cols: HouseholdListColumn[]) => void;
  savedFilters: Array<{
    id: string;
    name: string;
    definition: HouseholdFilterDefinition;
  }>;
  onApplyFilter: (def: HouseholdFilterDefinition) => void;
  onSaveFilter: (name: string) => void;
  onImportCsv: (text: string) => void;
  onExportCsv: () => void;
  importPending?: boolean;
  exportPending?: boolean;
};

export function HouseholdToolbar({
  query,
  onQueryChange,
  statuses,
  onStatusesChange,
  viewMode,
  onViewModeChange,
  columns,
  onColumnsChange,
  savedFilters,
  onApplyFilter,
  onSaveFilter,
  onImportCsv,
  onExportCsv,
  importPending,
  exportPending,
}: HouseholdToolbarProps) {
  const [saveName, setSaveName] = useState("");
  const [saveOpen, setSaveOpen] = useState(false);

  const toggleStatus = (status: HouseholdStatus) => {
    onStatusesChange(
      statuses.includes(status)
        ? statuses.filter((s) => s !== status)
        : [...statuses, status]
    );
  };

  const toggleColumn = (col: HouseholdListColumn) => {
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
            placeholder="Search family name, code, address…"
            className="h-11 border-border/50 bg-background/40 pl-9"
            aria-label="Search households"
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
                    placeholder="e.g. Active families"
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

          <label className="cursor-pointer">
            <input
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => onImportCsv(String(reader.result ?? ""));
                reader.readAsText(file);
                e.target.value = "";
              }}
            />
            <Button variant="glass" size="sm" asChild disabled={importPending}>
              <span>
                <Upload className="h-4 w-4" />
                Import CSV
              </span>
            </Button>
          </label>

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
          {Object.values(HouseholdStatus).map((status) => (
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
              {HOUSEHOLD_STATUS_LABELS[status]}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
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
                  onClick={() => onColumnsChange([...DEFAULT_HOUSEHOLD_COLUMNS])}
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
