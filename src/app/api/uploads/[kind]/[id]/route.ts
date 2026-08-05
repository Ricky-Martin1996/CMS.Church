import { NextResponse } from "next/server";
import { Permission } from "@/domain/permissions/rbac";
import {
  documentRepository,
} from "@/infrastructure/repositories";
import { householdDocumentRepository } from "@/infrastructure/repositories/household-supporting";
import { requirePermission } from "@/server/auth/session";
import { handleRouteError } from "@/server/http";
import { readPrivateUpload } from "@/server/security/uploads";
import type { UploadKind } from "@/server/security/uploads";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ kind: string; id: string }>;
};

function isUploadKind(value: string): value is UploadKind {
  return value === "members" || value === "households";
}

/**
 * Auth-gated document download. Files live outside `public/` and are only
 * served after tenant + permission checks.
 */
export async function GET(_req: Request, context: RouteContext) {
  try {
    const { kind, id } = await context.params;
    if (!isUploadKind(kind)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const permission =
      kind === "members"
        ? Permission.PEOPLE_DOCUMENTS
        : Permission.HOUSEHOLDS_READ;
    const ctx = await requirePermission(permission);

    const document =
      kind === "members"
        ? await documentRepository.getById(ctx.organization.id, id)
        : await householdDocumentRepository.getById(ctx.organization.id, id);

    if (!document) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const bytes = await readPrivateUpload(document.storageKey);
    const headers = new Headers();
    headers.set(
      "Content-Type",
      document.mimeType || "application/octet-stream"
    );
    headers.set(
      "Content-Disposition",
      `inline; filename="${document.name.replace(/"/g, "")}"`
    );
    headers.set("Cache-Control", "private, no-store");
    headers.set("X-Content-Type-Options", "nosniff");

    return new NextResponse(new Uint8Array(bytes), { status: 200, headers });
  } catch (error) {
    return handleRouteError(error);
  }
}
