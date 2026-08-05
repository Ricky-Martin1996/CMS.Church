/**
 * Pre-build DB steps for Vercel production:
 * - prisma migrate deploy
 * - seed when the database has zero organizations
 *
 * Skipped off Vercel unless RUN_MIGRATE_ON_BUILD=1 (so local `npm run build`
 * still works without a live Postgres).
 */
import { spawn } from "node:child_process";
import path from "node:path";

function run(cmd: string, args: string[]) {
  return new Promise<void>((resolve, reject) => {
    console.log(`→ ${cmd} ${args.join(" ")}`);
    const child = spawn(cmd, args, {
      stdio: "inherit",
      env: process.env,
      shell: true,
      cwd: process.cwd(),
    });
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} exited ${code}`));
    });
    child.on("error", reject);
  });
}

async function main() {
  const shouldMigrate =
    process.env.VERCEL === "1" || process.env.RUN_MIGRATE_ON_BUILD === "1";

  if (!shouldMigrate) {
    console.log(
      "[prebuild-db] Skipping migrate/seed (not on Vercel). Set RUN_MIGRATE_ON_BUILD=1 to force."
    );
    return;
  }

  if (!process.env.DATABASE_URL) {
    throw new Error("[prebuild-db] DATABASE_URL is required on Vercel builds");
  }

  const redacted = process.env.DATABASE_URL.replace(/:[^:@/]+@/, ":***@");
  console.log(`[prebuild-db] Migrating ${redacted}`);

  await run("npx", ["prisma", "migrate", "deploy"]);
  await run("npx", [
    "tsx",
    path.join("scripts", "seed-if-empty.ts"),
  ]);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
