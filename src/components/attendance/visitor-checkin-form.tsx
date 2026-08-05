"use client";

import { useEffect, useState } from "react";
import { Loader2, UserPlus } from "lucide-react";
import { searchMembersAction } from "@/application/attendance/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { MemberCheckInSearchResult } from "@/domain/entities/attendance";

function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export type VisitorFormData = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  invitedByMemberId?: string;
  familyName: string;
  childrenCount: number;
  prayerRequest: string;
  notes: string;
};

export function VisitorCheckinForm({
  onSubmit,
  pending,
}: {
  onSubmit: (data: VisitorFormData) => void;
  pending?: boolean;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [childrenCount, setChildrenCount] = useState(0);
  const [prayerRequest, setPrayerRequest] = useState("");
  const [notes, setNotes] = useState("");
  const [invitedQuery, setInvitedQuery] = useState("");
  const [invitedByMemberId, setInvitedByMemberId] = useState<string>();
  const [invitedResults, setInvitedResults] = useState<
    MemberCheckInSearchResult[]
  >([]);

  const debouncedInvited = useDebounce(invitedQuery, 300);

  useEffect(() => {
    if (debouncedInvited.trim().length < 2) {
      setInvitedResults([]);
      return;
    }
    searchMembersAction(debouncedInvited, 5).then((res) => {
      if (res.ok) setInvitedResults(res.data);
    });
  }, [debouncedInvited]);

  const reset = () => {
    setFirstName("");
    setLastName("");
    setPhone("");
    setEmail("");
    setFamilyName("");
    setChildrenCount(0);
    setPrayerRequest("");
    setNotes("");
    setInvitedQuery("");
    setInvitedByMemberId(undefined);
    setInvitedResults([]);
  };

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim(),
          email: email.trim(),
          invitedByMemberId,
          familyName: familyName.trim(),
          childrenCount,
          prayerRequest: prayerRequest.trim(),
          notes: notes.trim(),
        });
        reset();
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="visitor-first">First name</Label>
          <Input
            id="visitor-first"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            autoComplete="given-name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="visitor-last">Last name</Label>
          <Input
            id="visitor-last"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            autoComplete="family-name"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="visitor-phone">Phone</Label>
          <Input
            id="visitor-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="visitor-email">Email</Label>
          <Input
            id="visitor-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="visitor-family">Family name (optional)</Label>
        <Input
          id="visitor-family"
          value={familyName}
          onChange={(e) => setFamilyName(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="visitor-children">Children count</Label>
        <Input
          id="visitor-children"
          type="number"
          min={0}
          value={childrenCount}
          onChange={(e) => setChildrenCount(Number(e.target.value) || 0)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="visitor-invited">Invited by (optional)</Label>
        <Input
          id="visitor-invited"
          value={invitedQuery}
          onChange={(e) => {
            setInvitedQuery(e.target.value);
            setInvitedByMemberId(undefined);
          }}
          placeholder="Search member…"
        />
        {invitedResults.length > 0 && !invitedByMemberId && (
          <ul className="rounded-2xl border border-border/60 bg-muted/30 p-1">
            {invitedResults.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  className="w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-accent"
                  onClick={() => {
                    setInvitedByMemberId(m.id);
                    setInvitedQuery(`${m.firstName} ${m.lastName}`);
                    setInvitedResults([]);
                  }}
                >
                  {m.firstName} {m.lastName}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="visitor-prayer">Prayer request</Label>
        <Textarea
          id="visitor-prayer"
          value={prayerRequest}
          onChange={(e) => setPrayerRequest(e.target.value)}
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="visitor-notes">Notes</Label>
        <Textarea
          id="visitor-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
        />
      </div>

      <Button
        type="submit"
        variant="glow"
        size="lg"
        className="w-full"
        disabled={pending || !firstName.trim() || !lastName.trim()}
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <UserPlus className="h-4 w-4" />
        )}
        Register visitor check-in
      </Button>
    </form>
  );
}
