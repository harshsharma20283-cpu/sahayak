import { describe, expect, it } from "vitest";
import { explainFallback } from "../lib/explain";
import { fallbackExtract } from "../lib/extract";
import type { RuleResult, Scheme } from "../lib/types";

const scheme: Scheme = {
  id: "test-scheme",
  name_en: "Test Widow Pension",
  name_hi: "Test vidhwa pension",
  category: "pension",
  state: "Rajasthan",
  level: "state",
  benefit_text: "Sample benefit",
  benefit_monthly_estimate: null,
  rules: [],
  documents: [],
  apply_steps: [],
  official_url: "https://example.gov.in",
  last_verified: "2026-01-01",
  fee: "0",
  active: true,
};

const results: RuleResult[] = [
  {
    rule: { field: "marital", op: "==", value: "widow", label_en: "Marital status is widow", label_hi: "Vaivahik sthiti vidhwa hai" },
    result: "met",
  },
  {
    rule: { field: "age", op: ">=", value: 60, label_en: "Age is 60 or more", label_hi: "Umr 60 saal ya adhik hai" },
    result: "unknown",
  },
];

describe("explainFallback", () => {
  it("never says guaranteed or pakka and uses likely eligible (en)", () => {
    const text = explainFallback(scheme, results, "en");
    expect(text).not.toMatch(/guaranteed|pakka/i);
    expect(text).toContain("likely eligible");
    expect(text).toContain("Final decision is by the government department.");
  });

  it("never says guaranteed or pakka and uses shayad eligible (hi)", () => {
    const text = explainFallback(scheme, results, "hi");
    expect(text).not.toMatch(/guaranteed|pakka/i);
    expect(text).toContain("shayad eligible");
  });
});

describe("fallbackExtract", () => {
  it("extracts age, marital and land from Hindi-English text", () => {
    const p = fallbackExtract("Meri maa 62 saal ki hai, vidhwa hain, 2 bigha khet hai, Jaipur ke paas rehti hain");
    expect(p.age).toBe(62);
    expect(p.marital).toBe("widow");
    expect(p.land_bigha).toBe(2);
    expect(p.district).toBe("Jaipur");
    expect(p.gender).toBe("F");
  });

  it("leaves unknown fields null instead of guessing", () => {
    const p = fallbackExtract("kuch nahi pata");
    expect(p.age).toBeNull();
    expect(p.marital).toBeNull();
    expect(p.land_bigha).toBeNull();
  });
});
