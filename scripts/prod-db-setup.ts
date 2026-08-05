/**
 * Production database setup:
 * 1. prisma migrate deploy
 * 2. verify tables
 * 3. seed (idempotent upserts)
 *
 * Requires DATABASE_URL pointing at Neon (or any Postgres).
 */
import { spawn } from "node:child_process";
import path from "node:path";

function run(cmd: string, args: string[]) {
  return new Promise<void>((resolve, reject) => {
    console.log(`\n→ ${cmd} ${args.join(" ")}`);
    const child = spawn(cmd, args, {
      stdio: "inherit",
      env: process.env,
      shell: true,
      cwd: process.cwd(),
    });
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} ${args.join(" ")} exited ${code}`));
    });
    child.on("error", reject);
  });
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required");
  }
  if (/localhost|127\.0\.0\.1/.test(url) && process.env.ALLOW_LOCAL_SETUP !== "1") {
    throw new Error(
      "DATABASE_URL points at localhost. Set the Neon production URL, or ALLOW_LOCAL_SETUP=1 to proceed."
    );
  }

  const redacted = url.replace(/:[^:@/]+@/, ":***@");
  console.log(`Using DATABASE_URL=${redacted}`);

  await run("npx", ["prisma", "migrate", "deploy"]);
  await run("npx", ["tsx", path.join("scripts", "verify-db-schema.ts")]);
  await run("npx", ["tsx", path.join("prisma", "seed.ts")]);
  await run("npx", ["tsx", path.join("scripts", "verify-db-schema.ts")]);

  console.log("\nProduction database setup complete.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
