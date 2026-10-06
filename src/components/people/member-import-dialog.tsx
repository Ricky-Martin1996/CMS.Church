"use client";

import { useRef, useState, useTransition } from "react";
import { FileSpreadsheet, Loader2, Upload } from "lucide-react";
import {
  importMembersCsvAction,
  previewMemberImportAction,
} from "@/application/people/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

type PreviewRow = {
  lineNumber: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: string;
  campus: string;
  ministryRole: string;
  tags: string;
};

type PreviewData = {
  headers: string[];
  rowCount: number;
  skipped: number;
  issues: Array<{ lineNumber: number; message: string }>;
  preview: PreviewRow[];
};

async function fileToPayload(file: File): Promise<{
  filename: string;
  text?: string;
  base64?: string;
}> {
  const filename = file.name;
  const lower = filename.toLowerCase();
  if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]!);
    }
    return { filename, base64: btoa(binary) };
  }
  const text = await file.text();
  return { filename, text };
}

export function MemberImportDialog({
  onImported,
  trigger,
}: {
  onImported: (summary: {
    created: number;
    skipped: number;
    message: string;
  }) => void;
  trigger?: React.ReactNode;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<{
    filename: string;
    text?: string;
    base64?: string;
  } | null>(null);
  const [preview, setPreview] = useState<PreviewData | null>(null);

  const reset = () => {
    setError(null);
    setPayload(null);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const onPickFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setPreview(null);
    try {
      const next = await fileToPayload(file);
      setPayload(next);
      startTransition(async () => {
        const res = await previewMemberImportAction(next);
        if (!res.ok) {
          setError(res.error);
          return;
        }
        setPreview(res.data);
        setOpen(true);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to read file");
    }
  };

  const onConfirmImport = () => {
    if (!payload) return;
    startTransition(async () => {
      setError(null);
      const res = await importMembersCsvAction(payload);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      const created = res.data.created;
      const skipped =
        (res.data.skipped ?? 0) + (res.data.duplicates ?? 0);
      setOpen(false);
      reset();
      onImported({
        created,
        skipped,
        message: `Imported ${created} member${created === 1 ? "" : "s"}${
          skipped ? ` (${skipped} skipped)` : ""
        }.`,
      });
    });
  };

  return (
    <>
      <label className="cursor-pointer">
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
          className="sr-only"
          onChange={(e) => {
            void onPickFile(e.target.files?.[0]);
          }}
        />
        {trigger ?? (
          <Button variant="glass" size="sm" asChild disabled={pending}>
            <span>
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Import CSV / Excel
            </span>
          </Button>
        )}
      </label>

      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) reset();
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Import preview
            {payload?.filename ? (
              <span className="text-sm font-normal text-muted-foreground">
                — {payload.filename}
              </span>
            ) : null}
          </DialogTitle>

          {error && (
            <p className="mt-3 text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          {preview && (
            <div className="mt-4 space-y-4">
              <p className="text-sm text-muted-foreground">
                {preview.rowCount} valid row
                {preview.rowCount === 1 ? "" : "s"} ready to import
                {preview.skipped
                  ? ` · ${preview.skipped} skipped`
                  : ""}
                {preview.issues.length
                  ? ` · ${preview.issues.length} validation note${
                      preview.issues.length === 1 ? "" : "s"
                    }`
                  : ""}
              </p>

              {preview.issues.length > 0 && (
                <ul className="max-h-28 overflow-auto rounded-xl border border-border/60 bg-background/40 p-3 text-xs text-muted-foreground">
                  {preview.issues.map((issue, idx) => (
                    <li key={`${issue.lineNumber}-${idx}`}>
                      Line {issue.lineNumber}: {issue.message}
                    </li>
                  ))}
                </ul>
              )}

              <div className="max-h-72 overflow-auto rounded-xl border border-border/60">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-background/90">
                    <tr>
                      <th className="px-3 py-2">#</th>
                      <th className="px-3 py-2">First</th>
                      <th className="px-3 py-2">Last</th>
                      <th className="px-3 py-2">Email</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Campus</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.preview.map((row) => (
                      <tr
                        key={row.lineNumber}
                        className="border-t border-border/40"
                      >
                        <td className="px-3 py-1.5 text-muted-foreground">
                          {row.lineNumber}
                        </td>
                        <td className="px-3 py-1.5">{row.firstName}</td>
                        <td className="px-3 py-1.5">{row.lastName}</td>
                        <td className="px-3 py-1.5">{row.email || "—"}</td>
                        <td className="px-3 py-1.5">{row.status || "—"}</td>
                        <td className="px-3 py-1.5">{row.campus || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setOpen(false)}
                  disabled={pending}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="glow"
                  disabled={pending || preview.rowCount === 0}
                  onClick={onConfirmImport}
                >
                  {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Import {preview.rowCount} member
                  {preview.rowCount === 1 ? "" : "s"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
