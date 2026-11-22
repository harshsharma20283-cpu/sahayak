import type { Profile } from "./types";
import { callJson } from "./llm";
import { fallbackParse } from "./fallback-parser";

const ALLOWED_KEYS = [
  "age",
  "gender",
  "marital",
  "state",
  "district",
  "annual_family_income",
  "land_bigha",
  "occupation",
  "disability",
  "children_count",
] as const;

type ExtractKey = (typeof ALLOWED_KEYS)[number];
type Extracted = Pick<Profile, ExtractKey>;

const GENDERS = ["F", "M", "Other"];
const MARITALS = ["single", "married", "widow", "divorced", "separated"];
const OCCUPATIONS = ["farmer", "labour", "unemployed", "student", "other"];

const SYSTEM_PROMPT = `You extract household facts from a short Hindi/English/Hinglish sentence.
Return ONLY a JSON object with exactly these keys:
age, gender, marital, state, district, annual_family_income, land_bigha, occupation, disability, children_count.
Use null for any value that is not stated. Never guess.
Rules:
- gender: "F" or "M" or "Other". Infer gender ONLY from explicit relationship or grammatical words in the text (beti/daughter/mother/maa/wife/patni/bahu/dadi/nani/vidhwa => F; beta/son/father/pita/husband/pati/dada => M). Otherwise null. Never guess.
- marital: one of single, married, widow, divorced, separated.
- vidhwa / विधवा / पति नहीं रहे -> marital "widow" and gender "F".
- बीघा amount -> land_bigha (number). भूमिहीन -> land_bigha 0.
- occupation: one of farmer, labour, unemployed, student, other. Map "padhai karti/karta hai", "student", "school/college mein" to occupation "student". Still return null for anything not stated.
- disability: true or null. children_count: integer.
- annual_family_income: number in rupees, only if an income amount is stated.
- Never output name, Aadhaar number, phone number, or address.
Output JSON only, no prose.`;

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const isNullOr = (v: unknown, ok: (x: unknown) => boolean): boolean =>
  v === null || ok(v);

const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

function validValue(key: ExtractKey, v: unknown): boolean {
  switch (key) {
    case "age":
      return isNullOr(v, (x) => isNum(x) && Number.isInteger(x) && x >= 1 && x <= 120);
    case "gender":
      return isNullOr(v, (x) => typeof x === "string" && GENDERS.includes(x));
    case "marital":
      return isNullOr(v, (x) => typeof x === "string" && MARITALS.includes(x));
    case "occupation":
      return isNullOr(v, (x) => typeof x === "string" && OCCUPATIONS.includes(x));
    case "state":
    case "district":
      return isNullOr(v, (x) => typeof x === "string" && x.length <= 100);
    case "annual_family_income":
    case "land_bigha":
      return isNullOr(v, (x) => isNum(x) && x >= 0);
    case "disability":
      return isNullOr(v, (x) => typeof x === "boolean");
    case "children_count":
      return isNullOr(v, (x) => isNum(x) && Number.isInteger(x) && x >= 0);
  }
}

function isExtraction(x: unknown): boolean {
  if (!isObject(x)) return false;
  return Object.entries(x).every(
    ([k, v]) =>
      (ALLOWED_KEYS as readonly string[]).includes(k) &&
      validValue(k as ExtractKey, v),
  );
}

function keepAllowed(src: Record<string, unknown>): Partial<Extracted> {
  const out: Record<string, unknown> = {};
  for (const key of ALLOWED_KEYS) {
    if (key in src) out[key] = src[key];
  }
  return out as Partial<Extracted>;
}

export async function extractProfile(
  text: string,
  lang: "hi" | "en",
): Promise<{ profile: Partial<Profile>; missing_fields: string[]; source: "llm" | "fallback" }> {
  // lang is accepted for the API contract; the extraction itself is language-agnostic.
  void lang;

  const llm = await callJson(SYSTEM_PROMPT, text, isExtraction);
  const source: "llm" | "fallback" = llm && isObject(llm) ? "llm" : "fallback";
  const profile: Partial<Profile> =
    source === "llm" ? keepAllowed(llm as Record<string, unknown>) : fallbackParse(text);

  const missing_fields = ALLOWED_KEYS.filter((k) => profile[k] === null || profile[k] === undefined);

  return { profile, missing_fields, source };
}
