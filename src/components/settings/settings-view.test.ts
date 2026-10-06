import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";

describe("BUG-009 settings church profile does not fake persistence", () => {
  it("Save changes surfaces that profile is not persisted", () => {
    const source = readFileSync(
      join(process.cwd(), "src/components/settings/settings-view.tsx"),
      "utf8"
    );
    assert.match(source, /not available yet/i);
    assert.match(source, /no changes were stored/i);
    assert.match(source, /disabled/);
  });
});
