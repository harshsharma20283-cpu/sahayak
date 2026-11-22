import type {
  Profile,
  Rule,
  RuleOutcome,
  RuleResult,
  Scheme,
  SchemeMatch,
  SchemeStatus,
} from "./types";

const STATUS_ORDER: Record<SchemeStatus, number> = {
  LIKELY_ELIGIBLE: 0,
  NEED_MORE_INFO: 1,
  NOT_ELIGIBLE: 2,
};

function compare(actual: unknown, op: Rule["op"], expected: unknown): boolean {
  switch (op) {
    case "==":
      return actual === expected;
    case "!=":
      return actual !== expected;
    case "<":
      return typeof actual === "number" && typeof expected === "number" && actual < expected;
    case "<=":
      return typeof actual === "number" && typeof expected === "number" && actual <= expected;
    case ">":
      return typeof actual === "number" && typeof expected === "number" && actual > expected;
    case ">=":
      return typeof actual === "number" && typeof expected === "number" && actual >= expected;
    case "in":
      return Array.isArray(expected) && expected.includes(actual);
    case "not_in":
      return Array.isArray(expected) && !expected.includes(actual);
    default:
      return false;
  }
}

export function evaluateRule(rule: Rule, profile: Profile): RuleOutcome {
  const actual = profile[rule.field as keyof Profile];
  if (actual === null || actual === undefined) return "unknown";
  return compare(actual, rule.op, rule.value) ? "met" : "not_met";
}

export function evaluateScheme(scheme: Scheme, profile: Profile): SchemeMatch {
  const rule_results: RuleResult[] = scheme.rules.map((rule) => ({
    rule,
    result: evaluateRule(rule, profile),
  }));

  const notMet = rule_results.filter((r) => r.result === "not_met");
  const unknown = rule_results.filter((r) => r.result === "unknown");

  let status: SchemeStatus;
  let reason_rules: string[] = [];
  let missing_fields: string[] = [];

  if (notMet.length > 0) {
    status = "NOT_ELIGIBLE";
    reason_rules = notMet.map((r) => r.rule.label_en);
  } else if (unknown.length > 0) {
    status = "NEED_MORE_INFO";
    missing_fields = Array.from(new Set(unknown.map((r) => r.rule.field)));
  } else {
    status = "LIKELY_ELIGIBLE";
  }

  return { scheme, status, rule_results, reason_rules, missing_fields };
}

export function matchSchemes(profile: Profile, schemes: Scheme[]): SchemeMatch[] {
  return schemes
    .filter((s) => s.active === true)
    .map((s) => evaluateScheme(s, profile))
    .sort((a, b) => {
      const byStatus = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
      if (byStatus !== 0) return byStatus;

      const ea = a.scheme.benefit_monthly_estimate;
      const eb = b.scheme.benefit_monthly_estimate;
      if (ea !== eb) {
        if (ea === null) return 1;
        if (eb === null) return -1;
        return eb - ea;
      }

      return a.scheme.apply_steps.length - b.scheme.apply_steps.length;
    });
}
