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
import { subDays, subMonths, startOfDay } from "date-fns";

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
  const aisha = createdMembers[2]!;
  const daniel = createdMembers[3]!;
  const elena = createdMembers[4]!;
  const james = createdMembers[5]!;
  const priya = createdMembers[6]!;
  const noah = createdMembers[7]!;

  await prisma.member.update({
    where: { id: sarah.id },
    data: { assignedLeaderId: marcus.id },
  });

  // ---------------------------------------------------------------------------
  // Multi-member households (Family Management seed)
  // ---------------------------------------------------------------------------

  async function ensureMember(input: {
    email: string;
    firstName: string;
    lastName: string;
    status?: MemberStatus;
    campus?: string;
    phone?: string;
  }) {
    const existing = await prisma.member.findFirst({
      where: { organizationId: grace.id, email: input.email, deletedAt: null },
    });
    if (existing) return existing;
    return prisma.member.create({
      data: {
        organizationId: grace.id,
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: input.phone ?? null,
        status: input.status ?? MemberStatus.ACTIVE,
        lifecycle: MemberLifecycle.MEMBER,
        campus: input.campus ?? "Main Campus",
        joinedAt: subMonths(new Date(), 12),
      },
    });
  }

  const davidChen = await ensureMember({
    email: "david.chen@email.com",
    firstName: "David",
    lastName: "Chen",
    phone: "+1-555-0111",
  });
  const miaChen = await ensureMember({
    email: "mia.chen@email.com",
    firstName: "Mia",
    lastName: "Chen",
    status: MemberStatus.ACTIVE,
    phone: "+1-555-0112",
  });
  const leoChen = await ensureMember({
    email: "leo.chen@email.com",
    firstName: "Leo",
    lastName: "Chen",
    status: MemberStatus.ACTIVE,
  });
  const graceWilliams = await ensureMember({
    email: "grace.williams@email.com",
    firstName: "Grace",
    lastName: "Williams",
    phone: "+1-555-0121",
  });
  const rajPatel = await ensureMember({
    email: "raj.patel@email.com",
    firstName: "Raj",
    lastName: "Patel",
    phone: "+1-555-0131",
  });

  async function ensureHousehold(input: {
    familyName: string;
    code: string;
    addressLine1: string;
    city?: string;
    cellGroup?: string;
    engagementScore?: number;
    emergencyContact?: string;
    emergencyPhone?: string;
    anniversaryDate?: Date;
  }) {
    let hh = await prisma.household.findFirst({
      where: {
        organizationId: grace.id,
        householdCode: input.code,
        deletedAt: null,
      },
    });
    if (!hh) {
      hh = await prisma.household.create({
        data: {
          organizationId: grace.id,
          familyName: input.familyName,
          householdCode: input.code,
          addressLine1: input.addressLine1,
          city: input.city ?? "Springfield",
          state: "IL",
          postalCode: "62701",
          country: "US",
          preferredLanguage: "en",
          cellGroup: input.cellGroup ?? null,
          engagementScore: input.engagementScore ?? 70,
          emergencyContact: input.emergencyContact ?? null,
          emergencyPhone: input.emergencyPhone ?? null,
          anniversaryDate: input.anniversaryDate ?? null,
          status: "ACTIVE",
          notes: `${input.familyName} — pastoral care household.`,
        },
      });
    } else {
      hh = await prisma.household.update({
        where: { id: hh.id },
        data: {
          familyName: input.familyName,
          cellGroup: input.cellGroup ?? hh.cellGroup,
          engagementScore: input.engagementScore ?? hh.engagementScore,
        },
      });
    }
    return hh;
  }

  async function link(
    householdId: string,
    memberId: string,
    relation: FamilyRelation,
    isPrimary = false
  ) {
    // Enforce one household per member
    await prisma.householdMembership.deleteMany({
      where: { memberId, NOT: { householdId } },
    });
    await prisma.householdMembership.upsert({
      where: { householdId_memberId: { householdId, memberId } },
      update: { relation, isPrimary },
      create: { householdId, memberId, relation, isPrimary },
    });
  }

  const chenHh = await ensureHousehold({
    familyName: "Chen Family",
    code: "HH-CHEN001",
    addressLine1: "100 Faith Avenue",
    cellGroup: "East Cell · Alpha",
    engagementScore: 86,
    emergencyContact: "David Chen",
    emergencyPhone: "+1-555-0111",
    anniversaryDate: subMonths(new Date(), 120),
  });

  await link(chenHh.id, sarah.id, FamilyRelation.WIFE, false);
  await link(chenHh.id, davidChen.id, FamilyRelation.HEAD, true);
  await link(chenHh.id, miaChen.id, FamilyRelation.DAUGHTER);
  await link(chenHh.id, leoChen.id, FamilyRelation.SON);

  const williamsHh = await ensureHousehold({
    familyName: "Williams Family",
    code: "HH-WILL001",
    addressLine1: "42 Covenant Road",
    cellGroup: "Main Cell · Elders",
    engagementScore: 92,
    emergencyContact: "Grace Williams",
    emergencyPhone: "+1-555-0121",
    anniversaryDate: subMonths(new Date(), 200),
  });
  await link(williamsHh.id, marcus.id, FamilyRelation.HEAD, true);
  await link(williamsHh.id, graceWilliams.id, FamilyRelation.WIFE);

  const patelHh = await ensureHousehold({
    familyName: "Patel Household",
    code: "HH-PATE001",
    addressLine1: "7 Mercy Lane",
    cellGroup: "Newcomers Circle",
    engagementScore: 61,
    emergencyContact: "Raj Patel",
    emergencyPhone: "+1-555-0131",
  });
  await link(patelHh.id, aisha.id, FamilyRelation.WIFE);
  await link(patelHh.id, rajPatel.id, FamilyRelation.HEAD, true);

  const rossiHh = await ensureHousehold({
    familyName: "Rossi Household",
    code: "HH-ROSS001",
    addressLine1: "15 Hope Street",
    cellGroup: "Children's Ministry Care",
    engagementScore: 74,
  });
  await link(rossiHh.id, elena.id, FamilyRelation.HEAD, true);

  const nairHh = await ensureHousehold({
    familyName: "Nair Family",
    code: "HH-NAIR001",
    addressLine1: "88 Prayer Way",
    city: "Springfield",
    cellGroup: "East Cell · Prayer",
    engagementScore: 81,
  });
  await link(nairHh.id, priya.id, FamilyRelation.HEAD, true);

  const bennettHh = await ensureHousehold({
    familyName: "Bennett Household",
    code: "HH-BENN001",
    addressLine1: "3 Youth Court",
    cellGroup: "Youth Connect",
    engagementScore: 55,
  });
  await link(bennettHh.id, noah.id, FamilyRelation.SON);
  await link(bennettHh.id, daniel.id, FamilyRelation.GUARDIAN, true);

  // Solo / inactive household
  const kimHh = await ensureHousehold({
    familyName: "Kim Household",
    code: "HH-KIM0001",
    addressLine1: "9 Quiet Grove",
    engagementScore: 22,
  });
  await prisma.household.update({
    where: { id: kimHh.id },
    data: { status: "INACTIVE" },
  });
  await link(kimHh.id, james.id, FamilyRelation.HEAD, true);

  // Household activities + note for Chen family
  const hhActCount = await prisma.householdActivity.count({
    where: { householdId: chenHh.id },
  });
  if (hhActCount === 0) {
    await prisma.householdActivity.createMany({
      data: [
        {
          organizationId: grace.id,
          householdId: chenHh.id,
          type: "CREATED",
          title: "Household created",
          actorUserId: pastor.id,
          occurredAt: subMonths(new Date(), 40),
        },
        {
          organizationId: grace.id,
          householdId: chenHh.id,
          type: "MEMBER_ADDED",
          title: "Member added",
          description: "Mia Chen joined as Daughter",
          actorUserId: pastor.id,
          occurredAt: subMonths(new Date(), 24),
        },
        {
          organizationId: grace.id,
          householdId: chenHh.id,
          type: "HOME_VISIT_SCHEDULED",
          title: "Home visit scheduled",
          actorUserId: pastor.id,
          occurredAt: subDays(new Date(), 10),
        },
        {
          organizationId: grace.id,
          householdId: chenHh.id,
          type: "VISITED",
          title: "Pastoral visit completed",
          actorUserId: pastor.id,
          occurredAt: subDays(new Date(), 3),
        },
      ],
    });
  }

  const hhNoteCount = await prisma.householdNote.count({
    where: { householdId: chenHh.id },
  });
  if (hhNoteCount === 0) {
    await prisma.householdNote.create({
      data: {
        organizationId: grace.id,
        householdId: chenHh.id,
        authorUserId: pastor.id,
        visibility: NoteVisibility.PASTORAL,
        body: "Strong worship household. Kids engaged in youth. Follow up on small-group hosting interest.",
      },
    });
  }

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
  console.log(`   CRM members @ Grace: ${createdMembers.length}+ family members`);
  console.log(
    `   Households: ${chenHh.familyName}, ${williamsHh.familyName}, ${patelHh.familyName}, …`
  );

  // ---------------------------------------------------------------------------
  // Attendance sessions & check-in (Grace Community)
  // ---------------------------------------------------------------------------
  const today = startOfDay(new Date());
  const sundayServiceName = "Sunday Morning Worship";

  async function ensureAttendanceSession(input: {
    serviceName: string;
    date: Date;
    status: "SCHEDULED" | "LIVE" | "CLOSED" | "CANCELLED";
    expectedCount?: number;
    startTime?: Date;
    endTime?: Date;
  }) {
    const existing = await prisma.attendanceSession.findFirst({
      where: {
        organizationId: grace.id,
        serviceName: input.serviceName,
        date: input.date,
      },
    });
    if (existing) return existing;
    return prisma.attendanceSession.create({
      data: {
        organizationId: grace.id,
        serviceName: input.serviceName,
        campus: "Main Campus",
        ministry: "Worship",
        date: input.date,
        startTime: input.startTime ?? null,
        endTime: input.endTime ?? null,
        attendanceType: "SUNDAY",
        status: input.status,
        expectedCount: input.expectedCount ?? 180,
        notes:
          input.status === "LIVE"
            ? "Live check-in session for demo kiosk."
            : null,
      },
    });
  }

  const liveSession = await ensureAttendanceSession({
    serviceName: sundayServiceName,
    date: today,
    status: "LIVE",
    expectedCount: 185,
    startTime: new Date(today.getTime() + 9 * 60 * 60 * 1000),
  });

  const closedSundays = [7, 14, 21, 28].map((daysAgo) =>
    subDays(today, daysAgo)
  );
  const closedSessions = [];
  for (const date of closedSundays) {
    closedSessions.push(
      await ensureAttendanceSession({
        serviceName: sundayServiceName,
        date,
        status: "CLOSED",
        expectedCount: 175,
        startTime: new Date(date.getTime() + 9 * 60 * 60 * 1000),
        endTime: new Date(date.getTime() + 11 * 60 * 60 * 1000),
      })
    );
  }

  const sessionCheckInCount = await prisma.attendanceRecord.count({
    where: { sessionId: liveSession.id },
  });

  if (sessionCheckInCount === 0) {
    const checkInMembers = [
      sarah,
      marcus,
      aisha,
      elena,
      priya,
      noah,
      davidChen,
      miaChen,
      graceWilliams,
    ];

    await prisma.attendanceRecord.createMany({
      data: checkInMembers.map((member, index) => ({
        organizationId: grace.id,
        sessionId: liveSession.id,
        memberId: member.id,
        householdId:
          member.id === sarah.id || member.id === davidChen.id || member.id === miaChen.id
            ? chenHh.id
            : member.id === marcus.id || member.id === graceWilliams.id
              ? williamsHh.id
              : member.id === aisha.id
                ? patelHh.id
                : member.id === elena.id
                  ? rossiHh.id
                  : member.id === priya.id
                    ? nairHh.id
                    : member.id === noah.id
                      ? bennettHh.id
                      : null,
        eventName: liveSession.serviceName,
        attendedAt: new Date(Date.now() - index * 90_000),
        checkedInByUserId: pastor.id,
        method:
          index % 4 === 0
            ? AttendanceMethod.QR
            : index % 3 === 0
              ? AttendanceMethod.SEARCH
              : AttendanceMethod.MANUAL,
        attendanceStatus: "PRESENT",
      })),
      skipDuplicates: true,
    });

    for (const session of closedSessions.slice(0, 2)) {
      await prisma.attendanceRecord.createMany({
        data: [sarah, marcus, elena, priya, noah].map((member, index) => ({
          organizationId: grace.id,
          sessionId: session.id,
          memberId: member.id,
          eventName: session.serviceName,
          attendedAt: new Date(session.date.getTime() + (10 + index) * 60 * 60 * 1000),
          method: AttendanceMethod.MANUAL,
          attendanceStatus: "PRESENT",
        })),
        skipDuplicates: true,
      });
    }
  }

  const visitorSeedCount = await prisma.visitor.count({
    where: { organizationId: grace.id },
  });

  if (visitorSeedCount === 0) {
    const visitorJordan = await prisma.visitor.create({
      data: {
        organizationId: grace.id,
        firstName: "Jordan",
        lastName: "Reed",
        email: "jordan.reed@email.com",
        phone: "+1-555-0201",
        invitedByMemberId: aisha.id,
        prayerRequest: "Looking for a church home in Springfield.",
      },
    });

    const visitorTaylor = await prisma.visitor.create({
      data: {
        organizationId: grace.id,
        firstName: "Taylor",
        lastName: "Brooks",
        email: "taylor.b@email.com",
        phone: "+1-555-0202",
        invitedByMemberId: marcus.id,
        familyName: "Brooks Family",
        childrenCount: 2,
      },
    });

    await prisma.visitorAttendance.create({
      data: {
        organizationId: grace.id,
        visitorId: visitorJordan.id,
        sessionId: liveSession.id,
        invitedByMemberId: aisha.id,
        isFirstVisit: true,
        isSecondVisit: false,
        checkedInAt: subDays(new Date(), 0),
      },
    });

    const priorSunday = closedSessions[0]!;
    await prisma.visitorAttendance.create({
      data: {
        organizationId: grace.id,
        visitorId: visitorTaylor.id,
        sessionId: priorSunday.id,
        invitedByMemberId: marcus.id,
        isFirstVisit: true,
        isSecondVisit: false,
        checkedInAt: priorSunday.date,
      },
    });

    await prisma.visitorAttendance.create({
      data: {
        organizationId: grace.id,
        visitorId: visitorTaylor.id,
        sessionId: liveSession.id,
        invitedByMemberId: marcus.id,
        isFirstVisit: false,
        isSecondVisit: true,
        checkedInAt: new Date(),
      },
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
