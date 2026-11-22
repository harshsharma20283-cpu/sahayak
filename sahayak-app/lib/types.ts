export type Gender = "F" | "M" | "Other";

export type Marital = "single" | "married" | "widow" | "divorced" | "separated";

export type Occupation = "farmer" | "labour" | "unemployed" | "student" | "other";

export interface Profile {
  age: number | null;
  gender: Gender | null;
  marital: Marital | null;
  state: string | null;
  district: string | null;
  annual_family_income: number | null;
  land_bigha: number | null;
  occupation: Occupation | null;
  disability: boolean | null;
  children_count: number | null;
  is_bpl: boolean | null;
}

export type Benefit = "cash_monthly" | "one_time" | "cover_insurance" | "in_kind";

export interface Document {
  name_en: string;
  name_hi: string;
  tip_en: string;
  tip_hi: string;
}

export interface Step {
  en: string;
  hi: string;
}

export interface Source {
  name: string;
  url: string;
  amount_shown: string | null;
}

export type RuleOp = "==" | "!=" | "<" | "<=" | ">" | ">=" | "in" | "not_in";

export interface Rule {
  field: string;
  op: RuleOp;
  value: unknown;
  label_en: string;
  label_hi: string;
}

export interface Scheme {
  id: string;
  name_en: string;
  name_hi: string;
  category: string;
  level: "state" | "central";
  state: string;
  benefit_type: Benefit;
  benefit_monthly_estimate: number | null;
  benefit_text_en: string;
  benefit_text_hi: string;
  rules: Rule[];
  documents: Document[];
  apply_steps: Step[];
  official_url: string;
  last_verified: string | null;
  verification_status: "verified" | "needs_verification";
  sources: Source[];
  fee: string;
  active: boolean;
}
