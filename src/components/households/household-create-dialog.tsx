"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { createHouseholdAction } from "@/application/households/actions";
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
import { Textarea } from "@/components/ui/textarea";
import { HouseholdStatus } from "@/domain/enums/member";
import { useRouter } from "next/navigation";

export function HouseholdCreateDialog({
  trigger,
  onCreated,
}: {
  trigger: React.ReactNode;
  onCreated?: (householdId: string) => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<HouseholdStatus>(HouseholdStatus.ACTIVE);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v) setError(null);
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogTitle>Create household</DialogTitle>
        <form
          className="mt-4 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            startTransition(async () => {
              setError(null);
              const res = await createHouseholdAction({
                familyName: String(fd.get("familyName") ?? ""),
                householdCode: String(fd.get("householdCode") ?? "") || undefined,
                addressLine1: String(fd.get("addressLine1") ?? "") || undefined,
                city: String(fd.get("city") ?? "") || undefined,
                state: String(fd.get("state") ?? "") || undefined,
                postalCode: String(fd.get("postalCode") ?? "") || undefined,
                country: String(fd.get("country") ?? "") || undefined,
                preferredLanguage:
                  String(fd.get("preferredLanguage") ?? "") || undefined,
                emergencyContact:
                  String(fd.get("emergencyContact") ?? "") || undefined,
                emergencyPhone:
                  String(fd.get("emergencyPhone") ?? "") || undefined,
                cellGroup: String(fd.get("cellGroup") ?? "") || undefined,
                notes: String(fd.get("notes") ?? "") || undefined,
                status,
              });
              if (!res.ok) {
                setError(res.error);
                return;
              }
              setOpen(false);
              onCreated?.(res.data.id);
              router.push(`/households/${res.data.id}`);
            });
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="familyName">Family name</Label>
            <Input id="familyName" name="familyName" required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="householdCode">Household code</Label>
              <Input id="householdCode" name="householdCode" placeholder="Optional" />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as HouseholdStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(HouseholdStatus).map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="addressLine1">Address</Label>
            <Input id="addressLine1" name="addressLine1" />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" name="city" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input id="state" name="state" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="postalCode">Postal code</Label>
              <Input id="postalCode" name="postalCode" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cellGroup">Cell group</Label>
              <Input id="cellGroup" name="cellGroup" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preferredLanguage">Language</Label>
              <Input id="preferredLanguage" name="preferredLanguage" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="emergencyContact">Emergency contact</Label>
              <Input id="emergencyContact" name="emergencyContact" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergencyPhone">Emergency phone</Label>
              <Input id="emergencyPhone" name="emergencyPhone" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" rows={3} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" variant="glow" disabled={pending}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            Create household
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
