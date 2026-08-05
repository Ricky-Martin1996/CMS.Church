"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Copy,
  Mail,
  MoreHorizontal,
  Plus,
  Search,
  UserRound,
  Users,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EmptyState } from "@/components/shared/states";
import { PageHeader } from "@/components/shared/page-header";
import { FadeIn } from "@/components/motion/page-transition";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { people, type Person } from "@/lib/data";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { duration, easeOut } from "@/lib/motion";

const statusVariant = {
  active: "success",
  visitor: "default",
  inactive: "muted",
} as const;

const filters = ["All", "Active", "Visitor", "Inactive"] as const;

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);
}

export function PeopleView() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const { toast } = useToast();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return people.filter((p) => {
      const matchesFilter =
        filter === "All" || p.status === filter.toLowerCase();
      const matchesQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        p.role.toLowerCase().includes(q) ||
        p.campus.toLowerCase().includes(q);
      return matchesFilter && matchesQuery;
    });
  }, [query, filter]);

  const featured = filtered.slice(0, 3);
  const rest = filtered.slice(3);

  const copyEmail = (person: Person) => {
    void navigator.clipboard?.writeText(person.email);
    toast({
      title: "Email copied",
      description: person.email,
      tone: "success",
    });
  };

  return (
    <div className="page-pad">
      <FadeIn>
        <PageHeader
          eyebrow="Directory"
          title="People"
          description="Members, visitors, and ministry leaders — a calm map of belonging."
          actions={
            <Button variant="glow">
              <Plus className="h-4 w-4" />
              Add person
            </Button>
          }
        />
      </FadeIn>

      <FadeIn delay={0.06}>
        <div className="glass-strong flex flex-col gap-4 rounded-[1.5rem] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, role, campus…"
              className="pl-10"
              aria-label="Search people"
            />
          </div>
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Status filters">
            {filters.map((f) => (
              <button
                key={f}
                type="button"
                role="tab"
                aria-selected={filter === f}
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded-xl px-3 py-1.5 text-xs font-medium transition-all duration-200",
                  filter === f
                    ? "bg-primary text-primary-foreground shadow-[var(--shadow-glow)]"
                    : "bg-background/40 text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </FadeIn>

      {filtered.length === 0 ? (
        <div className="glass rounded-[1.5rem]">
          <EmptyState
            icon={Users}
            title="No people found"
            description="Try a different name, role, campus, or status filter."
            action={{
              label: "Clear filters",
              onClick: () => {
                setQuery("");
                setFilter("All");
              },
            }}
          />
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            {featured.map((person, i) => (
              <motion.article
                key={person.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 + i * 0.04, duration: duration.slow, ease: easeOut }}
                className="group relative overflow-hidden glass rounded-[1.5rem] p-5 hover-lift"
              >
                <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/12 blur-2xl" />
                <div className="relative flex flex-col gap-4">
                  <Avatar className="h-14 w-14 rounded-[1.15rem]">
                    <AvatarFallback className="rounded-[1.15rem] text-base">
                      {initials(person.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="font-display text-lg font-semibold">
                      {person.name}
                    </h2>
                    <p className="text-sm text-muted-foreground">{person.role}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{person.campus}</Badge>
                    <Badge variant={statusVariant[person.status]}>
                      {person.status}
                    </Badge>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {person.email}
                  </p>
                </div>
              </motion.article>
            ))}
          </div>

          {rest.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16, duration: duration.slow, ease: easeOut }}
              className="glass overflow-hidden rounded-[1.5rem]"
            >
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Person</TableHead>
                    <TableHead className="hidden sm:table-cell">Role</TableHead>
                    <TableHead className="hidden md:table-cell">Campus</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-12">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rest.map((person) => (
                    <ContextMenu key={person.id}>
                      <ContextMenuTrigger asChild>
                        <TableRow>
                          <TableCell>
                            <div className="flex min-w-0 items-center gap-3">
                              <Avatar className="h-9 w-9">
                                <AvatarFallback className="text-xs">
                                  {initials(person.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="truncate font-medium">{person.name}</p>
                                <p className="truncate text-xs text-muted-foreground">
                                  {person.email}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden text-muted-foreground sm:table-cell">
                            {person.role}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <Badge variant="outline">{person.campus}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusVariant[person.status]}>
                              {person.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  aria-label={`Actions for ${person.name}`}
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => copyEmail(person)}>
                                  <Copy className="h-4 w-4" />
                                  Copy email
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Mail className="h-4 w-4" />
                                  Send message
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                  <UserRound className="h-4 w-4" />
                                  View profile
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      </ContextMenuTrigger>
                      <ContextMenuContent>
                        <ContextMenuItem onClick={() => copyEmail(person)}>
                          <Copy className="h-4 w-4" />
                          Copy email
                        </ContextMenuItem>
                        <ContextMenuItem>
                          <Mail className="h-4 w-4" />
                          Send message
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                        <ContextMenuItem>
                          <UserRound className="h-4 w-4" />
                          View profile
                        </ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>
                  ))}
                </TableBody>
              </Table>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
