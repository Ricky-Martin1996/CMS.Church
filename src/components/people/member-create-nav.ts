/**
 * BUG-002: Member create appeared to hang after Save because we called
 * `router.push` in the same turn as closing a Radix Dialog. RemoveScroll
 * still held the body lock (`overflow: hidden` / pointer blocking), so the
 * next page looked frozen.
 *
 * Defer navigation until after paint so Dialog teardown can finish.
 */
export function deferAfterDialogClose(run: () => void): void {
  if (typeof requestAnimationFrame === "undefined") {
    setTimeout(run, 0);
    return;
  }
  requestAnimationFrame(() => {
    requestAnimationFrame(run);
  });
}

export function memberProfilePath(
  memberId: string,
  options?: { created?: boolean }
): string {
  const base = `/people/${memberId}`;
  return options?.created ? `${base}?created=1` : base;
}
