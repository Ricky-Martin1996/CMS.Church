import assert from "node:assert/strict";
import { after, describe, it } from "node:test";
import { checkInMember } from "@/application/attendance/attendance-service";
import {
  AttendanceMethod,
  AttendanceSessionStatus,
  AttendanceSessionType,
  MemberLifecycle,
  MemberStatus,
} from "@/domain/enums/member";
import { prisma } from "@/infrastructure/db/prisma";
import { AppError } from "@/server/errors";

describe("BUG-005 attendance check-in requires LIVE session", () => {
  after(async () => {
    await prisma.$disconnect();
  });

  it("rejects check-in for SCHEDULED sessions", async () => {
    const suffix = Date.now().toString(36);
    const org = await prisma.organization.create({
      data: { name: "BUG005 Org", slug: `bug005-${suffix}` },
    });
    const user = await prisma.user.create({
      data: {
        clerkUserId: `user_bug005_${suffix}`,
        email: `bug005-${suffix}@example.com`,
        firstName: "Bug",
        lastName: "Five",
      },
    });
    const member = await prisma.member.create({
      data: {
        organizationId: org.id,
        firstName: "Pat",
        lastName: "Member",
        status: MemberStatus.ACTIVE,
        lifecycle: MemberLifecycle.MEMBER,
        joinedAt: new Date(),
      },
    });
    const session = await prisma.attendanceSession.create({
      data: {
        organizationId: org.id,
        serviceName: "Sunday Service",
        date: new Date(),
        attendanceType: AttendanceSessionType.SUNDAY,
        status: AttendanceSessionStatus.SCHEDULED,
      },
    });

    await assert.rejects(
      () =>
        checkInMember({
          organizationId: org.id,
          sessionId: session.id,
          memberId: member.id,
          method: AttendanceMethod.SEARCH,
          actorUserId: user.id,
        }),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.code, "CONFLICT");
        assert.match(error.message, /live/i);
        return true;
      }
    );

    const records = await prisma.attendanceRecord.count({
      where: { sessionId: session.id },
    });
    assert.equal(records, 0);
  });

  it("allows check-in when session is LIVE", async () => {
    const suffix = Date.now().toString(36);
    const org = await prisma.organization.create({
      data: { name: "BUG005 Live Org", slug: `bug005-live-${suffix}` },
    });
    const user = await prisma.user.create({
      data: {
        clerkUserId: `user_bug005_live_${suffix}`,
        email: `bug005-live-${suffix}@example.com`,
        firstName: "Bug",
        lastName: "Five",
      },
    });
    const member = await prisma.member.create({
      data: {
        organizationId: org.id,
        firstName: "Live",
        lastName: "Member",
        status: MemberStatus.ACTIVE,
        lifecycle: MemberLifecycle.MEMBER,
        joinedAt: new Date(),
      },
    });
    const session = await prisma.attendanceSession.create({
      data: {
        organizationId: org.id,
        serviceName: "Live Service",
        date: new Date(),
        attendanceType: AttendanceSessionType.SUNDAY,
        status: AttendanceSessionStatus.LIVE,
      },
    });

    const record = await checkInMember({
      organizationId: org.id,
      sessionId: session.id,
      memberId: member.id,
      method: AttendanceMethod.SEARCH,
      actorUserId: user.id,
    });

    assert.ok(record.id);
    assert.equal(record.memberId, member.id);
    assert.equal(record.sessionId, session.id);
  });
});
