export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "church";
}

export function uniqueSlug(base: string, suffix?: string): string {
  const root = slugify(base);
  if (!suffix) return root;
  return `${root}-${slugify(suffix)}`.slice(0, 60);
}
