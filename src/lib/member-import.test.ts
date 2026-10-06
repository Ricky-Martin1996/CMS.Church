import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { after, describe, it } from "node:test";
import * as XLSX from "xlsx";
import { importMembersCsv } from "@/application/people/member-service";
import {
  mapHeader,
  parseMemberCsv,
  parseMemberImportFile,
  parseMemberXlsx,
  toImportServiceRows,
} from "@/lib/member-import";
import { prisma } from "@/infrastructure/db/prisma";

const FIXTURES = join(process.cwd(), "test", "fixtures", "imports");

describe("BUG-003 member CSV/XLSX import", () => {
  after(async () => {
    await prisma.$disconnect();
  });

  it("maps Excel-style headers to canonical fields", () => {
    assert.equal(mapHeader("First Name"), "firstName");
    assert.equal(mapHeader("last_name"), "lastName");
    assert.equal(mapHeader("\ufeffEmail Address"), "email");
    assert.equal(mapHeader("Phone Number"), "phone");
    assert.equal(mapHeader("Ministry Role"), "ministryRole");
  });

  it("parses CSV with BOM, CRLF, and quoted tags", () => {
    const csv =
      "\ufeffFirst Name,Last Name,Email Address,Phone Number,Status,Campus,Tags\r\n" +
      'Alice,Anderson,alice@ex.com,555-0100,ACTIVE,Main,"New Member|Leader"\r\n' +
      "Bob,Baker,bob@ex.com,,Visitor,North,\r\n" +
      ",,,,,\r\n";

    const parsed = parseMemberCsv(csv);
    assert.equal(parsed.rows.length, 2);
    assert.equal(parsed.rows[0]?.firstName, "Alice");
    assert.equal(parsed.rows[0]?.email, "alice@ex.com");
    assert.equal(parsed.rows[0]?.tags, "New Member|Leader");
    assert.equal(parsed.rows[1]?.status, "Visitor");
    assert.ok(parsed.skipped >= 1);
  });

  it("parses XLSX workbook bytes", () => {
    mkdirSync(FIXTURES, { recursive: true });
    const sheet = XLSX.utils.aoa_to_sheet([
      ["First Name", "Last Name", "Email", "Status"],
      ["Carol", "Clark", "carol@ex.com", "ACTIVE"],
      ["Dan", "Davis", "dan@ex.com", "VISITOR"],
    ]);
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, "Members");
    const filePath = join(FIXTURES, "members-sample.xlsx");
    XLSX.writeFile(book, filePath);

    const buffer = readFileSync(filePath);
    const parsed = parseMemberXlsx(buffer);
    assert.equal(parsed.rows.length, 2);
    assert.equal(parsed.rows[0]?.firstName, "Carol");
    assert.equal(parsed.rows[1]?.lastName, "Davis");

    const viaFile = parseMemberImportFile({
      filename: "members-sample.xlsx",
      buffer,
    });
    assert.equal(viaFile.rows.length, 2);
  });

  it("imports Excel-header CSV rows into Prisma", async () => {
    const suffix = Date.now().toString(36);
    const org = await prisma.organization.upsert({
      where: { slug: `bug003-import-${suffix}` },
      update: {},
      create: { name: "BUG003 Import", slug: `bug003-import-${suffix}` },
    });
    const user = await prisma.user.upsert({
      where: { clerkUserId: `user_bug003_${suffix}` },
      update: {},
      create: {
        clerkUserId: `user_bug003_${suffix}`,
        email: `bug003-${suffix}@example.com`,
        firstName: "Bug",
        lastName: "Three",
      },
    });

    mkdirSync(FIXTURES, { recursive: true });
    const csvPath = join(FIXTURES, "members-sample.csv");
    const csv =
      "First Name,Last Name,Email Address,Status,Campus\n" +
      `Eve,Evans,eve-${suffix}@ex.com,ACTIVE,Main\n` +
      `Frank,Foster,frank-${suffix}@ex.com,VISITOR,East\n`;
    writeFileSync(csvPath, csv, "utf8");

    const parsed = parseMemberCsv(readFileSync(csvPath, "utf8"));
    assert.equal(parsed.rows.length, 2);

    const result = await importMembersCsv({
      organizationId: org.id,
      actorUserId: user.id,
      rows: toImportServiceRows(parsed.rows),
    });
    assert.equal(result.created, 2);

    const members = await prisma.member.findMany({
      where: { organizationId: org.id, deletedAt: null },
      orderBy: { firstName: "asc" },
    });
    assert.equal(members.length, 2);
    assert.equal(members[0]?.firstName, "Eve");
    assert.equal(members[1]?.email, `frank-${suffix}@ex.com`);

    const imported = await prisma.memberActivity.count({
      where: { organizationId: org.id, type: "IMPORTED" },
    });
    assert.equal(imported, 2);

    // Duplicate email detection
    const again = await importMembersCsv({
      organizationId: org.id,
      actorUserId: user.id,
      rows: toImportServiceRows(parsed.rows),
    });
    assert.equal(again.created, 0);
    assert.equal(again.duplicates, 2);
  });

  it("rejects workbook without first/last name columns", () => {
    const parsed = parseMemberCsv("Email,Phone\na@b.com,1\n");
    assert.equal(parsed.rows.length, 0);
    assert.ok(
      parsed.issues.some((i) => i.message.toLowerCase().includes("first name"))
    );
  });
});
