import { NextResponse } from "next/server";
import { loadSchemes } from "@/lib/schemes-store";
import {
  APPLICATION_STATUSES,
  addApplication,
  listApplications,
  updateApplicationStatus,
} from "@/lib/store-db";

export const dynamic = "force-dynamic";

const allowed: readonly string[] = APPLICATION_STATUSES;

function isStatus(value: unknown): value is string {
  return typeof value === "string" && allowed.includes(value);
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const scheme_id = typeof body.scheme_id === "string" ? body.scheme_id : "";
  if (!scheme_id || !loadSchemes().some((s) => s.id === scheme_id)) {
    return NextResponse.json({ error: "unknown scheme_id" }, { status: 400 });
  }

  const status = body.status === undefined ? "saved" : body.status;
  if (!isStatus(status)) {
    return NextResponse.json({ error: "invalid status", allowed }, { status: 400 });
  }

  const profile_id = typeof body.profile_id === "string" ? body.profile_id : null;
  const application = addApplication(scheme_id, profile_id, status);

  return NextResponse.json({ application }, { status: 201 });
}

export async function GET() {
  return NextResponse.json({ applications: listApplications() });
}

export async function PUT(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const id = typeof body.id === "string" ? body.id : "";
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  if (!isStatus(body.status)) {
    return NextResponse.json({ error: "invalid status", allowed }, { status: 400 });
  }

  const application = updateApplicationStatus(id, body.status);
  if (!application) {
    return NextResponse.json({ error: "application not found" }, { status: 404 });
  }

  return NextResponse.json({ application });
}
