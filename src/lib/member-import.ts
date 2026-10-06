/**
 * Member CSV / XLSX import parsing + validation.
 * Fixes BUG-003: Excel headers, BOM, quoted fields, and .xlsx uploads.
 */
import * as XLSX from "xlsx";

export type MemberImportRow = {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  status?: string;
  campus?: string;
  ministryRole?: string;
  tags?: string;
  lineNumber: number;
};

export type MemberImportIssue = {
  lineNumber: number;
  message: string;
};

export type MemberImportParseResult = {
  rows: MemberImportRow[];
  issues: MemberImportIssue[];
  headers: string[];
  skipped: number;
};

const HEADER_ALIASES: Record<string, keyof Omit<MemberImportRow, "lineNumber">> =
  {
    firstname: "firstName",
    first_name: "firstName",
    "first name": "firstName",
    fname: "firstName",
    givenname: "firstName",
    "given name": "firstName",
    lastname: "lastName",
    last_name: "lastName",
    "last name": "lastName",
    surname: "lastName",
    lname: "lastName",
    familyname: "lastName",
    "family name": "lastName",
    email: "email",
    "email address": "email",
    emailaddress: "email",
    e_mail: "email",
    phone: "phone",
    "phone number": "phone",
    phonenumber: "phone",
    mobile: "phone",
    cellphone: "phone",
    status: "status",
    memberstatus: "status",
    "member status": "status",
    campus: "campus",
    location: "campus",
    site: "campus",
    ministryrole: "ministryRole",
    "ministry role": "ministryRole",
    role: "ministryRole",
    ministry: "ministryRole",
    tags: "tags",
    tag: "tags",
    labels: "tags",
  };

export function normalizeHeader(raw: string): string {
  return raw
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

export function mapHeader(
  raw: string
): keyof Omit<MemberImportRow, "lineNumber"> | null {
  const key = normalizeHeader(raw);
  return HEADER_ALIASES[key] ?? null;
}

export function parseCsvLine(line: string): string[] {
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

function stripBom(text: string): string {
  return text.replace(/^\uFEFF/, "");
}

function rowsFromMatrix(
  matrix: string[][],
  options?: { maxRows?: number }
): MemberImportParseResult {
  const maxRows = options?.maxRows ?? 1000;
  const issues: MemberImportIssue[] = [];
  if (matrix.length < 2) {
    return {
      rows: [],
      issues: [{ lineNumber: 1, message: "File has no data rows" }],
      headers: matrix[0] ?? [],
      skipped: 0,
    };
  }

  const rawHeaders = matrix[0].map((h) => stripBom(String(h ?? "")));
  const fieldIndexes: Array<{
    index: number;
    field: keyof Omit<MemberImportRow, "lineNumber">;
  }> = [];

  rawHeaders.forEach((header, index) => {
    const field = mapHeader(header);
    if (field) fieldIndexes.push({ index, field });
  });

  if (!fieldIndexes.some((f) => f.field === "firstName")) {
    issues.push({
      lineNumber: 1,
      message:
        "Missing first name column (accepted: firstName, First Name, first_name)",
    });
  }
  if (!fieldIndexes.some((f) => f.field === "lastName")) {
    issues.push({
      lineNumber: 1,
      message:
        "Missing last name column (accepted: lastName, Last Name, last_name)",
    });
  }

  const rows: MemberImportRow[] = [];
  let skipped = 0;
  const dataLines = matrix.slice(1);

  if (dataLines.length > maxRows) {
    issues.push({
      lineNumber: 1,
      message: `Import is limited to ${maxRows} rows (file has ${dataLines.length})`,
    });
  }

  for (let i = 0; i < Math.min(dataLines.length, maxRows); i++) {
    const lineNumber = i + 2;
    const cols = dataLines[i] ?? [];
    const row: MemberImportRow = {
      firstName: "",
      lastName: "",
      lineNumber,
    };
    for (const { index, field } of fieldIndexes) {
      const value = String(cols[index] ?? "").trim();
      if (value) row[field] = value;
    }

    if (!row.firstName && !row.lastName && !row.email && !row.phone) {
      skipped += 1;
      continue;
    }
    if (!row.firstName || !row.lastName) {
      skipped += 1;
      issues.push({
        lineNumber,
        message: "Skipped — first name and last name are required",
      });
      continue;
    }
    if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
      issues.push({
        lineNumber,
        message: `Invalid email "${row.email}" — row will import without email`,
      });
      row.email = undefined;
    }
    rows.push(row);
  }

  return { rows, issues, headers: rawHeaders, skipped };
}

export function parseMemberCsv(
  text: string,
  options?: { maxRows?: number }
): MemberImportParseResult {
  const cleaned = stripBom(text).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = cleaned.split("\n").filter((line, idx, arr) => {
    // keep empty trailing? drop only fully empty lines at end
    if (idx === arr.length - 1 && line.trim() === "") return false;
    return true;
  });
  const matrix = lines.map((line) => parseCsvLine(line));
  return rowsFromMatrix(matrix, options);
}

export function parseMemberXlsx(
  buffer: ArrayBuffer | Buffer,
  options?: { maxRows?: number }
): MemberImportParseResult {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: false });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return {
      rows: [],
      issues: [{ lineNumber: 1, message: "Workbook has no sheets" }],
      headers: [],
      skipped: 0,
    };
  }
  const sheet = workbook.Sheets[sheetName];
  const matrix = XLSX.utils.sheet_to_json<string[]>(sheet, {
    header: 1,
    raw: false,
    defval: "",
  }) as string[][];
  return rowsFromMatrix(
    matrix.map((row) => (row ?? []).map((c) => String(c ?? ""))),
    options
  );
}

export function parseMemberImportFile(input: {
  filename: string;
  text?: string;
  buffer?: ArrayBuffer | Buffer;
  maxRows?: number;
}): MemberImportParseResult {
  const name = input.filename.toLowerCase();
  if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
    if (!input.buffer) {
      return {
        rows: [],
        issues: [
          {
            lineNumber: 1,
            message: "Excel file bytes are required for .xlsx/.xls imports",
          },
        ],
        headers: [],
        skipped: 0,
      };
    }
    return parseMemberXlsx(input.buffer, { maxRows: input.maxRows });
  }

  if (!input.text && input.buffer) {
    input.text = Buffer.from(input.buffer).toString("utf8");
  }
  if (!input.text) {
    return {
      rows: [],
      issues: [{ lineNumber: 1, message: "File content is empty" }],
      headers: [],
      skipped: 0,
    };
  }
  return parseMemberCsv(input.text, { maxRows: input.maxRows });
}

export function toImportServiceRows(rows: MemberImportRow[]) {
  return rows.map(({ lineNumber: _line, ...rest }) => rest);
}
