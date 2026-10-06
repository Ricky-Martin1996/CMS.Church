/**
 * After closing a Radix Dialog, navigation in the same turn can race
 * RemoveScroll's body lock (`overflow: hidden` / pointer blocking), so the
 * next page appears frozen. Defer until after paint so teardown finishes.
 *
 * Used by household (BUG-004) and member (BUG-002) create dialogs.
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

export function householdProfilePath(householdId: string): string {
  return `/households/${householdId}`;
}
