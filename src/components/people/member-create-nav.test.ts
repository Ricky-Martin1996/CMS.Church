import assert from "node:assert/strict";
import { after, describe, it } from "node:test";
import { createMember } from "@/application/people/member-service";
import {
  deferAfterDialogClose,
  memberProfilePath,
} from "@/components/people/member-create-nav";
import {
  MemberLifecycle,
  MemberStatus,
} from "@/domain/enums/member";
import { prisma } from "@/infrastructure/db/prisma";

describe("BUG-002 member create hang", () => {
  after(async () => {
    await prisma.$disconnect();
  });

  it("memberProfilePath points at the profile route", () => {
    assert.equal(memberProfilePath("mem_123"), "/people/mem_123");
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

  it("createMember persists member + activity without hanging", async () => {
    const suffix = Date.now().toString(36);
    const org = await prisma.organization.upsert({
      where: { slug: `bug002-test-${suffix}` },
      update: {},
      create: { name: "BUG002 Test", slug: `bug002-test-${suffix}` },
    });
    const user = await prisma.user.upsert({
      where: { clerkUserId: `user_bug002_${suffix}` },
      update: {},
      create: {
        clerkUserId: `user_bug002_${suffix}`,
        email: `bug002-${suffix}@example.com`,
        firstName: "Bug",
        lastName: "Two",
      },
    });

    const started = Date.now();
    const member = await createMember({
      organizationId: org.id,
      actorUserId: user.id,
      firstName: "Ada",
      lastName: "Lovelace",
      email: `ada-${suffix}@example.com`,
      phone: null,
      whatsapp: null,
      status: MemberStatus.ACTIVE,
      lifecycle: MemberLifecycle.MEMBER,
      campus: null,
      ministryRole: null,
      joinedAt: new Date(),
    });
    const elapsed = Date.now() - started;

    assert.ok(member.id);
    assert.equal(member.firstName, "Ada");
    assert.ok(elapsed < 5_000, `createMember hung (${elapsed}ms)`);

    const activity = await prisma.memberActivity.findFirst({
      where: { memberId: member.id, type: "CREATED" },
    });
    assert.ok(activity, "CREATED activity missing");
  });
});
