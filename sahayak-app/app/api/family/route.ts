import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { randomUUID } from "node:crypto";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("session_id") || "default_session";
  try {
    const db = await getDb();
    const result = await db.execute({
      sql: "SELECT id, session_id, relation, display_name, profile_json, created_at, updated_at FROM family_members WHERE session_id = ? ORDER BY created_at ASC",
      args: [sessionId],
    });

    const members = result.rows.map((row) => ({
      id: String(row.id),
      session_id: String(row.session_id),
      relation: String(row.relation),
      display_name: String(row.display_name),
      profile: JSON.parse(String(row.profile_json)),
      created_at: String(row.created_at),
      updated_at: String(row.updated_at),
    }));

    return NextResponse.json({ ok: true, members });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { session_id, relation, display_name, profile } = body;
    if (!relation || !display_name || !profile) {
      return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400 });
    }

    const sessionId = session_id || "default_session";
    const id = body.id || randomUUID();
    const now = new Date().toISOString();

    const db = await getDb();
    await db.execute({
      sql: `INSERT INTO family_members (id, session_id, relation, display_name, profile_json, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              relation = excluded.relation,
              display_name = excluded.display_name,
              profile_json = excluded.profile_json,
              updated_at = excluded.updated_at`,
      args: [id, sessionId, relation, display_name, JSON.stringify(profile), now, now],
    });

    return NextResponse.json({
      ok: true,
      member: {
        id,
        session_id: sessionId,
        relation,
        display_name,
        profile,
        created_at: now,
        updated_at: now,
      },
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 });
  }

  try {
    const db = await getDb();
    await db.execute({
      sql: "DELETE FROM family_members WHERE id = ?",
      args: [id],
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
