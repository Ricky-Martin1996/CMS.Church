/**
 * Seeds when Organization count is 0.
 * Invoked from prebuild-db on Vercel (or FORCE_SEED_IF_EMPTY=1).
 */
import { PrismaClient } from "@prisma/client";
import { spawn } from "node:child_process";
import path from "node:path";

async function main() {
  if (!process.env.DATABASE_URL) {
    console.log("[seed-if-empty] DATABASE_URL unset — skipping");
    return;
  }

  const prisma = new PrismaClient();
  try {
    const orgCount = await prisma.organization.count();
    if (orgCount > 0) {
      console.log(
        `[seed-if-empty] ${orgCount} organization(s) present — skipping seed`
      );
      return;
    }
  } catch (error) {
    console.error(
      "[seed-if-empty] Could not query organizations — skipping seed.",
      error
    );
    return;
  } finally {
    await prisma.$disconnect();
  }

  console.log("[seed-if-empty] Empty database — running prisma/seed.ts");
  const seedPath = path.join(process.cwd(), "prisma", "seed.ts");
  await new Promise<void>((resolve, reject) => {
    const child = spawn("npx", ["tsx", seedPath], {
      stdio: "inherit",
      env: process.env,
      shell: true,
    });
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`seed exited with code ${code}`));
    });
    child.on("error", reject);
  });
}

main().catch((error) => {
  console.error("[seed-if-empty] failed", error);
  process.exit(1);
});
