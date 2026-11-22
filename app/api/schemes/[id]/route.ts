import { NextResponse } from "next/server";
import { loadSchemes } from "@/lib/schemes-store";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const scheme = loadSchemes().find((s) => s.id === params.id);
  if (!scheme) {
    return NextResponse.json({ error: "Scheme not found" }, { status: 404 });
  }
  return NextResponse.json(scheme);
}
