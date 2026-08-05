/**
 * Prevent CSS injection via `url(...)` background images.
 * Rejects values that could break out of a CSS url() context.
 */
export function safeCssUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > 2048) return null;
  if (/[\\'"()<>\s\n\r\t]/.test(trimmed)) return null;

  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.href;
  } catch {
    return null;
  }
}

/** Safe CSS `background-image` value, or undefined when the URL is rejected. */
export function safeBackgroundImage(
  raw: string | null | undefined
): string | undefined {
  const url = safeCssUrl(raw);
  if (!url) return undefined;
  return `url(${JSON.stringify(url)})`;
}
