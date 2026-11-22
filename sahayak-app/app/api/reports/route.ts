import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { isAdmin } from "@/lib/auth";

export const runtime = "nodejs";

const NOTE_MAX_LENGTH = 300;

const UNAUTHORIZED = {
  error_hi: "लॉगिन ज़रूरी है",
  error_en: "Login required",
};

const SERVER_ERROR = {
  error_hi: "सर्वर में त्रुटि हुई, कृपया फिर से कोशिश करें",
  error_en: "Server error, please try again",
};

function cleanNote(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const cleaned = raw.trim().replace(/\d{10,}/g, "[removed]").slice(0, NOTE_MAX_LENGTH);
  return cleaned.length > 0 ? cleaned : null;
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = undefined;
  }

  const data = (typeof body === "object" && body !== null ? body : {}) as Record<string, unknown>;
  const schemeId = data.scheme_id;
  if (typeof schemeId !== "string" || schemeId.length === 0) {
    return NextResponse.json(
      { error_hi: "योजना चुनना ज़रूरी है", error_en: "scheme_id is required" },
      { status: 400 },
    );
  }

  try {
    const db = getDb();
    const schemeRes = await db.execute({
      sql: "SELECT id FROM schemes WHERE id = ?",
      args: [schemeId],
    });
    if (schemeRes.rows.length === 0) {
      return NextResponse.json(
        { error_hi: "योजना नहीं मिली", error_en: "Scheme not found" },
        { status: 400 },
      );
    }

    const district = typeof data.district === "string" ? data.district.trim() || null : null;
    const note = cleanNote(data.note);

    await db.execute({
      sql: "INSERT INTO reports (id, scheme_id, district, note, created_at) VALUES (?, ?, ?, ?, ?)",
      args: [randomUUID(), schemeId, district, note, new Date().toISOString()],
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(SERVER_ERROR, { status: 500 });
  }
}

export async function GET(req: Request) {
  if (!isAdmin(req)) return NextResponse.json(UNAUTHORIZED, { status: 401 });
  try {
    const db = getDb();
    const res = await db.execute(
      "SELECT id, scheme_id, district, note, created_at FROM reports ORDER BY created_at DESC",
    );
    return NextResponse.json({ reports: res.rows });
  } catch {
    return NextResponse.json(SERVER_ERROR, { status: 500 });
  }
}
