import type { RuleResult, Scheme } from "./types";
import { callClaude } from "./extract";

const FINAL_LINE = "Final decision is by the government department.";
const FORBIDDEN = /guaranteed|pakka/i;

/** Deterministic 3-sentence explanation. Never claims certainty. */
export function explainFallback(scheme: Scheme, results: RuleResult[], lang: "hi" | "en"): string {
  const met = results.filter((r) => r.result === "met");
  const unknown = results.filter((r) => r.result === "unknown");

  if (lang === "hi") {
    const name = scheme.name_hi || scheme.name_en;
    const first = `Aap ki di gayi jaankari ke hisaab se aap ${name} ke liye shayad eligible hain.`;
    const metText =
      met.length > 0
        ? `Ye sharten poori hoti dikh rahi hain: ${met
            .slice(0, 3)
            .map((r) => r.rule.label_hi || r.rule.label_en)
            .join("; ")}.`
        : "Abhi kuch sharton ki pushti nahi hui hai.";
    const unknownText =
      unknown.length > 0
        ? `Kuch jaankari abhi baaki hai, jaise ${unknown
            .slice(0, 3)
            .map((r) => r.rule.label_hi || r.rule.label_en)
            .join("; ")}.`
        : "Aage ki prakriya ke liye official website dekhein.";
    return [first, metText, `${unknownText} ${FINAL_LINE}`].join(" ");
  }

  const first = `Based on the details you shared, you are likely eligible for ${scheme.name_en}.`;
  const metText =
    met.length > 0
      ? `These conditions appear to be met: ${met
          .slice(0, 3)
          .map((r) => r.rule.label_en)
          .join("; ")}.`
      : "None of the conditions are confirmed yet.";
  const unknownText =
    unknown.length > 0
      ? `Some details are still missing, such as ${unknown
          .slice(0, 3)
          .map((r) => r.rule.label_en)
          .join("; ")}.`
      : "Check the official website for the next steps.";
  return [first, metText, `${unknownText} ${FINAL_LINE}`].join(" ");
}

/** Claude-written explanation with deterministic fallback on any failure. */
export async function explain(scheme: Scheme, results: RuleResult[], lang: "hi" | "en"): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) return explainFallback(scheme, results, lang);

  const system = `You explain a government scheme match to a widow or senior citizen in Rajasthan.
Write 3 to 4 simple sentences at a grade-5 reading level, in ${lang === "hi" ? "Hindi (Devanagari or Roman Hindi)" : "English"}.
Use only the rules and facts provided. Do not add new rules, amounts or eligibility conditions.
Say "likely eligible" (English) or "shayad eligible" (Hindi) only. Never use the words "guaranteed" or "pakka".
End with the sentence: "${FINAL_LINE}"`;

  const user = JSON.stringify({
    scheme: {
      name_en: scheme.name_en,
      name_hi: scheme.name_hi,
      benefit_text: scheme.benefit_text,
      official_url: scheme.official_url,
    },
    rules: results.map((r) => ({
      label_en: r.rule.label_en,
      label_hi: r.rule.label_hi,
      result: r.result,
    })),
  });

  try {
    const text = await callClaude(system, user, 300);
    const clean = text?.trim() ?? "";
    if (clean.length === 0 || FORBIDDEN.test(clean)) return explainFallback(scheme, results, lang);
    return clean;
  } catch {
    return explainFallback(scheme, results, lang);
  }
}
