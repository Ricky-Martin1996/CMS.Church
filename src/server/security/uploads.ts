import { mkdir, writeFile, readFile, access } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { AppError } from "@/server/errors";

/** Private upload root — never under `public/`. */
export const UPLOAD_ROOT = path.join(process.cwd(), ".data", "uploads");

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "text/plain",
  "text/csv",
  "application/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const ALLOWED_EXTENSIONS = new Set([
  ".pdf",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".txt",
  ".csv",
  ".doc",
  ".docx",
]);

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

export type UploadKind = "members" | "households";

export function sanitizeUploadFileName(name: string): string {
  const base = path.basename(name).replace(/[^\w.\-()+ ]+/g, "_").trim();
  const trimmed = base.slice(0, 120) || "file";
  return trimmed;
}

export function assertAllowedUpload(file: File): {
  mimeType: string;
  safeName: string;
} {
  if (file.size <= 0) {
    throw new AppError("Empty file", "VALIDATION", 400);
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new AppError("File too large (max 8MB)", "VALIDATION", 400);
  }

  const safeName = sanitizeUploadFileName(file.name);
  const ext = path.extname(safeName).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    throw new AppError(
      "File type not allowed. Use PDF, images, TXT, CSV, or Word documents.",
      "VALIDATION",
      400
    );
  }

  const mimeType = (file.type || "").toLowerCase();
  // Browsers sometimes omit type — fall back to extension allowlist only.
  if (mimeType && !ALLOWED_MIME_TYPES.has(mimeType)) {
    throw new AppError(
      "File MIME type not allowed",
      "VALIDATION",
      400
    );
  }

  return {
    mimeType: mimeType || guessMimeFromExt(ext),
    safeName,
  };
}

function guessMimeFromExt(ext: string): string {
  switch (ext) {
    case ".pdf":
      return "application/pdf";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    case ".txt":
      return "text/plain";
    case ".csv":
      return "text/csv";
    case ".doc":
      return "application/msword";
    case ".docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    default:
      return "application/octet-stream";
  }
}

/**
 * Persist an uploaded file outside the public web root.
 * Returns a relative storage key used for later auth-gated reads.
 */
export async function storePrivateUpload(input: {
  kind: UploadKind;
  organizationId: string;
  ownerId: string;
  file: File;
}): Promise<{
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
  name: string;
  absolutePath: string;
}> {
  const { mimeType, safeName } = assertAllowedUpload(input.file);
  const storageKey = path.posix.join(
    input.kind,
    input.organizationId,
    input.ownerId,
    `${randomUUID()}-${safeName}`
  );

  const absolutePath = path.join(UPLOAD_ROOT, ...storageKey.split("/"));
  await mkdir(path.dirname(absolutePath), { recursive: true });
  const bytes = Buffer.from(await input.file.arrayBuffer());
  await writeFile(absolutePath, bytes, { mode: 0o600 });

  return {
    storageKey,
    mimeType,
    sizeBytes: input.file.size,
    name: safeName,
    absolutePath,
  };
}

export function absolutePathForStorageKey(storageKey: string): string {
  const normalized = storageKey.replace(/\\/g, "/");
  if (
    normalized.includes("..") ||
    normalized.startsWith("/") ||
    !/^(members|households)\//.test(normalized)
  ) {
    throw new AppError("Invalid storage key", "VALIDATION", 400);
  }
  return path.join(UPLOAD_ROOT, ...normalized.split("/"));
}

export async function readPrivateUpload(storageKey: string): Promise<Buffer> {
  const absolutePath = absolutePathForStorageKey(storageKey);
  try {
    await access(absolutePath);
  } catch {
    throw new AppError("File not found", "NOT_FOUND", 404);
  }
  return readFile(absolutePath);
}

export function publicDownloadPath(kind: UploadKind, documentId: string): string {
  return `/api/uploads/${kind}/${documentId}`;
}
