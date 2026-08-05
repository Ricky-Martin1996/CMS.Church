/**
 * Verifies expected Prisma tables exist in the public schema.
 * Usage: npx tsx scripts/verify-db-schema.ts
 */
import { PrismaClient } from "@prisma/client";

/** Physical table names from @@map in prisma/schema.prisma */
const EXPECTED_TABLES = [
  "users",
  "organizations",
  "memberships",
  "members",
  "tags",
  "member_tags",
  "households",
  "family_members",
  "household_activities",
  "household_notes",
  "household_documents",
  "saved_household_filters",
  "household_list_preferences",
  "member_notes",
  "member_documents",
  "member_activities",
  "attendance_sessions",
  "attendance_records",
  "visitors",
  "visitor_attendances",
  "visitor_journeys",
  "visitor_stage_configs",
  "follow_up_tasks",
  "communication_logs",
  "visitor_status_history",
  "visitor_activities",
  "giving_records",
  "prayer_requests",
  "volunteer_assignments",
  "saved_member_filters",
  "member_list_preferences",
  "ministries",
  "ministry_roles",
  "volunteer_profiles",
  "volunteer_skills",
  "volunteer_certifications",
  "volunteer_availabilities",
  "volunteer_ministry_preferences",
  "schedule_events",
  "schedule_slots",
  "schedule_assignments",
  "schedule_swap_requests",
  "volunteer_check_ins",
  "volunteer_messages",
  "volunteer_activities",
  "church_events",
  "event_registrations",
  "event_tickets",
  "event_check_ins",
  "event_speakers",
  "event_attachments",
  "event_resources",
  "event_ministries",
  "event_waitlist",
  "event_activities",
  "event_messages",
  "communication_templates",
  "communication_campaigns",
  "communication_messages",
  "communication_deliveries",
  "communication_automations",
  "communication_activities",
  "communication_provider_configs",
] as const;

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }

  const prisma = new PrismaClient();
  try {
    const rows = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `;

    const existing = new Set(rows.map((r) => r.tablename));
    const missing = EXPECTED_TABLES.filter((t) => !existing.has(t));
    const migrations = await prisma.$queryRaw<
      Array<{ migration_name: string; finished_at: Date | null }>
    >`
      SELECT migration_name, finished_at
      FROM "_prisma_migrations"
      ORDER BY finished_at ASC NULLS LAST
    `;

    console.log(`Tables in public schema: ${existing.size}`);
    for (const name of [...existing].sort()) {
      console.log(`  ✓ ${name}`);
    }

    console.log(`\nApplied migrations: ${migrations.length}`);
    for (const m of migrations) {
      console.log(`  ✓ ${m.migration_name}`);
    }

    if (missing.length > 0) {
      console.error(`\nMissing expected tables (${missing.length}):`);
      for (const t of missing) console.error(`  ✗ ${t}`);
      process.exit(1);
    }

    const orgCount = await prisma.organization.count();
    const userCount = await prisma.user.count();
    console.log(`\nRow counts: organizations=${orgCount}, users=${userCount}`);
    console.log("Schema verification passed.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
