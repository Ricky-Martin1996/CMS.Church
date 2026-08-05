import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/db/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Public readiness probe for ops.
 * Reports DB connectivity + migration/table counts (no sensitive row data).
 */
export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      {
        ok: false,
        database: "unconfigured",
        message: "DATABASE_URL is not set",
      },
      { status: 503 }
    );
  }

  try {
    await prisma.$queryRaw`SELECT 1`;

    const migrations = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint AS count FROM "_prisma_migrations"
      WHERE finished_at IS NOT NULL
    `;
    const tables = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint AS count
      FROM pg_tables
      WHERE schemaname = 'public'
    `;
    const organizations = await prisma.organization.count();
    const users = await prisma.user.count();

    const migrationCount = Number(migrations[0]?.count ?? 0);
    const tableCount = Number(tables[0]?.count ?? 0);
    const ready = migrationCount >= 9 && tableCount >= 50;

    return NextResponse.json(
      {
        ok: ready,
        database: "connected",
        migrations: migrationCount,
        tables: tableCount,
        organizations,
        users,
      },
      { status: ready ? 200 : 503 }
    );
  } catch (error) {
    console.error("[churchos] /api/health failed", error);
    return NextResponse.json(
      {
        ok: false,
        database: "error",
        message: "Database probe failed",
      },
      { status: 503 }
    );
  }
}
