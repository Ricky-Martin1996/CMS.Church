import assert from "node:assert/strict";
import { after, describe, it } from "node:test";
import { convertVisitorToMember } from "@/application/visitors/visitor-journey-service";
import { VisitorPipelineStage } from "@/domain/enums/visitor";
import { prisma } from "@/infrastructure/db/prisma";
import { AppError } from "@/server/errors";

describe("BUG-007 visitor convert error handling", () => {
  after(async () => {
    await prisma.$disconnect();
  });

  it("rejects already-converted visitors with CONFLICT (not silent success)", async () => {
    const suffix = Date.now().toString(36);
    const org = await prisma.organization.create({
      data: { name: "BUG007 Org", slug: `bug007-${suffix}` },
    });
    const user = await prisma.user.create({
      data: {
        clerkUserId: `user_bug007_${suffix}`,
        email: `bug007-${suffix}@example.com`,
        firstName: "Bug",
        lastName: "Seven",
      },
    });
    const member = await prisma.member.create({
      data: {
        organizationId: org.id,
        firstName: "Existing",
        lastName: "Member",
        joinedAt: new Date(),
      },
    });
    const visitor = await prisma.visitor.create({
      data: {
        organizationId: org.id,
        firstName: "Already",
        lastName: "Converted",
        status: VisitorPipelineStage.MEMBER,
        convertedMemberId: member.id,
      },
    });

    await assert.rejects(
      () =>
        convertVisitorToMember({
          organizationId: org.id,
          visitorId: visitor.id,
          actorUserId: user.id,
        }),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.code, "CONFLICT");
        assert.match(error.message, /already converted/i);
        return true;
      }
    );
  });

  it("converts a visitor and links member id", async () => {
    const suffix = Date.now().toString(36);
    const org = await prisma.organization.create({
      data: { name: "BUG007 Convert Org", slug: `bug007-c-${suffix}` },
    });
    const user = await prisma.user.create({
      data: {
        clerkUserId: `user_bug007c_${suffix}`,
        email: `bug007c-${suffix}@example.com`,
        firstName: "Bug",
        lastName: "Seven",
      },
    });
    const visitor = await prisma.visitor.create({
      data: {
        organizationId: org.id,
        firstName: "New",
        lastName: "Visitor",
        email: `new-visitor-${suffix}@example.com`,
        status: VisitorPipelineStage.FIRST_VISIT,
      },
    });

    const result = await convertVisitorToMember({
      organizationId: org.id,
      visitorId: visitor.id,
      actorUserId: user.id,
    });

    assert.ok(result.memberId);
    const updated = await prisma.visitor.findUniqueOrThrow({
      where: { id: visitor.id },
    });
    assert.equal(updated.convertedMemberId, result.memberId);
  });
});
