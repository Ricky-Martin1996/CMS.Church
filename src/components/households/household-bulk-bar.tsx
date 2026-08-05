"use client";

import { useState, useTransition } from "react";
import { Archive, Download, Loader2, Trash2 } from "lucide-react";
import {
  deleteHouseholdAction,
  updateHouseholdAction,
} from "@/application/households/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import type { HouseholdListItem } from "@/domain/entities/household";
import { HouseholdStatus } from "@/domain/enums/member";
import { householdsToCsv, downloadCsv } from "@/components/households/utils";
import { motion, AnimatePresence } from "framer-motion";

export function HouseholdBulkBar({
  selectedIds,
  selectedHouseholds,
  onClear,
  onComplete,
}: {
  selectedIds: string[];
  selectedHouseholds: HouseholdListItem[];
  onClear: () => void;
  onComplete: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [dialog, setDialog] = useState<"archive" | "delete" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runBulk = async (fn: () => Promise<void>) => {
    startTransition(async () => {
      setError(null);
      try {
        await fn();
        setDialog(null);
        onComplete();
        onClear();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  };

  const archiveAll = async () => {
    for (const id of selectedIds) {
      const res = await updateHouseholdAction(id, {
        status: HouseholdStatus.ARCHIVED,
      });
      if (!res.ok) throw new Error(res.error);
    }
  };

  const deleteAll = async () => {
    for (const id of selectedIds) {
      const res = await deleteHouseholdAction(id);
      if (!res.ok) throw new Error(res.error);
    }
  };

  return (
    <AnimatePresence>
      {selectedIds.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          className="fixed bottom-6 left-1/2 z-40 w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2"
        >
          <div className="glass-strong flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3 shadow-[var(--shadow-float)]">
            <p className="text-sm font-medium">
              {selectedIds.length} selected
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="glass"
                size="sm"
                onClick={() => setDialog("archive")}
                disabled={pending}
              >
                <Archive className="h-4 w-4" />
                Archive
              </Button>
              <Button
                variant="glass"
                size="sm"
                onClick={() =>
                  downloadCsv(
                    `households-selected-${Date.now()}.csv`,
                    householdsToCsv(selectedHouseholds)
                  )
                }
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDialog("delete")}
                disabled={pending}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
              <Button variant="ghost" size="sm" onClick={onClear}>
                Clear
              </Button>
            </div>
          </div>

          <Dialog open={dialog === "archive"} onOpenChange={() => setDialog(null)}>
            <DialogContent>
              <DialogTitle>
                Archive {selectedIds.length} households?
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                Archived households remain in the system but are hidden from
                active lists.
              </p>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" onClick={() => setDialog(null)}>
                  Cancel
                </Button>
                <Button
                  disabled={pending}
                  onClick={() => runBulk(archiveAll)}
                >
                  {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Archive
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={dialog === "delete"} onOpenChange={() => setDialog(null)}>
            <DialogContent>
              <DialogTitle>
                Delete {selectedIds.length} households?
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                This action cannot be undone. Household records will be
                permanently removed.
              </p>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" onClick={() => setDialog(null)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  disabled={pending}
                  onClick={() => runBulk(deleteAll)}
                >
                  {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Delete
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
