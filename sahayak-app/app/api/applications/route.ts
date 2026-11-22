import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

const STATUSES = [
  "saved",
  "documents_ready",
  "applied",
  "under_review",
  "approved",
  "rejected",
] as const;

type Status = (typeof STATUSES)[number];

interface ApplicationRow {
  id: string;
  scheme_id: string;
  status: string;
  checklist_json: string;
  created_at: string;
  updated_at: string;
  next_reminder_date: string | null;
}

const SERVER_ERROR = {
  error_hi: "सर्वर में त्रुटि हुई, कृपया फिर से कोशिश करें",
  error_en: "Server error, please try again",
};

const NOT_FOUND = {
  error_hi: "आवेदन नहीं मिला",
  error_en: "Application not found",
};

function badRequest(error_hi: string, error_en: string) {
  return NextResponse.json({ error_hi, error_en }, { status: 400 });
}

function isStatus(value: unknown): value is Status {
  return typeof value === "string" && (STATUSES as readonly string[]).includes(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function parseChecklist(raw: string): string[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    return isStringArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function toApplication(row: ApplicationRow) {
  return {
    id: row.id,
    scheme_id: row.scheme_id,
    status: row.status,
    checklist: parseChecklist(row.checklist_json),
    created_at: row.created_at,
    updated_at: row.updated_at,
    next_reminder_date: row.next_reminder_date,
  };
}

// Date as YYYY-MM-DD in the server's local time, plus a number of days.
function dateAfterDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function readBody(req: Request): Promise<Record<string, unknown>> {
  try {
    const body: unknown = await req.json();
    return typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export async function POST(req: Request) {
  const data = await readBody(req);

  const schemeId = data.scheme_id;
  if (typeof schemeId !== "string" || schemeId.length === 0) {
    return badRequest("योजना चुनना ज़रूरी है", "scheme_id is required");
  }

  if (data.checklist !== undefined && !isStringArray(data.checklist)) {
    return badRequest("चेकलिस्ट सिर्फ़ टेक्स्ट की सूची हो सकती है", "checklist must be an array of strings");
  }
  const checklist: string[] = data.checklist ?? [];

  try {
    const db = getDb();
    const schemeRes = await db.execute({
      sql: "SELECT id FROM schemes WHERE id = ?",
      args: [schemeId],
    });
    if (schemeRes.rows.length === 0) {
      return badRequest("योजना नहीं मिली", "Scheme not found");
    }

    const now = new Date().toISOString();
    const id = randomUUID();
    await db.execute({
      sql: `INSERT INTO applications (id, scheme_id, status, checklist_json, created_at, updated_at, next_reminder_date)
            VALUES (?, ?, 'saved', ?, ?, ?, NULL)`,
      args: [id, schemeId, JSON.stringify(checklist), now, now],
    });

    const rowRes = await db.execute({
      sql: "SELECT * FROM applications WHERE id = ?",
      args: [id],
    });
    const row = rowRes.rows[0] as unknown as ApplicationRow;
    return NextResponse.json({ application: toApplication(row) }, { status: 201 });
  } catch {
    return NextResponse.json(SERVER_ERROR, { status: 500 });
  }
}

export async function GET() {
  try {
    const db = getDb();
    const res = await db.execute("SELECT * FROM applications ORDER BY created_at DESC");
    const rows = res.rows as unknown as ApplicationRow[];
    return NextResponse.json({ applications: rows.map(toApplication) });
  } catch {
    return NextResponse.json(SERVER_ERROR, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const data = await readBody(req);

  const id = data.id;
  if (typeof id !== "string" || id.length === 0) {
    return NextResponse.json(NOT_FOUND, { status: 404 });
  }

  if (data.status !== undefined && !isStatus(data.status)) {
    return badRequest(
      "अमान्य स्थिति",
      "status must be one of saved, documents_ready, applied, under_review, approved, rejected",
    );
  }
  if (data.checklist !== undefined && !isStringArray(data.checklist)) {
    return badRequest("चेकलिस्ट सिर्फ़ टेक्स्ट की सूची हो सकती है", "checklist must be an array of strings");
  }

  try {
    const db = getDb();
    const existingRes = await db.execute({
      sql: "SELECT * FROM applications WHERE id = ?",
      args: [id],
    });
    const existing = existingRes.rows[0] as unknown as ApplicationRow | undefined;
    if (!existing) {
      return NextResponse.json(NOT_FOUND, { status: 404 });
    }

    const newStatus: string = isStatus(data.status) ? data.status : existing.status;
    const newChecklist: string =
      data.checklist !== undefined ? JSON.stringify(data.checklist) : existing.checklist_json;

    // Reminder is set when the application moves into documents_ready; otherwise it is kept.
    const becameDocumentsReady = newStatus === "documents_ready" && existing.status !== "documents_ready";
    const nextReminder = becameDocumentsReady ? dateAfterDays(3) : existing.next_reminder_date;

    const now = new Date().toISOString();
    await db.execute({
      sql: `UPDATE applications
            SET status = ?, checklist_json = ?, updated_at = ?, next_reminder_date = ?
            WHERE id = ?`,
      args: [newStatus, newChecklist, now, nextReminder, id],
    });

    const rowRes = await db.execute({
      sql: "SELECT * FROM applications WHERE id = ?",
      args: [id],
    });
    const row = rowRes.rows[0] as unknown as ApplicationRow;
    return NextResponse.json({ application: toApplication(row) });
  } catch {
    return NextResponse.json(SERVER_ERROR, { status: 500 });
  }
}
