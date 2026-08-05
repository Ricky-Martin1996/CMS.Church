import {
  ActivityType,
  AttendanceMethod,
  FamilyRelation,
  MemberLifecycle,
  MemberStatus,
  NoteVisibility,
  PrismaClient,
  Role,
  VisitorPipelineStage,
} from "@prisma/client";
import { DEFAULT_TAGS } from "../src/domain/enums/member";
import { DEFAULT_MINISTRIES } from "../src/domain/enums/ministry";
import { DEFAULT_VISITOR_STAGE_CONFIGS } from "../src/domain/enums/visitor";
import { nextSunday, setHours, setMinutes, subDays, subMonths, startOfDay } from "date-fns";

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

  // ---------------------------------------------------------------------------
  // Visitor Journey & Follow-up seed (stage configs, journeys, tasks, comms)
  // ---------------------------------------------------------------------------

  for (const config of DEFAULT_VISITOR_STAGE_CONFIGS) {
    await prisma.visitorStageConfig.upsert({
      where: {
        organizationId_stageKey: {
          organizationId: grace.id,
          stageKey: config.stageKey,
        },
      },
      create: {
        organizationId: grace.id,
        stageKey: config.stageKey,
        label: config.label,
        sortOrder: config.sortOrder,
        autoTaskTypes: config.autoTaskTypes,
        slaHours: config.slaHours,
      },
      update: {},
    });
  }

  async function seedVisitorJourney(
    visitor: { id: string; firstName: string; lastName: string },
    stage: typeof DEFAULT_VISITOR_STAGE_CONFIGS[number]["stageKey"] | VisitorPipelineStage,
    options?: {
      assignedLeaderId?: string;
      tasks?: Array<{
        type: "CALL" | "WHATSAPP" | "EMAIL_WELCOME" | "INVITE_SERVICE" | "INVITE_CELL" | "HOME_VISIT" | "CUSTOM";
        title: string;
        status?: "OPEN" | "DONE";
        dueAt?: Date;
      }>;
      communications?: Array<{
        channel: "PHONE" | "EMAIL" | "WHATSAPP" | "SMS" | "IN_PERSON" | "NOTE";
        body: string;
        occurredAt?: Date;
      }>;
    }
  ) {
    const existingJourney = await prisma.visitorJourney.findUnique({
      where: { visitorId: visitor.id },
    });

    if (!existingJourney) {
      await prisma.visitorJourney.create({
        data: {
          organizationId: grace.id,
          visitorId: visitor.id,
          currentStage: stage,
          startedAt: subDays(new Date(), 14),
        },
      });

      await prisma.visitorStatusHistory.create({
        data: {
          organizationId: grace.id,
          visitorId: visitor.id,
          fromStatus: null,
          toStatus: "FIRST_VISIT",
          note: "Journey started",
          occurredAt: subDays(new Date(), 14),
        },
      });

      await prisma.visitorActivity.create({
        data: {
          organizationId: grace.id,
          visitorId: visitor.id,
          type: "CREATED",
          title: "Visitor registered",
          occurredAt: subDays(new Date(), 14),
        },
      });
    }

    await prisma.visitor.update({
      where: { id: visitor.id },
      data: {
        status: stage,
        stageEnteredAt: subDays(new Date(), 3),
        ...(options?.assignedLeaderId
          ? { assignedLeaderId: options.assignedLeaderId }
          : {}),
      },
    });

    await prisma.visitorJourney.updateMany({
      where: { visitorId: visitor.id },
      data: { currentStage: stage },
    });

    if (options?.tasks) {
      for (const task of options.tasks) {
        const automationKey = `${stage}:${task.type}:${visitor.id}:seed`;
        const exists = await prisma.followUpTask.findFirst({
          where: { organizationId: grace.id, automationKey },
        });
        if (exists) continue;

        await prisma.followUpTask.create({
          data: {
            organizationId: grace.id,
            visitorId: visitor.id,
            type: task.type,
            title: task.title,
            status: task.status ?? "OPEN",
            dueAt: task.dueAt ?? subDays(new Date(), 1),
            automationKey,
            ...(task.status === "DONE" ? { completedAt: new Date() } : {}),
          },
        });
      }
    }

    if (options?.communications) {
      for (const comm of options.communications) {
        await prisma.communicationLog.create({
          data: {
            organizationId: grace.id,
            visitorId: visitor.id,
            channel: comm.channel,
            direction: "OUTBOUND",
            body: comm.body,
            occurredAt: comm.occurredAt ?? subDays(new Date(), 2),
            metadata: { provider: null, queued: false },
          },
        });
      }
    }
  }

  const jordanVisitor = await prisma.visitor.findFirst({
    where: { organizationId: grace.id, email: "jordan.reed@email.com" },
  });
  const taylorVisitor = await prisma.visitor.findFirst({
    where: { organizationId: grace.id, email: "taylor.b@email.com" },
  });

  if (jordanVisitor) {
    await seedVisitorJourney(jordanVisitor, "WELCOME_SENT", {
      assignedLeaderId: aisha.id,
      tasks: [
        { type: "EMAIL_WELCOME", title: "Email welcome", status: "DONE" },
        { type: "CALL", title: "Call visitor", status: "OPEN", dueAt: subDays(new Date(), 1) },
      ],
      communications: [
        {
          channel: "EMAIL",
          body: "Welcome to Grace Community! We're glad you visited.",
          occurredAt: subDays(new Date(), 5),
        },
      ],
    });
  }

  if (taylorVisitor) {
    await seedVisitorJourney(taylorVisitor, "SECOND_VISIT", {
      assignedLeaderId: marcus.id,
      tasks: [
        { type: "INVITE_CELL", title: "Invite to cell group", status: "OPEN" },
      ],
      communications: [
        {
          channel: "WHATSAPP",
          body: "Great to see you again! Would you like to join a cell group?",
          occurredAt: subDays(new Date(), 3),
        },
      ],
    });
  }

  const extraVisitors = [
    {
      firstName: "Mia",
      lastName: "Chen",
      email: "mia.chen@email.com",
      phone: "+1-555-0203",
      stage: "CONTACTED" as const,
      leaderId: aisha.id,
    },
    {
      firstName: "Oliver",
      lastName: "Grant",
      email: "oliver.grant@email.com",
      phone: "+1-555-0204",
      stage: "CELL_GROUP_INVITED" as const,
      leaderId: marcus.id,
    },
    {
      firstName: "Sofia",
      lastName: "Martinez",
      email: "sofia.m@email.com",
      phone: "+1-555-0205",
      stage: "FOUNDATION_COURSE" as const,
      leaderId: daniel.id,
    },
    {
      firstName: "Ethan",
      lastName: "Walsh",
      email: "ethan.walsh@email.com",
      phone: "+1-555-0206",
      stage: "MEMBERSHIP_INTERVIEW" as const,
      leaderId: elena.id,
    },
  ];

  for (const v of extraVisitors) {
    const existing = await prisma.visitor.findFirst({
      where: { organizationId: grace.id, email: v.email },
    });
    const visitor =
      existing ??
      (await prisma.visitor.create({
        data: {
          organizationId: grace.id,
          firstName: v.firstName,
          lastName: v.lastName,
          email: v.email,
          phone: v.phone,
          invitedByMemberId: v.leaderId,
        },
      }));

    await seedVisitorJourney(visitor, v.stage, {
      assignedLeaderId: v.leaderId,
      tasks: [
        {
          type: "CALL",
          title: "Follow-up call",
          status: "OPEN",
          dueAt: subDays(new Date(), 2),
        },
      ],
      communications: [
        {
          channel: "PHONE",
          body: `Called ${v.firstName} to check in on their journey.`,
          occurredAt: subDays(new Date(), 4),
        },
      ],
    });
  }

  // ---------------------------------------------------------------------------
  // Ministry & Volunteer Management (Grace Community)
  // ---------------------------------------------------------------------------
  const ministryCount = await prisma.ministry.count({
    where: { organizationId: grace.id },
  });
  if (ministryCount === 0) {
    for (let i = 0; i < DEFAULT_MINISTRIES.length; i++) {
      const def = DEFAULT_MINISTRIES[i]!;
      const ministry = await prisma.ministry.create({
        data: {
          organizationId: grace.id,
          name: def.name,
          slug: def.slug,
          description: def.description,
          color: def.color,
          isDefault: true,
          sortOrder: i,
          roles: {
            create: def.roles.map((name, r) => ({
              organizationId: grace.id,
              name,
              sortOrder: r,
            })),
          },
        },
      });
      if (def.slug === "worship") {
        await prisma.ministry.update({
          where: { id: ministry.id },
          data: { leaderMemberId: sarah.id },
        });
      }
    }
  }

  const ministries = await prisma.ministry.findMany({
    where: { organizationId: grace.id },
    include: { roles: true },
  });
  const ministryBySlug = Object.fromEntries(ministries.map((m) => [m.slug, m]));

  async function ensureVolunteerProfile(input: {
    memberId: string;
    ministrySlug: string;
    skills: string[];
    preferredService?: string;
    experienceYears?: number;
    reliabilityScore?: number;
  }) {
    const ministry = ministryBySlug[input.ministrySlug];
    if (!ministry) return null;

    const existing = await prisma.volunteerProfile.findUnique({
      where: { memberId: input.memberId },
    });
    if (existing) return existing;

    return prisma.volunteerProfile.create({
      data: {
        organizationId: grace.id,
        memberId: input.memberId,
        experienceYears: input.experienceYears ?? 2,
        trainingStatus: "COMPLETED",
        preferredService: input.preferredService ?? "Sunday Morning",
        reliabilityScore: input.reliabilityScore ?? 85,
        totalHours: 48,
        isActive: true,
        skills: {
          create: input.skills.map((name) => ({
            organizationId: grace.id,
            name,
          })),
        },
        availabilities: {
          create: [
            {
              organizationId: grace.id,
              weekday: "SUN",
              startTime: "07:00",
              endTime: "13:00",
            },
            {
              organizationId: grace.id,
              weekday: "WED",
              startTime: "18:00",
              endTime: "21:00",
            },
          ],
        },
        preferences: {
          create: {
            organizationId: grace.id,
            ministryId: ministry.id,
            priority: 1,
          },
        },
      },
    });
  }

  const sarahVolunteer = await ensureVolunteerProfile({
    memberId: sarah.id,
    ministrySlug: "worship",
    skills: ["Vocals", "Piano", "Worship Leading"],
    preferredService: "Sunday Morning",
    experienceYears: 5,
    reliabilityScore: 92,
  });
  const marcusVolunteer = await ensureVolunteerProfile({
    memberId: marcus.id,
    ministrySlug: "kids",
    skills: ["Teaching", "Mentoring"],
    experienceYears: 8,
    reliabilityScore: 94,
  });
  const elenaVolunteer = await ensureVolunteerProfile({
    memberId: elena.id,
    ministrySlug: "kids",
    skills: ["Children's Ministry", "Storytelling"],
    experienceYears: 3,
    reliabilityScore: 88,
  });
  const noahVolunteer = await ensureVolunteerProfile({
    memberId: noah.id,
    ministrySlug: "youth",
    skills: ["Games", "Small Group"],
    experienceYears: 1,
    reliabilityScore: 78,
  });
  const priyaVolunteer = await ensureVolunteerProfile({
    memberId: priya.id,
    ministrySlug: "prayer",
    skills: ["Intercession", "Altar Ministry"],
    experienceYears: 4,
    reliabilityScore: 90,
  });

  const upcomingSunday = setMinutes(setHours(nextSunday(new Date()), 10), 0);
  const serviceEnd = setMinutes(setHours(upcomingSunday, 12), 30);

  const existingEvent = await prisma.scheduleEvent.findFirst({
    where: {
      organizationId: grace.id,
      title: "Sunday Worship Service",
      startsAt: upcomingSunday,
    },
  });

  if (!existingEvent && sarahVolunteer) {
    const worshipMinistry = ministryBySlug.worship!;
    const kidsMinistry = ministryBySlug.kids!;
    const youthMinistry = ministryBySlug.youth!;
    const prayerMinistry = ministryBySlug.prayer!;

    const worshipLeaderRole = worshipMinistry.roles.find(
      (r) => r.name === "Worship Leader"
    );
    const vocalistRole = worshipMinistry.roles.find((r) => r.name === "Vocalist");
    const teacherRole = kidsMinistry.roles.find((r) => r.name === "Teacher");
    const youthLeaderRole = youthMinistry.roles.find((r) => r.name === "Leader");
    const prayerRole = prayerMinistry.roles.find((r) => r.name === "Prayer Team");

    const event = await prisma.scheduleEvent.create({
      data: {
        organizationId: grace.id,
        ministryId: worshipMinistry.id,
        title: "Sunday Worship Service",
        eventType: "SUNDAY_SERVICE",
        campus: "Main Campus",
        startsAt: upcomingSunday,
        endsAt: serviceEnd,
        location: "Main Sanctuary",
        notes: "Upcoming Sunday volunteer schedule",
        slots: {
          create: [
            {
              organizationId: grace.id,
              roleId: worshipLeaderRole?.id,
              title: "Worship Leader",
              needed: 1,
              startsAt: setMinutes(setHours(upcomingSunday, 8), 30),
              endsAt: serviceEnd,
              sortOrder: 0,
            },
            {
              organizationId: grace.id,
              roleId: vocalistRole?.id,
              title: "Vocalist",
              needed: 2,
              startsAt: setMinutes(setHours(upcomingSunday, 8), 45),
              endsAt: serviceEnd,
              sortOrder: 1,
            },
            {
              organizationId: grace.id,
              roleId: teacherRole?.id,
              title: "Kids Teacher",
              needed: 2,
              startsAt: upcomingSunday,
              endsAt: serviceEnd,
              sortOrder: 2,
            },
            {
              organizationId: grace.id,
              roleId: youthLeaderRole?.id,
              title: "Youth Helper",
              needed: 1,
              startsAt: upcomingSunday,
              endsAt: serviceEnd,
              sortOrder: 3,
            },
            {
              organizationId: grace.id,
              roleId: prayerRole?.id,
              title: "Prayer Team",
              needed: 2,
              startsAt: upcomingSunday,
              endsAt: serviceEnd,
              sortOrder: 4,
            },
          ],
        },
      },
      include: { slots: true },
    });

    const slotByTitle = Object.fromEntries(event.slots.map((s) => [s.title, s]));

    const sarahAssignment = sarahVolunteer
      ? await prisma.scheduleAssignment.create({
          data: {
            organizationId: grace.id,
            slotId: slotByTitle["Worship Leader"]!.id,
            volunteerId: sarahVolunteer.id,
            status: "CONFIRMED",
            respondedAt: new Date(),
          },
        })
      : null;

    if (elenaVolunteer) {
      await prisma.scheduleAssignment.create({
        data: {
          organizationId: grace.id,
          slotId: slotByTitle["Kids Teacher"]!.id,
          volunteerId: elenaVolunteer.id,
          status: "CONFIRMED",
          respondedAt: new Date(),
        },
      });
    }

    if (marcusVolunteer) {
      await prisma.scheduleAssignment.create({
        data: {
          organizationId: grace.id,
          slotId: slotByTitle["Kids Teacher"]!.id,
          volunteerId: marcusVolunteer.id,
          status: "ASSIGNED",
        },
      });
    }

    if (noahVolunteer) {
      await prisma.scheduleAssignment.create({
        data: {
          organizationId: grace.id,
          slotId: slotByTitle["Youth Helper"]!.id,
          volunteerId: noahVolunteer.id,
          status: "CONFIRMED",
          respondedAt: new Date(),
        },
      });
    }

    if (priyaVolunteer) {
      await prisma.scheduleAssignment.create({
        data: {
          organizationId: grace.id,
          slotId: slotByTitle["Prayer Team"]!.id,
          volunteerId: priyaVolunteer.id,
          status: "CONFIRMED",
          respondedAt: new Date(),
        },
      });
    }

    if (sarahAssignment && sarahVolunteer) {
      await prisma.volunteerCheckIn.create({
        data: {
          organizationId: grace.id,
          volunteerId: sarahVolunteer.id,
          assignmentId: sarahAssignment.id,
          status: "CHECKED_IN",
          checkedInAt: subDays(upcomingSunday, 7),
          notes: "On time for rehearsal (prior week demo)",
        },
      });
    }

    if (elenaVolunteer) {
      await prisma.volunteerCheckIn.create({
        data: {
          organizationId: grace.id,
          volunteerId: elenaVolunteer.id,
          status: "LATE",
          checkedInAt: subDays(upcomingSunday, 7),
          notes: "Arrived 10 minutes late last service",
        },
      });
    }

    if (sarahVolunteer && elenaVolunteer) {
      await prisma.volunteerActivity.createMany({
        data: [
          {
            organizationId: grace.id,
            volunteerId: sarahVolunteer.id,
            type: "ASSIGNED",
            title: "Assigned to Worship Leader",
            description: "Sunday Worship Service",
            occurredAt: subDays(new Date(), 3),
          },
          {
            organizationId: grace.id,
            volunteerId: elenaVolunteer.id,
            type: "CONFIRMED",
            title: "Confirmed Kids Teacher slot",
            occurredAt: subDays(new Date(), 2),
          },
        ],
      });
    }
  }

  // ===========================================================================
  // Enterprise Events & Church Calendar (Grace Community)
  // ===========================================================================
  const churchEventCount = await prisma.churchEvent.count({
    where: { organizationId: grace.id },
  });

  if (churchEventCount === 0) {
    const sunday = nextSunday(new Date());
    const sundayStart = setMinutes(setHours(sunday, 10), 0);
    const sundayEnd = setMinutes(setHours(sunday, 12), 0);
    const youthNight = setMinutes(setHours(addDaysSafe(sunday, 5), 19), 0);
    const prayer = setMinutes(setHours(addDaysSafe(sunday, -2), 18), 30);
    const bibleStudy = setMinutes(setHours(addDaysSafe(sunday, 3), 19), 0);
    const outreach = setMinutes(setHours(addDaysSafe(sunday, 12), 9), 0);
    const conference = setMinutes(setHours(addDaysSafe(sunday, 21), 9), 0);

    const worshipMinistry = await prisma.ministry.findFirst({
      where: { organizationId: grace.id, slug: "worship" },
    });
    const youthMinistry = await prisma.ministry.findFirst({
      where: { organizationId: grace.id, slug: "youth" },
    });
    const kidsMinistry = await prisma.ministry.findFirst({
      where: { organizationId: grace.id, slug: "kids" },
    });
    const prayerMinistry = await prisma.ministry.findFirst({
      where: { organizationId: grace.id, slug: "prayer" },
    });

    const scheduleSunday = await prisma.scheduleEvent.findFirst({
      where: {
        organizationId: grace.id,
        title: { contains: "Sunday" },
      },
      orderBy: { startsAt: "asc" },
    });

    const members = await prisma.member.findMany({
      where: { organizationId: grace.id },
      take: 8,
      orderBy: { firstName: "asc" },
    });

    const sundayService = await prisma.churchEvent.create({
      data: {
        organizationId: grace.id,
        title: "Sunday Worship Service",
        slug: "sunday-worship-service",
        description:
          "Our weekly gathering — worship, Word, and communion. Families welcome; kids ministry available during the message.",
        heroImageUrl:
          "https://images.unsplash.com/photo-1438232036014-b7b9bdfd957a?w=1600&q=80",
        eventType: "SUNDAY_SERVICE",
        status: "PUBLISHED",
        visibility: "PUBLIC",
        startsAt: sundayStart,
        endsAt: sundayEnd,
        timezone: "America/New_York",
        venueName: "Main Sanctuary",
        venueAddress: "100 Grace Way",
        campus: "Main Campus",
        capacity: 450,
        registrationOpen: true,
        waitlistEnabled: true,
        requiresTicket: true,
        organizerMemberId: members[0]?.id ?? null,
        recurrence: "WEEKLY",
        recurrenceRule: "FREQ=WEEKLY;BYDAY=SU",
        scheduleEventId: scheduleSunday?.id ?? null,
        publishedAt: subDays(new Date(), 14),
        speakers: {
          create: [
            {
              organizationId: grace.id,
              name: "Pastor James Rivera",
              title: "Lead Pastor",
              bio: "Teaching through the Gospel of John.",
              sortOrder: 0,
            },
          ],
        },
        resources: {
          create: [
            {
              organizationId: grace.id,
              type: "ROOM",
              name: "Main Sanctuary",
              quantity: 1,
            },
            {
              organizationId: grace.id,
              type: "EQUIPMENT",
              name: "Worship PA / livestream kit",
              quantity: 1,
            },
          ],
        },
        ministries: {
          create: [
            ...(worshipMinistry
              ? [
                  {
                    organizationId: grace.id,
                    ministryId: worshipMinistry.id,
                  },
                ]
              : []),
            ...(kidsMinistry
              ? [
                  {
                    organizationId: grace.id,
                    ministryId: kidsMinistry.id,
                    notes: "Kids church during sermon",
                  },
                ]
              : []),
          ],
        },
        attachments: {
          create: [
            {
              organizationId: grace.id,
              name: "Order of Service.pdf",
              mimeType: "application/pdf",
              sizeBytes: 182000,
              storageKey: "seed/sunday-oos.pdf",
              url: null,
            },
          ],
        },
      },
    });

    const youth = await prisma.churchEvent.create({
      data: {
        organizationId: grace.id,
        title: "Friday Youth Night",
        slug: "friday-youth-night",
        description: "Games, worship, and small groups for middle & high school.",
        heroImageUrl:
          "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1600&q=80",
        eventType: "YOUTH_SERVICE",
        status: "PUBLISHED",
        visibility: "MEMBERS",
        startsAt: youthNight,
        endsAt: setMinutes(setHours(youthNight, 21), 0),
        venueName: "Youth Loft",
        campus: "Main Campus",
        capacity: 80,
        recurrence: "WEEKLY",
        publishedAt: subDays(new Date(), 7),
        ministries: youthMinistry
          ? {
              create: [
                {
                  organizationId: grace.id,
                  ministryId: youthMinistry.id,
                },
              ],
            }
          : undefined,
        speakers: {
          create: [
            {
              organizationId: grace.id,
              name: "Coach Maya Chen",
              title: "Youth Pastor",
              sortOrder: 0,
            },
          ],
        },
      },
    });

    const prayerMeeting = await prisma.churchEvent.create({
      data: {
        organizationId: grace.id,
        title: "Midweek Prayer Meeting",
        slug: "midweek-prayer",
        description: "Corporate prayer for our city and church family.",
        eventType: "PRAYER_MEETING",
        status: "PUBLISHED",
        startsAt: prayer,
        endsAt: setMinutes(setHours(prayer, 20), 0),
        venueName: "Chapel",
        capacity: 60,
        recurrence: "WEEKLY",
        publishedAt: subDays(new Date(), 5),
        ministries: prayerMinistry
          ? {
              create: [
                {
                  organizationId: grace.id,
                  ministryId: prayerMinistry.id,
                },
              ],
            }
          : undefined,
      },
    });

    await prisma.churchEvent.create({
      data: {
        organizationId: grace.id,
        title: "Wednesday Bible Study",
        slug: "wednesday-bible-study",
        description: "Verse-by-verse study open to all adults.",
        eventType: "BIBLE_STUDY",
        status: "PUBLISHED",
        startsAt: bibleStudy,
        endsAt: setMinutes(setHours(bibleStudy, 20), 30),
        venueName: "Fellowship Hall",
        capacity: 100,
        recurrence: "WEEKLY",
        publishedAt: subDays(new Date(), 4),
      },
    });

    await prisma.churchEvent.create({
      data: {
        organizationId: grace.id,
        title: "Community Outreach Saturday",
        slug: "community-outreach-saturday",
        description: "Food pantry + neighborhood blessing bags.",
        eventType: "OUTREACH",
        status: "PUBLISHED",
        startsAt: outreach,
        endsAt: setMinutes(setHours(outreach, 13), 0),
        venueName: "Grace Parking Lot",
        capacity: 120,
        registrationOpen: true,
        publishedAt: subDays(new Date(), 2),
      },
    });

    await prisma.churchEvent.create({
      data: {
        organizationId: grace.id,
        title: "Leadership Training Intensive",
        slug: "leadership-training-intensive",
        description: "Two-day equipping for cell & ministry leaders.",
        eventType: "TRAINING",
        status: "DRAFT",
        startsAt: setMinutes(setHours(addDaysSafe(sunday, 28), 9), 0),
        endsAt: setMinutes(setHours(addDaysSafe(sunday, 29), 16), 0),
        venueName: "Admin Building · Room 2",
        capacity: 40,
        visibility: "INVITE_ONLY",
      },
    });

    await prisma.churchEvent.create({
      data: {
        organizationId: grace.id,
        title: "Citywide Faith Conference",
        slug: "citywide-faith-conference",
        description: "Guest speakers, workshops, and night of worship.",
        eventType: "CONFERENCE",
        status: "PUBLISHED",
        startsAt: conference,
        endsAt: setMinutes(setHours(addDaysSafe(conference, 1), 21), 0),
        venueName: "Main Sanctuary",
        capacity: 600,
        waitlistEnabled: true,
        publishedAt: new Date(),
        speakers: {
          create: [
            {
              organizationId: grace.id,
              name: "Dr. Amina Okonkwo",
              title: "Keynote",
              sortOrder: 0,
            },
            {
              organizationId: grace.id,
              name: "Pastor James Rivera",
              title: "Host",
              sortOrder: 1,
            },
          ],
        },
        resources: {
          create: [
            {
              organizationId: grace.id,
              type: "ROOM",
              name: "Sanctuary + overflow",
              quantity: 2,
            },
            {
              organizationId: grace.id,
              type: "VEHICLE",
              name: "Shuttle van",
              quantity: 2,
              notes: "Airport + hotel runs",
            },
          ],
        },
      },
    });

    await prisma.churchEvent.create({
      data: {
        organizationId: grace.id,
        title: "Children's Easter Celebration",
        slug: "childrens-easter-celebration",
        description: "Games, story time, and family picnic.",
        eventType: "CHILDREN_EVENT",
        status: "PUBLISHED",
        startsAt: setMinutes(setHours(addDaysSafe(sunday, 35), 11), 0),
        endsAt: setMinutes(setHours(addDaysSafe(sunday, 35), 14), 0),
        venueName: "Kids Wing & Lawn",
        capacity: 150,
        publishedAt: new Date(),
        ministries: kidsMinistry
          ? {
              create: [
                {
                  organizationId: grace.id,
                  ministryId: kidsMinistry.id,
                },
              ],
            }
          : undefined,
      },
    });

    // Registrations + QR tickets for Sunday service
    const guestReg = await prisma.eventRegistration.create({
      data: {
        organizationId: grace.id,
        eventId: sundayService.id,
        registrantType: "GUEST",
        guestName: "Alex Nguyen",
        guestEmail: "alex.nguyen@example.com",
        partySize: 2,
        status: "REGISTERED",
        tickets: {
          create: [
            {
              organizationId: grace.id,
              eventId: sundayService.id,
              holderName: "Alex Nguyen",
              status: "VALID",
            },
            {
              organizationId: grace.id,
              eventId: sundayService.id,
              holderName: "Guest of Alex",
              status: "VALID",
            },
          ],
        },
      },
      include: { tickets: true },
    });

    if (members[0]) {
      await prisma.eventRegistration.create({
        data: {
          organizationId: grace.id,
          eventId: sundayService.id,
          registrantType: "MEMBER",
          memberId: members[0].id,
          partySize: 1,
          status: "CHECKED_IN",
          checkedInAt: sundayStart,
          tickets: {
            create: [
              {
                organizationId: grace.id,
                eventId: sundayService.id,
                holderName: `${members[0].firstName} ${members[0].lastName}`,
                status: "USED",
                usedAt: sundayStart,
              },
            ],
          },
        },
      });
    }

    if (members[1]) {
      const reg = await prisma.eventRegistration.create({
        data: {
          organizationId: grace.id,
          eventId: youth.id,
          registrantType: "MEMBER",
          memberId: members[1].id,
          partySize: 1,
          status: "REGISTERED",
          tickets: {
            create: [
              {
                organizationId: grace.id,
                eventId: youth.id,
                holderName: `${members[1].firstName} ${members[1].lastName}`,
                status: "VALID",
              },
            ],
          },
        },
      });
      void reg;
    }

    // Family / group style registration
    await prisma.eventRegistration.create({
      data: {
        organizationId: grace.id,
        eventId: sundayService.id,
        registrantType: "GROUP",
        guestName: "Hospitality Team",
        partySize: 6,
        status: "REGISTERED",
        notes: "Serving coffee after service",
        tickets: {
          create: Array.from({ length: 6 }, (_, i) => ({
            organizationId: grace.id,
            eventId: sundayService.id,
            holderName: `Hospitality ${i + 1}`,
            status: "VALID" as const,
          })),
        },
      },
    });

    // Waitlist demo on conference-sized capacity pressure for prayer (small)
    await prisma.eventRegistration.create({
      data: {
        organizationId: grace.id,
        eventId: prayerMeeting.id,
        registrantType: "GUEST",
        guestName: "Waitlist Guest",
        partySize: 1,
        status: "WAITLISTED",
      },
    });
    await prisma.eventWaitlistEntry.create({
      data: {
        organizationId: grace.id,
        eventId: prayerMeeting.id,
        guestName: "Waitlist Guest",
        partySize: 1,
        position: 1,
      },
    });

    const usedTicket = await prisma.eventTicket.findFirst({
      where: {
        eventId: sundayService.id,
        status: "USED",
      },
    });
    if (usedTicket && members[0]) {
      await prisma.eventCheckIn.create({
        data: {
          organizationId: grace.id,
          eventId: sundayService.id,
          ticketId: usedTicket.id,
          registrationId: usedTicket.registrationId,
          memberId: members[0].id,
          method: "QR",
          checkedInAt: sundayStart,
        },
      });
    }

    await prisma.eventActivity.createMany({
      data: [
        {
          organizationId: grace.id,
          eventId: sundayService.id,
          type: "CREATED",
          title: "Event created",
          occurredAt: subDays(new Date(), 14),
        },
        {
          organizationId: grace.id,
          eventId: sundayService.id,
          type: "PUBLISHED",
          title: "Event published",
          occurredAt: subDays(new Date(), 14),
        },
        {
          organizationId: grace.id,
          eventId: sundayService.id,
          type: "REGISTRATION",
          title: "Registration confirmed",
          description: guestReg.guestName ?? "Guest",
          occurredAt: subDays(new Date(), 2),
        },
        {
          organizationId: grace.id,
          eventId: sundayService.id,
          type: "CHECKED_IN",
          title: "Check-in via QR",
          occurredAt: sundayStart,
        },
        {
          organizationId: grace.id,
          eventId: youth.id,
          type: "PUBLISHED",
          title: "Youth night published",
          occurredAt: subDays(new Date(), 7),
        },
      ],
    });

    await prisma.eventMessage.create({
      data: {
        organizationId: grace.id,
        eventId: sundayService.id,
        channel: "EMAIL",
        subject: "See you Sunday!",
        body: "Parking opens at 9:15. Kids check-in in the lobby.",
        metadata: { provider: null, queued: false },
        scheduledFor: subDays(sundayStart, 1),
      },
    });

    console.log("✓ Seeded church calendar events for Grace Community");
  }
}

function addDaysSafe(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
