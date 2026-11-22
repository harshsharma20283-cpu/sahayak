import { NextResponse } from "next/server";
import { matchSchemes } from "@/lib/eligibility";
import { loadSchemes } from "@/lib/schemes-store";
import type { Profile } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Body must be an object" }, { status: 400 });
  }

  const raw = (body as { profile?: unknown }).profile;
  const profile = (raw !== null && typeof raw === "object" && !Array.isArray(raw) ? raw : {}) as Profile;

  return NextResponse.json({ matches: matchSchemes(profile, loadSchemes()) });
}
