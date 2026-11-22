import { NextResponse } from "next/server";
import { extractProfile } from "@/lib/extract";

export const runtime = "nodejs";

const MAX_TEXT = 1000;

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

  const { text, lang } = body as { text?: unknown; lang?: unknown };
  if (typeof text !== "string" || text.length > MAX_TEXT) {
    return NextResponse.json(
      { error: `text must be a string of at most ${MAX_TEXT} characters` },
      { status: 400 },
    );
  }

  const language: "hi" | "en" = lang === "hi" ? "hi" : "en";
  const result = await extractProfile(text, language);
  return NextResponse.json(result);
}
