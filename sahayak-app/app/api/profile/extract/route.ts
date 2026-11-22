import { jsonResponse } from "@/lib/api-response";
import { extractProfile } from "../../../../lib/extract";

export const maxDuration = 30;

const WINDOW_MS = 60_000;
const LIMIT = 20;
const hits = new Map<string, number[]>();

// In-memory per-IP sliding window (resets on server restart; fine for a demo).
function allowed(ip: string): boolean {
  const now = Date.now();
  if (hits.size > 10_000) hits.clear();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= LIMIT) {
    hits.set(ip, recent);
    return false;
  }
  recent.push(now);
  hits.set(ip, recent);
  return true;
}

export async function POST(req: Request) {
  try {
    const xff = req.headers.get("x-forwarded-for");
    const ip = xff?.split(",")[0]?.trim() || "local";
    if (!allowed(ip)) {
      return jsonResponse(
        { error_hi: "बहुत ज़्यादा कोशिश हो गई, एक मिनट बाद दोबारा करें", error_en: "Too many requests, try again in a minute" },
        { status: 429 },
      );
    }

    let body: unknown = null;
    try {
      body = await req.json();
    } catch {
      body = null;
    }
    const text = (body as { text?: unknown } | null)?.text;
    if (typeof text !== "string" || text.length < 1 || text.length > 1000) {
      return jsonResponse(
        { error_hi: "कृपया 1 से 1000 अक्षर में लिखें", error_en: "Please enter 1 to 1000 characters" },
        { status: 400 },
      );
    }
    const lang = (body as { lang?: unknown }).lang === "en" ? "en" : "hi";

    const result = await extractProfile(text, lang);
    return jsonResponse(result);
  } catch {
    return jsonResponse(
      { error_hi: "कुछ गड़बड़ हुई, दोबारा कोशिश करें", error_en: "Something went wrong, please try again" },
      { status: 500 },
    );
  }
}
