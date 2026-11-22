import { getDb } from "@/lib/db";
import { jsonResponse } from "@/lib/api-response";
import { repairMojibake } from "@/lib/encoding";
import { matchSchemes, nextQuestionField } from "@/lib/engine";
import type { Gender, Marital, Occupation, Profile, Scheme } from "@/lib/types";

export const runtime = "nodejs"; // node:sqlite needs the Node runtime

const GENDERS: Gender[] = ["F", "M", "Other"];
const MARITALS: Marital[] = ["single", "married", "widow", "divorced", "separated"];
const OCCUPATIONS: Occupation[] = ["farmer", "labour", "unemployed", "student", "other"];

const KEYS = [
  "age", "gender", "marital", "state", "district", "annual_family_income",
  "land_bigha", "occupation", "disability", "children_count", "is_bpl",
] as const;

const BAD = { error_hi: "प्रोफ़ाइल की जानकारी सही नहीं है", error_en: "Profile data is invalid" };

const isNullish = (v: unknown) => v === null || v === undefined;

// Keeps only known keys; returns null if any known value has the wrong type.
function sanitizeProfile(input: unknown): Profile | null {
  if (typeof input !== "object" || input === null || Array.isArray(input)) return null;
  const src = input as Record<string, unknown>;
  const out: Record<string, unknown> = {};

  for (const key of KEYS) {
    const v = src[key];
    if (isNullish(v)) {
      out[key] = null;
      continue;
    }
    switch (key) {
      case "age":
        if (typeof v !== "number" || !Number.isInteger(v) || v < 1 || v > 120) return null;
        out[key] = v;
        break;
      case "annual_family_income":
      case "land_bigha":
        if (typeof v !== "number" || !Number.isFinite(v) || v < 0) return null;
        out[key] = v;
        break;
      case "children_count":
        if (typeof v !== "number" || !Number.isInteger(v) || v < 0) return null;
        out[key] = v;
        break;
      case "disability":
      case "is_bpl":
        if (typeof v !== "boolean") return null;
        out[key] = v;
        break;
      case "gender":
        if (!GENDERS.includes(v as Gender)) return null;
        out[key] = v;
        break;
      case "marital":
        if (!MARITALS.includes(v as Marital)) return null;
        out[key] = v;
        break;
      case "occupation":
        if (!OCCUPATIONS.includes(v as Occupation)) return null;
        out[key] = v;
        break;
      case "state":
      case "district":
        if (typeof v !== "string" || v.length > 100) return null;
        out[key] = v.trim() || null;
        break;
    }
  }
  return out as unknown as Profile;
}

export async function POST(req: Request) {
  try {
    let body: unknown = null;
    try {
      body = await req.json();
    } catch {
      body = null;
    }
    const profile = sanitizeProfile((body as { profile?: unknown } | null)?.profile);
    if (!profile) return jsonResponse(BAD, { status: 400 });

    const db = getDb();
    const result = await db.execute("SELECT json FROM schemes");
    const schemes = result.rows.map((r) => repairMojibake(JSON.parse(r.json as string) as Scheme));

    const askedFields = Array.isArray((body as { asked_fields?: unknown })?.asked_fields)
      ? ((body as { asked_fields: string[] }).asked_fields)
      : [];
    const matches = matchSchemes(profile, schemes);
    return jsonResponse({
      matches,
      next_question_field: nextQuestionField(matches, askedFields),
    });
  } catch {
    return jsonResponse(
      { error_hi: "कुछ गड़बड़ हुई, दोबारा कोशिश करें", error_en: "Something went wrong, please try again" },
      { status: 500 },
    );
  }
}
