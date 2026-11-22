import { NextResponse } from "next/server";
import { explain } from "@/lib/explain";
import { loadSchemes } from "@/lib/schemes-store";
import type { RuleResult } from "@/lib/types";

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

  const { scheme_id, rule_results, lang } = body as {
    scheme_id?: unknown;
    rule_results?: unknown;
    lang?: unknown;
  };

  if (typeof scheme_id !== "string") {
    return NextResponse.json({ error: "scheme_id must be a string" }, { status: 400 });
  }

  const scheme = loadSchemes().find((s) => s.id === scheme_id);
  if (!scheme) {
    return NextResponse.json({ error: "Scheme not found" }, { status: 404 });
  }

  const results = Array.isArray(rule_results) ? (rule_results as RuleResult[]) : [];
  const language: "hi" | "en" = lang === "hi" ? "hi" : "en";
  const text = await explain(scheme, results, language);
  return NextResponse.json({ text });
}
