export type Gender = "F" | "M" | "Other";
export type MaritalStatus = "single" | "married" | "widow" | "divorced" | "separated";
export type Occupation = "farmer" | "labour" | "other";

export interface Profile {
  age: number | null;
  gender: Gender | null;
  marital: MaritalStatus | null;
  state: string | null;
  district: string | null;
  annual_family_income: number | null;
  land_bigha: number | null;
  occupation: Occupation | null;
  children_count: number | null;
  disability: boolean | null;
}

export type Rule = {
  field: string;
  op: "==" | "!=" | "<" | "<=" | ">" | ">=" | "in" | "not_in";
  value: unknown;
  label_en: string;
  label_hi: string;
  note?: string;
};

export type RuleOutcome = "met" | "not_met" | "unknown";

export interface RuleResult {
  rule: Rule;
  result: RuleOutcome;
}

export type SchemeStatus = "LIKELY_ELIGIBLE" | "NEED_MORE_INFO" | "NOT_ELIGIBLE";

export interface Scheme {
  id: string;
  name_en: string;
  name_hi: string;
  category: string;
  state: string;
  level: "state" | "central";
  benefit_text: string;
  benefit_monthly_estimate: number | null;
  rules: Rule[];
  documents: { name: string; tip: string }[];
  apply_steps: string[];
  official_url: string;
  last_verified: string;
  fee: string;
  active: boolean;
  note?: string;
}

export interface SchemeMatch {
  scheme: Scheme;
  status: SchemeStatus;
  rule_results: RuleResult[];
  reason_rules: string[];
  missing_fields: string[];
}
