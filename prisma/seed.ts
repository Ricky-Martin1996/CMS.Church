import { PrismaClient, Role } from "@prisma/client";

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

  const member = await prisma.user.upsert({
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
      userId: member.id,
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

  console.log("✅ Seed complete");
  console.log(`   Organizations: ${grace.slug}, ${north.slug}`);
  console.log(`   Users: ${superAdmin.email}, ${pastor.email}, ${finance.email}, ${member.email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
