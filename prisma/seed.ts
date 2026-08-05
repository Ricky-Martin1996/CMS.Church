import {
  ActivityType,
  AttendanceMethod,
  FamilyRelation,
  MemberLifecycle,
  MemberStatus,
  NoteVisibility,
  PrismaClient,
  Role,
} from "@prisma/client";
import { DEFAULT_TAGS } from "../src/domain/enums/member";
import { subDays, subMonths } from "date-fns";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding ChurchOS…");

  const superAdmin = await prisma.user.upsert({
    where: { clerkUserId: "user_seed_super_admin" },
    update: {},
    create: {
      clerkUserId: "user_seed_super_admin",
      email: "superadmin@churchos.dev",
      firstName: "Super",
      lastName: "Admin",
    },
  });

  const pastor = await prisma.user.upsert({
    where: { clerkUserId: "user_seed_pastor" },
    update: {},
    create: {
      clerkUserId: "user_seed_pastor",
      email: "pastor@grace.church",
      firstName: "Alex",
      lastName: "Pastor",
    },
  });

  const finance = await prisma.user.upsert({
    where: { clerkUserId: "user_seed_finance" },
    update: {},
    create: {
      clerkUserId: "user_seed_finance",
      email: "finance@grace.church",
      firstName: "Jordan",
      lastName: "Ledger",
    },
  });

  const memberUser = await prisma.user.upsert({
    where: { clerkUserId: "user_seed_member" },
    update: {},
    create: {
      clerkUserId: "user_seed_member",
      email: "member@grace.church",
      firstName: "Sam",
      lastName: "Member",
    },
  });

  const grace = await prisma.organization.upsert({
    where: { slug: "grace-community" },
    update: { name: "Grace Community Church" },
    create: {
      name: "Grace Community Church",
      slug: "grace-community",
    },
  });

  const north = await prisma.organization.upsert({
    where: { slug: "northside-fellowship" },
    update: { name: "Northside Fellowship" },
    create: {
      name: "Northside Fellowship",
      slug: "northside-fellowship",
    },
  });

  const memberships: Array<{
    userId: string;
    organizationId: string;
    role: Role;
  }> = [
    {
      userId: superAdmin.id,
      organizationId: grace.id,
      role: Role.SUPER_ADMIN,
    },
    {
      userId: superAdmin.id,
      organizationId: north.id,
      role: Role.SUPER_ADMIN,
    },
    {
      userId: pastor.id,
      organizationId: grace.id,
      role: Role.PASTOR,
    },
    {
      userId: finance.id,
      organizationId: grace.id,
      role: Role.FINANCE_MANAGER,
    },
    {
      userId: memberUser.id,
      organizationId: grace.id,
      role: Role.MEMBER,
    },
    {
      userId: pastor.id,
      organizationId: north.id,
      role: Role.CHURCH_ADMIN,
    },
  ];

  for (const m of memberships) {
    await prisma.membership.upsert({
      where: {
        userId_organizationId: {
          userId: m.userId,
          organizationId: m.organizationId,
        },
      },
      update: { role: m.role, status: "ACTIVE" },
      create: {
        userId: m.userId,
        organizationId: m.organizationId,
        role: m.role,
        status: "ACTIVE",
      },
    });
  }

  // ---------------------------------------------------------------------------
  // CRM tags + members (Grace Community)
  // ---------------------------------------------------------------------------
  const tags = [];
  for (const t of DEFAULT_TAGS) {
    const tag = await prisma.tag.upsert({
      where: {
        organizationId_slug: { organizationId: grace.id, slug: t.slug },
      },
      update: { name: t.name, color: t.color },
      create: {
        organizationId: grace.id,
        name: t.name,
        slug: t.slug,
        color: t.color,
      },
    });
    tags.push(tag);
  }
  const tagBySlug = Object.fromEntries(tags.map((t) => [t.slug, t]));

  const seedMembers = [
    {
      key: "sarah-chen",
      firstName: "Sarah",
      lastName: "Chen",
      email: "sarah.chen@email.com",
      phone: "+1-555-0101",
      whatsapp: "+15550101",
      status: MemberStatus.ACTIVE,
      lifecycle: MemberLifecycle.LEADER,
      campus: "Main Campus",
      ministryRole: "Worship Leader",
      tags: ["leader", "musician", "baptized"],
      joinedAt: subMonths(new Date(), 40),
      baptismDate: subMonths(new Date(), 36),
      engagementScore: 88,
      growthScore: 72,
      riskScore: 18,
    },
    {
      key: "marcus-williams",
      firstName: "Marcus",
      lastName: "Williams",
      email: "marcus.w@email.com",
      phone: "+1-555-0102",
      status: MemberStatus.ACTIVE,
      lifecycle: MemberLifecycle.LEADER,
      campus: "Main Campus",
      ministryRole: "Elder",
      tags: ["leader", "teacher", "baptized"],
      joinedAt: subMonths(new Date(), 72),
      baptismDate: subMonths(new Date(), 70),
      engagementScore: 91,
      growthScore: 80,
      riskScore: 12,
    },
    {
      key: "aisha-patel",
      firstName: "Aisha",
      lastName: "Patel",
      email: "aisha.p@email.com",
      phone: "+1-555-0103",
      status: MemberStatus.NEW_MEMBER,
      lifecycle: MemberLifecycle.MEMBER,
      campus: "Main Campus",
      ministryRole: "Guest Services",
      tags: ["new-member", "volunteer"],
      joinedAt: subDays(new Date(), 45),
      engagementScore: 64,
      growthScore: 78,
      riskScore: 28,
    },
    {
      key: "daniel-okonkwo",
      firstName: "Daniel",
      lastName: "Okonkwo",
      email: "daniel.o@email.com",
      phone: "+1-555-0104",
      status: MemberStatus.VISITOR,
      lifecycle: MemberLifecycle.VISITOR,
      campus: "East Campus",
      ministryRole: null,
      tags: ["visitor", "youth"],
      joinedAt: subDays(new Date(), 12),
      engagementScore: 35,
      growthScore: 42,
      riskScore: 48,
    },
    {
      key: "elena-rossi",
      firstName: "Elena",
      lastName: "Rossi",
      email: "elena.r@email.com",
      phone: "+1-555-0105",
      status: MemberStatus.ACTIVE,
      lifecycle: MemberLifecycle.MEMBER,
      campus: "Main Campus",
      ministryRole: "Children's Ministry",
      tags: ["teacher", "volunteer", "baptized"],
      joinedAt: subMonths(new Date(), 24),
      baptismDate: subMonths(new Date(), 20),
      engagementScore: 76,
      growthScore: 68,
      riskScore: 22,
    },
    {
      key: "james-kim",
      firstName: "James",
      lastName: "Kim",
      email: "james.kim@email.com",
      phone: "+1-555-0106",
      status: MemberStatus.INACTIVE,
      lifecycle: MemberLifecycle.ALUMNI,
      campus: "Main Campus",
      ministryRole: null,
      tags: ["senior"],
      joinedAt: subMonths(new Date(), 96),
      engagementScore: 18,
      growthScore: 20,
      riskScore: 82,
    },
    {
      key: "priya-nair",
      firstName: "Priya",
      lastName: "Nair",
      email: "priya.n@email.com",
      phone: "+1-555-0107",
      whatsapp: "+15550107",
      status: MemberStatus.ACTIVE,
      lifecycle: MemberLifecycle.MEMBER,
      campus: "East Campus",
      ministryRole: "Prayer Team",
      tags: ["prayer-warrior", "baptized"],
      joinedAt: subMonths(new Date(), 18),
      baptismDate: subMonths(new Date(), 14),
      engagementScore: 82,
      growthScore: 70,
      riskScore: 16,
    },
    {
      key: "noah-bennett",
      firstName: "Noah",
      lastName: "Bennett",
      email: "noah.b@email.com",
      phone: "+1-555-0108",
      status: MemberStatus.ACTIVE,
      lifecycle: MemberLifecycle.REGULAR,
      campus: "Main Campus",
      ministryRole: "Youth Helper",
      tags: ["youth", "volunteer"],
      joinedAt: subMonths(new Date(), 8),
      engagementScore: 58,
      growthScore: 65,
      riskScore: 34,
    },
  ] as const;

  const createdMembers = [];
  for (const m of seedMembers) {
    const existing = await prisma.member.findFirst({
      where: {
        organizationId: grace.id,
        email: m.email,
        deletedAt: null,
      },
    });

    const member =
      existing ??
      (await prisma.member.create({
        data: {
          organizationId: grace.id,
          firstName: m.firstName,
          lastName: m.lastName,
          email: m.email,
          phone: m.phone,
          whatsapp: "whatsapp" in m ? m.whatsapp : null,
          status: m.status,
          lifecycle: m.lifecycle,
          campus: m.campus,
          ministryRole: m.ministryRole,
          joinedAt: m.joinedAt,
          baptismDate: "baptismDate" in m ? m.baptismDate : null,
          engagementScore: m.engagementScore,
          growthScore: m.growthScore,
          riskScore: m.riskScore,
          emergencyName: `${m.firstName} Emergency Contact`,
          emergencyPhone: "+1-555-0199",
          emergencyRelation: "Spouse",
          addressLine1: "100 Faith Avenue",
          city: "Springfield",
          state: "IL",
          postalCode: "62701",
          country: "US",
          aiSummary: `${m.firstName} ${m.lastName} is part of Grace Community — seed profile for CRM demos.`,
        },
      }));

    for (const slug of m.tags) {
      const tag = tagBySlug[slug];
      if (!tag) continue;
      await prisma.memberTag.upsert({
        where: {
          memberId_tagId: { memberId: member.id, tagId: tag.id },
        },
        update: {},
        create: { memberId: member.id, tagId: tag.id },
      });
    }

    createdMembers.push(member);
  }

  const sarah = createdMembers[0]!;
  const marcus = createdMembers[1]!;
  const elena = createdMembers[4]!;

  await prisma.member.update({
    where: { id: sarah.id },
    data: { assignedLeaderId: marcus.id },
  });

  // Family household
  let household = await prisma.household.findFirst({
    where: { organizationId: grace.id, name: "Chen Household" },
  });
  if (!household) {
    household = await prisma.household.create({
      data: {
        organizationId: grace.id,
        name: "Chen Household",
        addressLine1: "100 Faith Avenue",
        city: "Springfield",
        state: "IL",
        postalCode: "62701",
        country: "US",
      },
    });
  }

  await prisma.familyMember.upsert({
    where: {
      householdId_memberId: { householdId: household.id, memberId: sarah.id },
    },
    update: { relation: FamilyRelation.HEAD, isPrimary: true },
    create: {
      householdId: household.id,
      memberId: sarah.id,
      relation: FamilyRelation.HEAD,
      isPrimary: true,
    },
  });

  // Activity / attendance / giving / prayer / volunteer for Sarah
  const activityCount = await prisma.memberActivity.count({
    where: { memberId: sarah.id },
  });
  if (activityCount === 0) {
    await prisma.memberActivity.createMany({
      data: [
        {
          organizationId: grace.id,
          memberId: sarah.id,
          type: ActivityType.CREATED,
          title: "Member created",
          actorUserId: pastor.id,
          occurredAt: sarah.joinedAt ?? subMonths(new Date(), 40),
        },
        {
          organizationId: grace.id,
          memberId: sarah.id,
          type: ActivityType.BAPTIZED,
          title: "Baptized",
          actorUserId: pastor.id,
          occurredAt: subMonths(new Date(), 36),
        },
        {
          organizationId: grace.id,
          memberId: sarah.id,
          type: ActivityType.VOLUNTEER_JOINED,
          title: "Volunteer joined",
          description: "Worship Team",
          actorUserId: pastor.id,
          occurredAt: subMonths(new Date(), 30),
        },
        {
          organizationId: grace.id,
          memberId: sarah.id,
          type: ActivityType.ATTENDED,
          title: "Attended",
          description: "Sunday Service",
          occurredAt: subDays(new Date(), 2),
        },
        {
          organizationId: grace.id,
          memberId: sarah.id,
          type: ActivityType.EMAIL_SENT,
          title: "Email sent",
          description: "Worship rehearsal schedule",
          actorUserId: pastor.id,
          occurredAt: subDays(new Date(), 5),
        },
      ],
    });
  }

  const attendanceCount = await prisma.attendanceRecord.count({
    where: { memberId: sarah.id },
  });
  if (attendanceCount === 0) {
    await prisma.attendanceRecord.createMany({
      data: Array.from({ length: 8 }).map((_, i) => ({
        organizationId: grace.id,
        memberId: sarah.id,
        eventName: "Sunday Service",
        attendedAt: subDays(new Date(), i * 7),
        method: AttendanceMethod.MANUAL,
      })),
    });
  }

  const givingCount = await prisma.givingRecord.count({
    where: { memberId: sarah.id },
  });
  if (givingCount === 0) {
    await prisma.givingRecord.createMany({
      data: Array.from({ length: 6 }).map((_, i) => ({
        organizationId: grace.id,
        memberId: sarah.id,
        amountCents: 15000 + i * 1000,
        fund: "General",
        givenAt: subMonths(new Date(), i),
      })),
    });
  }

  const prayerCount = await prisma.prayerRequest.count({
    where: { memberId: sarah.id },
  });
  if (prayerCount === 0) {
    await prisma.prayerRequest.create({
      data: {
        organizationId: grace.id,
        memberId: sarah.id,
        request: "Wisdom for leading worship through the busy season.",
        status: "PRAYING",
      },
    });
  }

  const volunteerCount = await prisma.volunteerAssignment.count({
    where: { memberId: sarah.id },
  });
  if (volunteerCount === 0) {
    await prisma.volunteerAssignment.create({
      data: {
        organizationId: grace.id,
        memberId: sarah.id,
        roleName: "Worship Leader",
        team: "Music",
        status: "ACTIVE",
      },
    });
  }

  const noteCount = await prisma.memberNote.count({
    where: { memberId: sarah.id },
  });
  if (noteCount === 0) {
    await prisma.memberNote.createMany({
      data: [
        {
          organizationId: grace.id,
          memberId: sarah.id,
          authorUserId: pastor.id,
          visibility: NoteVisibility.PASTORAL,
          body: "Strong worship gift. Exploring mentorship for junior musicians.",
        },
        {
          organizationId: grace.id,
          memberId: elena.id,
          authorUserId: pastor.id,
          visibility: NoteVisibility.LEADER,
          body: "Reliable with kids check-in. Candidate for team lead.",
        },
      ],
    });
  }

  // One member at Northside so multi-tenant isolation is obvious
  const northTag = await prisma.tag.upsert({
    where: {
      organizationId_slug: {
        organizationId: north.id,
        slug: "visitor",
      },
    },
    update: {},
    create: {
      organizationId: north.id,
      name: "Visitor",
      slug: "visitor",
      color: "#ea580c",
    },
  });

  const northExisting = await prisma.member.findFirst({
    where: { organizationId: north.id, email: "liam.north@email.com" },
  });
  if (!northExisting) {
    const liam = await prisma.member.create({
      data: {
        organizationId: north.id,
        firstName: "Liam",
        lastName: "North",
        email: "liam.north@email.com",
        status: MemberStatus.VISITOR,
        lifecycle: MemberLifecycle.PROSPECT,
        campus: "North Campus",
        joinedAt: subDays(new Date(), 3),
      },
    });
    await prisma.memberTag.create({
      data: { memberId: liam.id, tagId: northTag.id },
    });
    await prisma.memberActivity.create({
      data: {
        organizationId: north.id,
        memberId: liam.id,
        type: ActivityType.CREATED,
        title: "Member created",
        actorUserId: pastor.id,
      },
    });
  }

  console.log("✅ Seed complete");
  console.log(`   Organizations: ${grace.slug}, ${north.slug}`);
  console.log(
    `   Users: ${superAdmin.email}, ${pastor.email}, ${finance.email}, ${memberUser.email}`
  );
  console.log(`   CRM members @ Grace: ${createdMembers.length}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
