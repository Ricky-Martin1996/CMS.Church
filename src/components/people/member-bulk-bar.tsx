"use client";

import { useState, useTransition } from "react";
import { Loader2, Trash2, Tag, UserCog, Download } from "lucide-react";
import { bulkMembersAction } from "@/application/people/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MemberStatus } from "@/domain/enums/member";
import type { TagEntity, MemberListItem } from "@/domain/entities/member";
import { membersToCsv, downloadCsv } from "@/components/people/utils";
import { motion, AnimatePresence } from "framer-motion";

export function MemberBulkBar({
  selectedIds,
  selectedMembers,
  tags,
  onClear,
  onComplete,
}: {
  selectedIds: string[];
  selectedMembers: MemberListItem[];
  tags: TagEntity[];
  onClear: () => void;
  onComplete: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [dialog, setDialog] = useState<
    "status" | "tag" | "leader" | "delete" | null
  >(null);
  const [error, setError] = useState<string | null>(null);

  const runBulk = (action: Parameters<typeof bulkMembersAction>[0]) => {
    startTransition(async () => {
      setError(null);
      const res = await bulkMembersAction(action);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setDialog(null);
      onComplete();
      onClear();
    });
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
                onClick={() => setDialog("status")}
                disabled={pending}
              >
                Set status
              </Button>
              <Button
                variant="glass"
                size="sm"
                onClick={() => setDialog("tag")}
                disabled={pending}
              >
                <Tag className="h-4 w-4" />
                Add tag
              </Button>
              <Button
                variant="glass"
                size="sm"
                onClick={() => setDialog("leader")}
                disabled={pending}
              >
                <UserCog className="h-4 w-4" />
                Assign leader
              </Button>
              <Button
                variant="glass"
                size="sm"
                onClick={() =>
                  downloadCsv(
                    `members-selected-${Date.now()}.csv`,
                    membersToCsv(selectedMembers)
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

          <Dialog open={dialog === "status"} onOpenChange={() => setDialog(null)}>
            <DialogContent>
              <DialogTitle>Set status for {selectedIds.length} members</DialogTitle>
              <form
                className="mt-4 space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  const status = new FormData(e.currentTarget).get(
                    "status"
                  ) as MemberStatus;
                  runBulk({
                    ids: selectedIds,
                    action: { type: "status", status },
                  });
                }}
              >
                <Select name="status" defaultValue={MemberStatus.ACTIVE}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(MemberStatus).map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" disabled={pending}>
                  {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Apply
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={dialog === "tag"} onOpenChange={() => setDialog(null)}>
            <DialogContent>
              <DialogTitle>Add tag to {selectedIds.length} members</DialogTitle>
              <form
                className="mt-4 space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  const tagId = new FormData(e.currentTarget).get(
                    "tagId"
                  ) as string;
                  runBulk({
                    ids: selectedIds,
                    action: { type: "addTag", tagId },
                  });
                }}
              >
                <Select name="tagId" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select tag" />
                  </SelectTrigger>
                  <SelectContent>
                    {tags.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" disabled={pending}>
                  {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Apply
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={dialog === "leader"} onOpenChange={() => setDialog(null)}>
            <DialogContent>
              <DialogTitle>Assign leader</DialogTitle>
              <form
                className="mt-4 space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  const leaderId =
                    (new FormData(e.currentTarget).get("leaderId") as string) ||
                    null;
                  runBulk({
                    ids: selectedIds,
                    action: { type: "assignLeader", leaderId },
                  });
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="leaderId">Leader member ID</Label>
                  <Input
                    id="leaderId"
                    name="leaderId"
                    placeholder="Member ID (leave empty to clear)"
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" disabled={pending}>
                  {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Apply
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={dialog === "delete"} onOpenChange={() => setDialog(null)}>
            <DialogContent>
              <DialogTitle>Delete {selectedIds.length} members?</DialogTitle>
              <p className="text-sm text-muted-foreground">
                Members will be archived and removed from the active directory.
              </p>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" onClick={() => setDialog(null)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  disabled={pending}
                  onClick={() =>
                    runBulk({ ids: selectedIds, action: { type: "delete" } })
                  }
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
