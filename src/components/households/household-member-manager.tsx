"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import {
  GitMerge,
  GitBranch,
  Loader2,
  Plus,
  Trash2,
  UserCog,
  Users,
} from "lucide-react";
import {
  addMemberToHouseholdAction,
  assignRelationAction,
  changeHouseholdHeadAction,
  mergeHouseholdsAction,
  moveMemberBetweenHouseholdsAction,
  removeMemberFromHouseholdAction,
  splitHouseholdAction,
} from "@/application/households/actions";
import { listMembersAction } from "@/application/people/actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
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
import {
  FAMILY_RELATION_LABELS,
  FamilyRelation,
} from "@/domain/enums/member";
import type { HouseholdMembershipEntity } from "@/domain/entities/household";
import { getInitials, memberDisplayName } from "@/components/households/utils";

type SerializedMembership = Omit<
  HouseholdMembershipEntity,
  "createdAt" | "updatedAt"
> & {
  createdAt: string;
  updatedAt: string;
};

export function HouseholdMemberManager({
  householdId,
  familyName,
  memberships,
  onChanged,
}: {
  householdId: string;
  familyName: string;
  memberships: SerializedMembership[];
  onChanged: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    Array<{ id: string; displayName: string }>
  >([]);

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const t = setTimeout(() => {
      listMembersAction({
        limit: 8,
        filter: { query: searchQuery.trim() },
      }).then((res) => {
        if (res.ok) {
          setSearchResults(
            res.data.items.map((m) => ({
              id: m.id,
              displayName: m.displayName,
            }))
          );
        }
      });
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) => {
    startTransition(async () => {
      setError(null);
      const res = await fn();
      if (!res.ok) {
        setError(res.error ?? "Something went wrong");
        return;
      }
      onChanged();
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-lg font-semibold">Household members</h3>
        <div className="flex flex-wrap gap-2">
          <AddMemberDialog
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchResults={searchResults}
            pending={pending}
            onAdd={(memberId, relation) =>
              run(() =>
                addMemberToHouseholdAction(householdId, { memberId, relation })
              )
            }
          />
          <MergeDialog
            householdId={householdId}
            pending={pending}
            onMerge={(targetId) =>
              run(() =>
                mergeHouseholdsAction({ sourceId: householdId, targetId })
              )
            }
          />
          <SplitDialog
            familyName={familyName}
            memberships={memberships}
            pending={pending}
            onSplit={(memberIds, newFamilyName) =>
              run(() =>
                splitHouseholdAction({
                  sourceHouseholdId: householdId,
                  memberIds,
                  newFamilyName,
                })
              )
            }
          />
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="divide-y divide-border/40 overflow-hidden rounded-[1.25rem] glass">
        {memberships.map((m) => {
          const name = memberDisplayName(m.member);
          return (
            <div
              key={m.id}
              className="flex flex-wrap items-center gap-3 px-4 py-3"
            >
              <Avatar className="h-10 w-10">
                {m.member?.avatarUrl && (
                  <AvatarImage src={m.member.avatarUrl} alt="" />
                )}
                <AvatarFallback>{getInitials(name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/people/${m.memberId}`}
                  className="font-medium hover:underline"
                >
                  {name}
                </Link>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  <Badge variant="outline" className="text-[10px]">
                    {FAMILY_RELATION_LABELS[m.relation]}
                  </Badge>
                  {m.isPrimary && (
                    <Badge variant="default" className="text-[10px]">
                      Head
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                <RelationDialog
                  memberName={name}
                  current={m.relation}
                  pending={pending}
                  onAssign={(relation) =>
                    run(() =>
                      assignRelationAction(householdId, m.memberId, relation)
                    )
                  }
                />
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={pending || m.isPrimary}
                  onClick={() =>
                    run(() =>
                      changeHouseholdHeadAction(householdId, m.memberId)
                    )
                  }
                  aria-label={`Set ${name} as head`}
                >
                  <UserCog className="h-4 w-4" />
                </Button>
                <MoveDialog
                  memberName={name}
                  pending={pending}
                  onMove={(toHouseholdId, relation) =>
                    run(() =>
                      moveMemberBetweenHouseholdsAction({
                        memberId: m.memberId,
                        fromHouseholdId: householdId,
                        toHouseholdId,
                        relation,
                      })
                    )
                  }
                />
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={pending}
                  onClick={() =>
                    run(() =>
                      removeMemberFromHouseholdAction(householdId, m.memberId)
                    )
                  }
                  aria-label={`Remove ${name}`}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          );
        })}
        {memberships.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            No members yet. Add someone to this household.
          </p>
        )}
      </div>
    </div>
  );
}

function AddMemberDialog({
  searchQuery,
  onSearchChange,
  searchResults,
  pending,
  onAdd,
}: {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  searchResults: Array<{ id: string; displayName: string }>;
  pending: boolean;
  onAdd: (memberId: string, relation: FamilyRelation) => void;
}) {
  const [open, setOpen] = useState(false);
  const [relation, setRelation] = useState<FamilyRelation>(FamilyRelation.CHILD);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="glass" size="sm">
          <Plus className="h-4 w-4" />
          Add member
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Add member to household</DialogTitle>
        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="memberSearch">Search members</Label>
            <Input
              id="memberSearch"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Type a name…"
            />
          </div>
          <div className="max-h-40 space-y-1 overflow-y-auto">
            {searchResults.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedId(m.id)}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  selectedId === m.id ? "bg-primary/15" : "hover:bg-accent"
                }`}
              >
                {m.displayName}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            <Label>Relation</Label>
            <Select
              value={relation}
              onValueChange={(v) => setRelation(v as FamilyRelation)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(FamilyRelation).map((r) => (
                  <SelectItem key={r} value={r}>
                    {FAMILY_RELATION_LABELS[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            disabled={!selectedId || pending}
            onClick={() => {
              if (selectedId) {
                onAdd(selectedId, relation);
                setOpen(false);
              }
            }}
          >
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            Add to household
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function RelationDialog({
  memberName,
  current,
  pending,
  onAssign,
}: {
  memberName: string;
  current: FamilyRelation;
  pending: boolean;
  onAssign: (relation: FamilyRelation) => void;
}) {
  const [open, setOpen] = useState(false);
  const [relation, setRelation] = useState(current);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" aria-label={`Change relation for ${memberName}`}>
          <Users className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Change relation — {memberName}</DialogTitle>
        <div className="mt-4 space-y-4">
          <Select
            value={relation}
            onValueChange={(v) => setRelation(v as FamilyRelation)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(FamilyRelation).map((r) => (
                <SelectItem key={r} value={r}>
                  {FAMILY_RELATION_LABELS[r]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            disabled={pending}
            onClick={() => {
              onAssign(relation);
              setOpen(false);
            }}
          >
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            Save relation
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MoveDialog({
  memberName,
  pending,
  onMove,
}: {
  memberName: string;
  pending: boolean;
  onMove: (toHouseholdId: string, relation?: FamilyRelation) => void;
}) {
  const [open, setOpen] = useState(false);
  const [targetId, setTargetId] = useState("");
  const [relation, setRelation] = useState<FamilyRelation>(FamilyRelation.OTHER);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" aria-label={`Move ${memberName}`}>
          Move
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Move {memberName}</DialogTitle>
        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="targetHousehold">Target household ID</Label>
            <Input
              id="targetHousehold"
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              placeholder="Household ID"
            />
          </div>
          <div className="space-y-2">
            <Label>New relation</Label>
            <Select
              value={relation}
              onValueChange={(v) => setRelation(v as FamilyRelation)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(FamilyRelation).map((r) => (
                  <SelectItem key={r} value={r}>
                    {FAMILY_RELATION_LABELS[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            disabled={!targetId.trim() || pending}
            onClick={() => {
              onMove(targetId.trim(), relation);
              setOpen(false);
            }}
          >
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            Move member
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MergeDialog({
  pending,
  onMerge,
}: {
  householdId?: string;
  pending: boolean;
  onMerge: (targetId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [targetId, setTargetId] = useState("");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="glass" size="sm">
          <GitMerge className="h-4 w-4" />
          Merge
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Merge into another household</DialogTitle>
        <p className="text-sm text-muted-foreground">
          This household will be merged into the target. Requires
          HOUSEHOLDS_MERGE permission.
        </p>
        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mergeTarget">Target household ID</Label>
            <Input
              id="mergeTarget"
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
            />
          </div>
          <Button
            variant="destructive"
            disabled={!targetId.trim() || pending}
            onClick={() => {
              onMerge(targetId.trim());
              setOpen(false);
            }}
          >
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            Merge households
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SplitDialog({
  familyName,
  memberships,
  pending,
  onSplit,
}: {
  familyName: string;
  memberships: SerializedMembership[];
  pending: boolean;
  onSplit: (memberIds: string[], newFamilyName: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState(`${familyName} — Split`);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="glass" size="sm">
          <GitBranch className="h-4 w-4" />
          Split
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogTitle>Split household</DialogTitle>
        <p className="text-sm text-muted-foreground">
          Select members to move into a new household.
        </p>
        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newFamilyName">New family name</Label>
            <Input
              id="newFamilyName"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </div>
          <div className="max-h-48 space-y-2 overflow-y-auto">
            {memberships.map((m) => (
              <label
                key={m.memberId}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-accent"
              >
                <Checkbox
                  checked={selected.has(m.memberId)}
                  onCheckedChange={() => toggle(m.memberId)}
                />
                <span className="text-sm">{memberDisplayName(m.member)}</span>
              </label>
            ))}
          </div>
          <Button
            disabled={selected.size === 0 || !newName.trim() || pending}
            onClick={() => {
              onSplit([...selected], newName.trim());
              setOpen(false);
            }}
          >
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            Split selected
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
