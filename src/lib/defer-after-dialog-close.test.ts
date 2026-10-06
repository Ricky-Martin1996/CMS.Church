import assert from "node:assert/strict";
import { after, describe, it } from "node:test";
import { createHousehold } from "@/application/households/household-service";
import {
  deferAfterDialogClose,
  householdProfilePath,
} from "@/lib/defer-after-dialog-close";
import { HouseholdStatus } from "@/domain/enums/member";
import { prisma } from "@/infrastructure/db/prisma";

describe("BUG-004 household create hang", () => {
  after(async () => {
    await prisma.$disconnect();
  });

  it("householdProfilePath points at the profile route", () => {
    assert.equal(householdProfilePath("hh_123"), "/households/hh_123");
  });

  it("deferAfterDialogClose runs after the current turn (post RemoveScroll)", async () => {
    const order: string[] = [];
    order.push("sync");
    await new Promise<void>((resolve) => {
      deferAfterDialogClose(() => {
        order.push("deferred");
        resolve();
      });
      order.push("after-schedule");
    });
    assert.deepEqual(order, ["sync", "after-schedule", "deferred"]);
  });

  it("createHousehold persists without hanging", async () => {
    const suffix = Date.now().toString(36);
    const org = await prisma.organization.upsert({
      where: { slug: `bug004-hh-${suffix}` },
      update: {},
      create: { name: "BUG004 Household", slug: `bug004-hh-${suffix}` },
    });
    const user = await prisma.user.upsert({
      where: { clerkUserId: `user_bug004_${suffix}` },
      update: {},
      create: {
        clerkUserId: `user_bug004_${suffix}`,
        email: `bug004-${suffix}@example.com`,
        firstName: "Bug",
        lastName: "Four",
      },
    });

    const started = Date.now();
    const household = await createHousehold({
      organizationId: org.id,
      actorUserId: user.id,
      familyName: "Smith",
      status: HouseholdStatus.ACTIVE,
    });
    const elapsed = Date.now() - started;

    assert.ok(household.id);
    assert.equal(household.familyName, "Smith");
    assert.ok(elapsed < 5_000, `createHousehold hung (${elapsed}ms)`);
    assert.equal(householdProfilePath(household.id), `/households/${household.id}`);
  });
});
