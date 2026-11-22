import type { Profile, Rule, Scheme } from "./types";
import { evaluateRule } from "./rules";

export type SchemeStatus = "LIKELY_ELIGIBLE" | "NEED_MORE_INFO" | "NOT_ELIGIBLE";

export interface RuleResult {
  rule: Rule;
  result: "met" | "not_met" | "unknown";
}

export interface SchemeMatch {
  scheme: Scheme;
  status: SchemeStatus;
  rule_results: RuleResult[];
  reason_rules: string[];
  missing_fields: string[];
}

const STATUS_ORDER: Record<SchemeStatus, number> = {
  LIKELY_ELIGIBLE: 0,
  NEED_MORE_INFO: 1,
  NOT_ELIGIBLE: 2,
};

export function evaluateScheme(scheme: Scheme, profile: Profile): SchemeMatch {
  const rule_results: RuleResult[] = scheme.rules.map((rule) => ({
    rule,
    result: evaluateRule(rule, profile),
  }));

  let status: SchemeStatus;
  if (rule_results.some((r) => r.result === "not_met")) status = "NOT_ELIGIBLE";
  else if (rule_results.some((r) => r.result === "unknown")) status = "NEED_MORE_INFO";
  else status = "LIKELY_ELIGIBLE";

  const reason_rules = rule_results
    .filter((r) => r.result === "not_met")
    .map((r) => r.rule.label_en);
  const missing_fields = [
    ...new Set(rule_results.filter((r) => r.result === "unknown").map((r) => r.rule.field)),
  ];

  return { scheme, status, rule_results, reason_rules, missing_fields };
}

// Schemes with no rules cannot be evaluated, so they are never shown as results.
export function unevaluatedSchemes(schemes: Scheme[]): string[] {
  return schemes.filter((s) => s.rules.length === 0).map((s) => s.id);
}

export function matchSchemes(profile: Profile, schemes: Scheme[]): SchemeMatch[] {
  return schemes
    .filter((s) => s.active && s.rules.length > 0)
    .map((s) => evaluateScheme(s, profile))
    .sort((a, b) => {
      const byStatus = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
      if (byStatus !== 0) return byStatus;

      // Benefit desc, null last.
      const ea = a.scheme.benefit_monthly_estimate;
      const eb = b.scheme.benefit_monthly_estimate;
      if (ea !== eb) {
        if (ea == null) return 1;
        if (eb == null) return -1;
        return eb - ea;
      }

      return a.scheme.documents.length - b.scheme.documents.length;
    });
}

// Field that blocks the most NEED_MORE_INFO schemes; first-seen wins ties.
// Ignores fields that are already in `asked` so questions are never repeated.
export function nextQuestionField(
  matches: SchemeMatch[],
  asked?: Iterable<string>
): string | null {
  const askedSet = new Set(asked ?? []);
  const counts = new Map<string, number>();
  for (const m of matches) {
    if (m.status !== "NEED_MORE_INFO") continue;
    for (const field of m.missing_fields) {
      if (askedSet.has(field)) continue;
      counts.set(field, (counts.get(field) ?? 0) + 1);
    }
  }
  let best: string | null = null;
  let bestCount = 0;
  for (const [field, count] of counts) {
    if (count > bestCount) {
      best = field;
      bestCount = count;
    }
  }
  return best;
}

// All missing fields across NEED_MORE_INFO schemes that have not been asked yet,
// sorted by how many schemes they unblock.
export function askableMissingFields(
  matches: SchemeMatch[],
  asked?: Iterable<string>
): string[] {
  const askedSet = new Set(asked ?? []);
  const counts = new Map<string, number>();
  for (const m of matches) {
    if (m.status !== "NEED_MORE_INFO") continue;
    for (const field of m.missing_fields) {
      if (askedSet.has(field)) continue;
      counts.set(field, (counts.get(field) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([f]) => f);
}
