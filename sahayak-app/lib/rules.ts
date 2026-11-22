import type { Profile, Rule } from "./types";

export type RuleResult = "met" | "not_met" | "unknown";

// Never guess: a missing profile value is always "unknown", never "not_met".
export function evaluateRule(rule: Rule, profile: Profile): RuleResult {
  const actual = (profile as unknown as Record<string, unknown>)[rule.field];
  if (actual === null || actual === undefined) return "unknown";
  const expected = rule.value;

  switch (rule.op) {
    case "==":
      return actual === expected ? "met" : "not_met";
    case "!=":
      return actual !== expected ? "met" : "not_met";
    case "<":
    case "<=":
    case ">":
    case ">=": {
      if (typeof actual !== "number" || typeof expected !== "number") return "unknown";
      const ok =
        rule.op === "<" ? actual < expected
        : rule.op === "<=" ? actual <= expected
        : rule.op === ">" ? actual > expected
        : actual >= expected;
      return ok ? "met" : "not_met";
    }
    case "in":
      if (!Array.isArray(expected)) return "unknown";
      return expected.includes(actual) ? "met" : "not_met";
    case "not_in":
      if (!Array.isArray(expected)) return "unknown";
      return expected.includes(actual) ? "not_met" : "met";
    default:
      return "unknown";
  }
}
