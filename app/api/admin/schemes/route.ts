import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { loadSchemes, saveSchemes, validateScheme } from "@/lib/schemes-store";
import type { Scheme } from "@/lib/types";

export const dynamic = "force-dynamic";

const unauthorized = () => NextResponse.json({ error: "unauthorized" }, { status: 401 });

export async function GET(request: Request) {
  if (!isAdmin(request)) return unauthorized();
  return NextResponse.json({ schemes: loadSchemes() });
}

export async function POST(request: Request) {
  if (!isAdmin(request)) return unauthorized();

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const id = typeof body.id === "string" ? body.id : "";
  if (!id) {
    return NextResponse.json({ errors: ["id is required"] }, { status: 400 });
  }
  if (loadSchemes().some((s) => s.id === id)) {
    return NextResponse.json({ error: "scheme id already exists" }, { status: 409 });
  }

  const candidate = body as unknown as Scheme;
  const { ok, errors } = validateScheme(candidate);
  if (!ok) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  saveSchemes([...loadSchemes(), candidate]);
  return NextResponse.json({ scheme: candidate }, { status: 201 });
}

export async function PUT(request: Request) {
  if (!isAdmin(request)) return unauthorized();

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const id = typeof body.id === "string" ? body.id : "";
  if (!id) {
    return NextResponse.json({ errors: ["id is required"] }, { status: 400 });
  }

  const existing = loadSchemes().find((s) => s.id === id);
  if (!existing) {
    return NextResponse.json({ error: "scheme not found" }, { status: 404 });
  }

  const fields: Record<string, unknown> = { ...body };
  delete fields.id;
  const merged = { ...existing, ...fields } as Scheme;

  const { ok, errors } = validateScheme(merged);
  if (!ok) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  saveSchemes(loadSchemes().map((s) => (s.id === id ? merged : s)));
  return NextResponse.json({ scheme: merged });
}
