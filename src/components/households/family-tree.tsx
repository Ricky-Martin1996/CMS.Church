"use client";

import Link from "next/link";
import { motion, LayoutGroup } from "framer-motion";
import { Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  FAMILY_RELATION_LABELS,
  FamilyRelation,
} from "@/domain/enums/member";
import { cn } from "@/lib/utils";
import { getInitials, memberDisplayName } from "@/components/households/utils";

type TreeMember = {
  id: string;
  memberId: string;
  relation: FamilyRelation;
  isPrimary: boolean;
  member?: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
};

function categorizeMembers(memberships: TreeMember[]) {
  const head = memberships.find(
    (m) => m.relation === FamilyRelation.HEAD || m.isPrimary
  );
  const spouses = memberships.filter((m) =>
    [
      FamilyRelation.HUSBAND,
      FamilyRelation.WIFE,
      FamilyRelation.SPOUSE,
    ].includes(m.relation)
  );
  const children = memberships.filter((m) =>
    [
      FamilyRelation.SON,
      FamilyRelation.DAUGHTER,
      FamilyRelation.CHILD,
    ].includes(m.relation)
  );
  const elders = memberships.filter((m) =>
    [FamilyRelation.PARENT, FamilyRelation.GRANDPARENT].includes(m.relation)
  );
  const others = memberships.filter((m) => {
    if (head && m.id === head.id) return false;
    if (spouses.some((s) => s.id === m.id)) return false;
    if (children.some((c) => c.id === m.id)) return false;
    if (elders.some((e) => e.id === m.id)) return false;
    return true;
  });
  return { head, spouses, children, elders, others };
}

function TreeNode({
  membership,
  highlight,
}: {
  membership: TreeMember;
  highlight?: boolean;
}) {
  const name = memberDisplayName(membership.member);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.03 }}
      className={cn(
        "group relative flex w-36 flex-col items-center gap-2 rounded-2xl border border-border/40 bg-background/30 p-4 backdrop-blur-md transition-shadow",
        highlight && "border-primary/50 shadow-[var(--shadow-glow)]"
      )}
    >
      <Link
        href={`/people/${membership.memberId}`}
        className="flex flex-col items-center gap-2 text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-label={`View ${name}`}
      >
        <Avatar className="h-14 w-14 border-2 border-background/80">
          {membership.member?.avatarUrl && (
            <AvatarImage src={membership.member.avatarUrl} alt="" />
          )}
          <AvatarFallback>{getInitials(name)}</AvatarFallback>
        </Avatar>
        <p className="line-clamp-2 text-sm font-medium leading-tight">{name}</p>
      </Link>
      <Badge variant="outline" className="text-[10px]">
        {FAMILY_RELATION_LABELS[membership.relation]}
      </Badge>
      {membership.isPrimary && (
        <span className="absolute -top-1.5 right-2 rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-semibold text-primary-foreground">
          Head
        </span>
      )}
    </motion.div>
  );
}

function TreeRow({
  members,
  className,
}: {
  members: TreeMember[];
  className?: string;
}) {
  if (!members.length) return null;
  return (
    <motion.div
      layout
      className={cn("flex flex-wrap items-start justify-center gap-4", className)}
    >
      {members.map((m) => (
        <TreeNode
          key={m.id}
          membership={m}
          highlight={
            m.relation === FamilyRelation.HEAD || m.isPrimary
          }
        />
      ))}
    </motion.div>
  );
}

function ConnectorLines({
  fromCount,
  toCount,
}: {
  fromCount: number;
  toCount: number;
}) {
  if (fromCount === 0 || toCount === 0) return null;
  const width = Math.max(fromCount, toCount) * 160;
  return (
    <svg
      className="mx-auto block text-border/60"
      width={width}
      height={48}
      aria-hidden
    >
      <line
        x1={width / 2}
        y1={0}
        x2={width / 2}
        y2={24}
        stroke="currentColor"
        strokeWidth={1.5}
      />
      <line
        x1={width * 0.2}
        y1={24}
        x2={width * 0.8}
        y2={24}
        stroke="currentColor"
        strokeWidth={1.5}
      />
      {Array.from({ length: toCount }).map((_, i) => {
        const x = ((i + 0.5) / toCount) * width;
        return (
          <line
            key={i}
            x1={x}
            y1={24}
            x2={x}
            y2={48}
            stroke="currentColor"
            strokeWidth={1.5}
          />
        );
      })}
    </svg>
  );
}

export function FamilyTree({
  memberships,
  className,
}: {
  memberships: TreeMember[];
  className?: string;
}) {
  if (memberships.length <= 1) {
    const solo = memberships[0];
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center rounded-[1.75rem] glass px-6 py-16 text-center",
          className
        )}
      >
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <Users className="h-8 w-8 text-primary" />
        </div>
        <h3 className="font-display text-lg font-semibold">Growing family tree</h3>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          {solo
            ? `Add more members to ${memberDisplayName(solo.member)}'s household to visualize family connections.`
            : "Add members to this household to build your family tree."}
        </p>
        {solo && (
          <div className="mt-6">
            <TreeNode membership={solo} highlight />
          </div>
        )}
      </div>
    );
  }

  const { head, spouses, children, elders, others } =
    categorizeMembers(memberships);

  const headRow = head ? [head] : [];
  const spouseRow = spouses.filter((s) => s.id !== head?.id);

  return (
    <LayoutGroup>
      <div
        className={cn(
          "overflow-x-auto rounded-[1.75rem] glass-strong p-6 sm:p-8",
          className
        )}
      >
        <div className="min-w-[320px] space-y-2">
          <TreeRow members={elders} />
          {elders.length > 0 && (headRow.length > 0 || spouseRow.length > 0) && (
            <ConnectorLines fromCount={elders.length} toCount={headRow.length + spouseRow.length || 1} />
          )}

          <TreeRow members={headRow} />
          {headRow.length > 0 && spouseRow.length > 0 && (
            <ConnectorLines fromCount={1} toCount={spouseRow.length} />
          )}
          <TreeRow members={spouseRow} />

          {(headRow.length > 0 || spouseRow.length > 0) && children.length > 0 && (
            <ConnectorLines
              fromCount={Math.max(headRow.length, spouseRow.length, 1)}
              toCount={children.length}
            />
          )}
          <TreeRow members={children} />

          {others.length > 0 && (
            <>
              <ConnectorLines fromCount={1} toCount={others.length} />
              <TreeRow members={others} className="opacity-90" />
            </>
          )}
        </div>
      </div>
    </LayoutGroup>
  );
}
