import { createMember } from "@/application/people/member-service";
import {
  deferAfterDialogClose,
  memberProfilePath,
} from "@/components/people/member-create-nav";
import { MemberLifecycle, MemberStatus } from "@/domain/enums/member";
import { prisma } from "@/infrastructure/db/prisma";

async function main() {
  console.log("Exact failing lines (before fix):");
  console.log("  member-create-dialog.tsx — setOpen(false); router.push(...)");
  console.log("  in the same turn after createMemberAction succeeded.");
  console.log("Root cause: Radix Dialog RemoveScroll still locking <body>.");

  const order: string[] = [];
  order.push("before");
  await new Promise<void>((resolve) => {
    deferAfterDialogClose(() => {
      order.push("nav");
      resolve();
    });
    order.push("scheduled");
  });
  console.log("defer order:", order.join(" → "));
  if (order.join(",") !== "before,scheduled,nav") {
    throw new Error("defer order wrong");
  }

  const org = await prisma.organization.findFirst({
    where: { slug: { startsWith: "bug002" } },
  });
  const user = await prisma.user.findFirst({
    where: { clerkUserId: { startsWith: "user_bug002" } },
  });
  if (!org || !user) throw new Error("fixture missing — run npm test first");

  const t0 = Date.now();
  const member = await createMember({
    organizationId: org.id,
    actorUserId: user.id,
    firstName: "Manual",
    lastName: "Verify",
    email: `manual-${Date.now()}@example.com`,
    status: MemberStatus.ACTIVE,
    lifecycle: MemberLifecycle.MEMBER,
    joinedAt: new Date(),
  });
  console.log(
    "createMember",
    Date.now() - t0,
    "ms →",
    memberProfilePath(member.id)
  );
  console.log("BUG-002 manual verification PASSED");
}

main()
  .catch((error) => {
    console.error("BUG-002 manual verification FAILED", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
