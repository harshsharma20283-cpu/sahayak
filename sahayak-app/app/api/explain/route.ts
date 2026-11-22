import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { callJson } from "@/lib/llm";
import type { Rule, Scheme } from "@/lib/types";

export const runtime = "nodejs"; // node:sqlite needs the Node runtime
export const maxDuration = 30;

const WINDOW_MS = 60_000;
const LIMIT = 20;
const hits = new Map<string, number[]>();

// In-memory per-IP sliding window (same approach as the extract route).
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

type Outcome = "met" | "not_met" | "unknown";
type Status = "LIKELY_ELIGIBLE" | "NEED_MORE_INFO" | "NOT_ELIGIBLE";
type Lang = "hi" | "en";

interface ClientResult {
  field: string;
  op: string;
  value: unknown;
  result: Outcome;
}

interface Input {
  scheme_id: string;
  lang: Lang;
  results: ClientResult[];
}

const OUTCOMES = new Set<string>(["met", "not_met", "unknown"]);
const BAD = { error_hi: "जानकारी सही नहीं है", error_en: "Request data is invalid" };

function isObj(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

function parseInput(body: unknown): Input | null {
  if (!isObj(body)) return null;
  const { scheme_id, rule_results, lang } = body;
  if (typeof scheme_id !== "string" || scheme_id.length < 1 || scheme_id.length > 100) return null;
  if (lang !== undefined && lang !== "hi" && lang !== "en") return null;
  if (!Array.isArray(rule_results) || rule_results.length > 50) return null;

  const results: ClientResult[] = [];
  for (const item of rule_results) {
    if (!isObj(item) || !isObj(item.rule)) return null;
    const rule = item.rule;
    if (typeof rule.field !== "string" || typeof rule.op !== "string") return null;
    if (typeof item.result !== "string" || !OUTCOMES.has(item.result)) return null;
    results.push({
      field: rule.field,
      op: rule.op,
      value: rule.value,
      result: item.result as Outcome,
    });
  }
  return { scheme_id, lang: lang === "en" ? "en" : "hi", results };
}

// Labels always come from the stored scheme. The client only supplies outcomes,
// matched to stored rules by field, operator and value.
function outcomesForRules(rules: Rule[], results: ClientResult[]) {
  return rules.map((rule) => {
    const key = `${rule.field}|${rule.op}|${JSON.stringify(rule.value)}`;
    const match = results.find((r) => `${r.field}|${r.op}|${JSON.stringify(r.value)}` === key);
    return { rule, result: match ? match.result : ("unknown" as Outcome) };
  });
}

function statusFrom(outcomes: { result: Outcome }[]): Status {
  if (outcomes.some((o) => o.result === "not_met")) return "NOT_ELIGIBLE";
  if (outcomes.some((o) => o.result === "unknown")) return "NEED_MORE_INFO";
  return "LIKELY_ELIGIBLE";
}

function joinList(items: string[], fallback: string): string {
  return items.length === 0 ? fallback : items.join(", ");
}

// Template explanation: three short sentences built only from stored labels.
function templateText(
  scheme: Scheme,
  status: Status,
  outcomes: { rule: Rule; result: Outcome }[],
  lang: Lang,
): string {
  const labelOf = (o: { rule: Rule }) => (lang === "hi" ? o.rule.label_hi : o.rule.label_en);
  const met = outcomes.filter((o) => o.result === "met").map(labelOf);
  const unknown = outcomes.filter((o) => o.result === "unknown").map(labelOf);
  const notMet = outcomes.filter((o) => o.result === "not_met").map(labelOf);

  if (lang === "hi") {
    if (status === "LIKELY_ELIGIBLE") {
      return [
        `${scheme.name_hi} के लिए आप संभावित रूप से पात्र दिखते हैं।`,
        `आपकी जानकारी में ये शर्तें मेल खाती हैं: ${joinList(met, "कोई शर्त नहीं")}।`,
        "अंतिम पात्रता आधिकारिक पोर्टल पर जाँचें।",
      ].join(" ");
    }
    if (status === "NEED_MORE_INFO") {
      return [
        `${scheme.name_hi} के लिए एक और जानकारी चाहिए।`,
        `ज़रूरी जानकारी: ${joinList(unknown, "अतिरिक्त जानकारी")}।`,
        "जानकारी देने के बाद नतीजा बदल सकता है।",
      ].join(" ");
    }
    return [
      `${scheme.name_hi} के लिए अभी आप पात्र नहीं दिखते।`,
      `यह शर्त पूरी नहीं होती: ${joinList(notMet, "एक शर्त")}।`,
      "अगर आपकी जानकारी गलत है तो आधिकारिक पोर्टल पर जाँचें।",
    ].join(" ");
  }

  if (status === "LIKELY_ELIGIBLE") {
    return [
      `You are likely eligible for ${scheme.name_en}.`,
      `These conditions match your details: ${joinList(met, "none")}.`,
      "Confirm the final eligibility on the official portal.",
    ].join(" ");
  }
  if (status === "NEED_MORE_INFO") {
    return [
      `${scheme.name_en} needs one more detail.`,
      `Needed: ${joinList(unknown, "more information")}.`,
      "The result may change after you add this detail.",
    ].join(" ");
  }
  return [
    `You do not look eligible for ${scheme.name_en} right now.`,
    `This condition is not met: ${joinList(notMet, "one condition")}.`,
    "If your details are wrong, check the official portal.",
  ].join(" ");
}

const SYSTEM_PROMPT = [
  "You explain a government scheme eligibility result to a citizen.",
  "Use a grade-5 reading level. Write 3 to 4 short sentences in the language named in the input field lang: 'hi' means Hindi in Devanagari, 'en' means English.",
  "Use only the scheme name and the conditions given in the input. Never invent rules, amounts, dates or documents.",
  "Never say guaranteed, certain or sure.",
  "If status is LIKELY_ELIGIBLE, include the phrase 'संभावित रूप से पात्र' in Hindi or 'likely eligible' in English.",
  'Reply only with JSON in this form: {"text": "..."}',
].join(" ");

const BANNED = /guarantee|पक्क|pakka|\bsure\b|\bcertain\b/i;

function passesCheck(value: unknown, status: Status, lang: Lang): boolean {
  if (!isObj(value) || typeof value.text !== "string") return false;
  const text = value.text;
  if (text.length < 20 || text.length > 700) return false;
  if (BANNED.test(text)) return false;
  if (status === "LIKELY_ELIGIBLE") {
    return lang === "hi" ? text.includes("संभावित रूप से पात्र") : /likely eligible/i.test(text);
  }
  return true;
}

export async function POST(req: Request) {
  try {
    const xff = req.headers.get("x-forwarded-for");
    const ip = xff?.split(",")[0]?.trim() || "local";
    if (!allowed(ip)) {
      return NextResponse.json(
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
    if (isObj(body) && (!Array.isArray(body.rule_results) || body.rule_results.length === 0)) {
      return NextResponse.json(
        { error_hi: "नियम जानकारी चाहिए", error_en: "Rule results are required" },
        { status: 400 },
      );
    }
    const input = parseInput(body);
    if (!input) return NextResponse.json(BAD, { status: 400 });

    const db = getDb();
    const result = await db.execute({
      sql: "SELECT json FROM schemes WHERE id = ?",
      args: [input.scheme_id],
    });
    const row = result.rows[0] as { json: string } | undefined;
    if (!row) {
      return NextResponse.json({ error_hi: "योजना नहीं मिली", error_en: "Scheme not found" }, { status: 404 });
    }
    const scheme = JSON.parse(row.json as string) as Scheme;

    const outcomes = outcomesForRules(scheme.rules, input.results);
    const status = statusFrom(outcomes);
    let text = templateText(scheme, status, outcomes, input.lang);

    if (process.env.LLM_API_KEY) {
      const summary = (want: Outcome) =>
        outcomes
          .filter((o) => o.result === want)
          .map((o) => ({ en: o.rule.label_en, hi: o.rule.label_hi }));
      const userText = JSON.stringify({
        lang: input.lang,
        status,
        scheme_name_en: scheme.name_en,
        scheme_name_hi: scheme.name_hi,
        met: summary("met"),
        unknown: summary("unknown"),
        not_met: summary("not_met"),
      });
      const llm = await callJson(SYSTEM_PROMPT, userText, (x) => passesCheck(x, status, input.lang));
      if (isObj(llm) && typeof llm.text === "string") text = llm.text;
    }

    return NextResponse.json({ text });
  } catch {
    return NextResponse.json(
      { error_hi: "कुछ गड़बड़ हुई, दोबारा कोशिश करें", error_en: "Something went wrong, please try again" },
      { status: 500 },
    );
  }
}
