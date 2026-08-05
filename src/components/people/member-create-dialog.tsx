"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { createMemberAction, listTagsAction } from "@/application/people/actions";
import { Button } from "@/components/ui/button";
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
import { MemberLifecycle, MemberStatus } from "@/domain/enums/member";
import type { TagEntity } from "@/domain/entities/member";
import { useRouter } from "next/navigation";

export function MemberCreateDialog({
  trigger,
  onCreated,
}: {
  trigger: React.ReactNode;
  onCreated?: (memberId: string) => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [tags, setTags] = useState<TagEntity[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [status, setStatus] = useState<MemberStatus>(MemberStatus.ACTIVE);
  const [lifecycle, setLifecycle] = useState<MemberLifecycle>(
    MemberLifecycle.MEMBER
  );

  const loadTags = () => {
    listTagsAction().then((res) => {
      if (res.ok) setTags(res.data);
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v) {
          setError(null);
          loadTags();
        }
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogTitle>Add member</DialogTitle>
        <form
          className="mt-4 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            startTransition(async () => {
              setError(null);
              const res = await createMemberAction({
                firstName: String(fd.get("firstName") ?? ""),
                lastName: String(fd.get("lastName") ?? ""),
                email: String(fd.get("email") ?? ""),
                phone: String(fd.get("phone") ?? "") || undefined,
                whatsapp: String(fd.get("whatsapp") ?? "") || undefined,
                status,
                lifecycle,
                campus: String(fd.get("campus") ?? "") || undefined,
                ministryRole: String(fd.get("ministryRole") ?? "") || undefined,
                tagIds: selectedTags.length ? selectedTags : undefined,
              });
              if (!res.ok) {
                setError(res.error);
                return;
              }
              setOpen(false);
              onCreated?.(res.data.id);
              router.push(`/people/${res.data.id}`);
            });
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First name</Label>
              <Input id="firstName" name="firstName" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last name</Label>
              <Input id="lastName" name="lastName" required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input id="whatsapp" name="whatsapp" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as MemberStatus)}>
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
            </div>
            <div className="space-y-2">
              <Label>Lifecycle</Label>
              <Select
                value={lifecycle}
                onValueChange={(v) => setLifecycle(v as MemberLifecycle)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(MemberLifecycle).map((l) => (
                    <SelectItem key={l} value={l}>
                      {l.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="campus">Campus</Label>
              <Input id="campus" name="campus" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ministryRole">Ministry role</Label>
              <Input id="ministryRole" name="ministryRole" />
            </div>
          </div>
          {tags.length > 0 && (
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => {
                  const active = selectedTags.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() =>
                        setSelectedTags((prev) =>
                          active
                            ? prev.filter((id) => id !== tag.id)
                            : [...prev, tag.id]
                        )
                      }
                      className="rounded-xl border px-2.5 py-1 text-xs font-medium transition-colors"
                      style={{
                        borderColor: active ? tag.color : undefined,
                        backgroundColor: active ? `${tag.color}22` : undefined,
                      }}
                    >
                      {tag.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" variant="glow" disabled={pending}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              Create member
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
