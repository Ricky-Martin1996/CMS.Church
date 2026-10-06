import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { executiveDashboardCacheKey } from "@/application/intelligence/dashboard-cache-key";

describe("BUG-006 dashboard cache key isolation", () => {
  it("includes userId so greetings cannot leak across users", () => {
    const a = executiveDashboardCacheKey({
      organizationId: "org_1",
      role: "PASTOR",
      userId: "user_a",
    });
    const b = executiveDashboardCacheKey({
      organizationId: "org_1",
      role: "PASTOR",
      userId: "user_b",
    });
    assert.notDeepEqual(a, b);
    assert.ok(a.includes("user_a"));
    assert.ok(b.includes("user_b"));
  });

  it("still scopes by organization and role", () => {
    const key = executiveDashboardCacheKey({
      organizationId: "org_9",
      role: "CHURCH_ADMIN",
      userId: "user_x",
    });
    assert.deepEqual(key, [
      "executive-dashboard",
      "org_9",
      "CHURCH_ADMIN",
      "user_x",
    ]);
  });
});
