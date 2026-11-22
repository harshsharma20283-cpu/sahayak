import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { listReports } from "@/lib/store-db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ reports: listReports() });
}
