"use client";

import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { HouseholdCheckInPreview } from "@/domain/entities/attendance";
import { getInitials } from "@/components/attendance/utils";
import { cn } from "@/lib/utils";

export function HouseholdCheckinPanel({
  preview,
  onSubmit,
  onCancel,
  pending,
}: {
  preview: HouseholdCheckInPreview;
  onSubmit: (memberIds: string[]) => void;
  onCancel?: () => void;
  pending?: boolean;
}) {
  const [selected, setSelected] = useState<Set<string>>(() => {
    const unchecked = preview.members
      .filter((m) => !m.alreadyCheckedIn)
      .map((m) => m.memberId);
    return new Set(unchecked);
  });

  useEffect(() => {
    const unchecked = preview.members
      .filter((m) => !m.alreadyCheckedIn)
      .map((m) => m.memberId);
    setSelected(new Set(unchecked));
  }, [preview]);

  const toggle = (memberId: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(memberId);
      else next.delete(memberId);
      return next;
    });
  };

  const checkAll = () => {
    const ids = preview.members
      .filter((m) => !m.alreadyCheckedIn)
      .map((m) => m.memberId);
    setSelected(new Set(ids));
  };

  const uncheckAll = () => setSelected(new Set());

  const eligible = preview.members.filter((m) => !m.alreadyCheckedIn);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-display text-lg font-semibold">
            {preview.familyName}
          </p>
          <p className="text-sm text-muted-foreground">
            {preview.householdCode} · {preview.checkedInCount}/
            {preview.totalCount} already in
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={checkAll}>
            Check all
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={uncheckAll}>
            Uncheck all
          </Button>
        </div>
      </div>

      <ul className="space-y-2">
        {preview.members.map((member) => {
          const isCheckedIn = member.alreadyCheckedIn;
          const isSelected = selected.has(member.memberId);

          return (
            <li
              key={member.memberId}
              className={cn(
                "flex items-center gap-3 rounded-2xl border border-border/60 p-3 transition-colors",
                isCheckedIn && "opacity-60",
                isSelected && !isCheckedIn && "border-primary/30 bg-primary/5"
              )}
            >
              <Avatar className="h-11 w-11 rounded-xl">
                {member.avatarUrl && (
                  <AvatarImage src={member.avatarUrl} alt="" />
                )}
                <AvatarFallback className="rounded-xl text-sm">
                  {getInitials(member.firstName, member.lastName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="font-medium">
                  {member.firstName} {member.lastName}
                </p>
                {member.relation && (
                  <p className="text-xs text-muted-foreground">
                    {member.relation}
                  </p>
                )}
              </div>
              {isCheckedIn ? (
                <span className="flex items-center gap-1 text-xs text-success">
                  <Check className="h-3.5 w-3.5" />
                  In
                </span>
              ) : (
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={(v) =>
                    toggle(member.memberId, v === true)
                  }
                  aria-label={`Check in ${member.firstName} ${member.lastName}`}
                />
              )}
            </li>
          );
        })}
      </ul>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="glow"
          className="flex-1 sm:flex-none"
          disabled={pending || selected.size === 0}
          onClick={() => onSubmit([...selected])}
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          Check in {selected.size || ""}
          {selected.size === 1 ? " person" : selected.size ? " people" : ""}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>

      {eligible.length === 0 && (
        <p className="text-center text-sm text-muted-foreground">
          Everyone in this household is already checked in.
        </p>
      )}
    </div>
  );
}
