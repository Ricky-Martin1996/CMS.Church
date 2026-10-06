import { importMembersCsv } from "@/application/people/member-service";
import { prisma } from "@/infrastructure/db/prisma";

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result.map((s) => s.trim());
}

/** Reproduce current action parsing (with known bugs). */
function parseLikeAction(text: string) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const rows = lines.slice(1).map((line) => {
    const cols = parseCsvLine(line);
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = cols[i] ?? "";
    });
    return {
      firstName: obj.firstName || obj.FirstName || "",
      lastName: obj.lastName || obj.LastName || "",
      email: obj.email || obj.Email,
      phone: obj.phone || obj.Phone,
      status: obj.status || obj.Status,
      campus: obj.campus || obj.Campus,
      ministryRole: obj.ministryRole || obj.role || obj.Role,
      tags: obj.tags || obj.Tags,
    };
  });
  return { headers, rows };
}

async function main() {
  const org = await prisma.organization.upsert({
    where: { slug: "bug003-org" },
    update: {},
    create: { name: "BUG003 Org", slug: "bug003-org" },
  });
  const user = await prisma.user.upsert({
    where: { clerkUserId: "user_bug003" },
    update: {},
    create: {
      clerkUserId: "user_bug003",
      email: "bug003@test.com",
      firstName: "Bug",
      lastName: "Three",
    },
  });

  const bomCsv =
    "\ufefffirstName,lastName,email,phone,status,campus,ministryRole,tags\r\n" +
    'Alice,Anderson,alice@ex.com,555-0100,ACTIVE,Main,Worship,"New Member|Leader"\r\n' +
    "Bob,Baker,bob@ex.com,,VISITOR,Main,,\r\n";

  const parsed = parseLikeAction(bomCsv);
  console.log("BUG repro — headers:", JSON.stringify(parsed.headers));
  console.log(
    "first header codes:",
    [...parsed.headers[0]].map((c) => c.charCodeAt(0))
  );
  console.log(
    "rows with empty firstName:",
    parsed.rows.filter((r) => !r.firstName).length,
    "/",
    parsed.rows.length
  );

  const result = await importMembersCsv({
    organizationId: org.id,
    actorUserId: user.id,
    rows: parsed.rows,
  });
  console.log("import with BOM (buggy parse) created:", result.created);
  // Expect 0 because firstName key is \\ufefffirstName
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
