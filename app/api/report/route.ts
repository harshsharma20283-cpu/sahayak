import { NextResponse } from "next/server";
import { loadSchemes } from "@/lib/schemes-store";
import { addReport } from "@/lib/store-db";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const scheme_id = typeof body.scheme_id === "string" ? body.scheme_id : "";
  if (!scheme_id || !loadSchemes().some((s) => s.id === scheme_id)) {
    return NextResponse.json({ error: "unknown scheme_id" }, { status: 400 });
  }

  const district = typeof body.district === "string" ? body.district : null;
  const note = typeof body.note === "string" ? body.note : null;
  addReport(scheme_id, district, note);

  return NextResponse.json({ ok: true });
}
