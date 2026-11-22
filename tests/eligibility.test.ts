import { describe, it, expect } from "vitest";
import schemes from "../seed/schemes.json";
import personas from "../seed/personas.json";
import { matchSchemes, evaluateScheme, evaluateRule } from "../lib/eligibility";
import type { Profile, Rule, Scheme, SchemeStatus } from "../lib/types";

const schemeList = schemes as unknown as Scheme[];
const personaList = personas as unknown as {
  id: string;
  label: string;
  profile: Profile;
  expected: Record<string, SchemeStatus>;
}[];

const blank: Profile = {
  age: null,
  gender: null,
  marital: null,
  state: null,
  district: null,
  annual_family_income: null,
  land_bigha: null,
  occupation: null,
  children_count: null,
  disability: null,
};

function makeRule(overrides: Partial<Rule>): Rule {
  return {
    field: "age",
    op: ">=",
    value: 60,
    label_en: "Age 60 or above",
    label_hi: "आयु 60 वर्ष या अधिक",
    ...overrides,
  };
}

function makeScheme(overrides: Partial<Scheme>): Scheme {
  return {
    id: "test_scheme",
    name_en: "Test scheme",
    name_hi: "परीक्षण योजना",
    category: "pension",
    state: "Rajasthan",
    level: "state",
    benefit_text: "Test",
    benefit_monthly_estimate: null,
    rules: [],
    documents: [],
    apply_steps: ["Visit e-Mitra", "It is FREE", "Keep the receipt number"],
    official_url: "https://ssp.rajasthan.gov.in",
    last_verified: "VERIFY",
    fee: "Free",
    active: true,
    ...overrides,
  };
}

describe("persona expectations from seed/personas.json", () => {
  for (const persona of personaList) {
    describe(`${persona.id} ${persona.label}`, () => {
      const matches = matchSchemes(persona.profile, schemeList);
      for (const [schemeId, status] of Object.entries(persona.expected)) {
        it(`${schemeId} is ${status}`, () => {
          const match = matches.find((m) => m.scheme.id === schemeId);
          expect(match?.status).toBe(status);
        });
      }
    });
  }
});

describe("null and unknown handling", () => {
  it("a null field gives unknown", () => {
    const rule = makeRule({ field: "age", op: ">=", value: 60 });
    expect(evaluateRule(rule, { ...blank, state: "Rajasthan" })).toBe("unknown");
  });

  it("a null field makes the status NEED_MORE_INFO, not LIKELY", () => {
    const widow = schemeList.find((s) => s.id === "widow_pension");
    expect(widow).toBeDefined();
    const profile: Profile = {
      ...blank,
      state: "Rajasthan",
      gender: "F",
      marital: "widow",
      annual_family_income: null,
    };
    const match = evaluateScheme(widow!, profile);
    expect(match.status).toBe("NEED_MORE_INFO");
    expect(match.missing_fields).toContain("annual_family_income");
  });

  it("not_met plus unknown in one scheme gives NOT_ELIGIBLE", () => {
    const scheme = makeScheme({
      rules: [
        makeRule({ field: "state", op: "==", value: "Rajasthan", label_en: "Resident of Rajasthan" }),
        makeRule({ field: "age", op: ">=", value: 60 }),
        makeRule({ field: "gender", op: "==", value: "F", label_en: "Woman applicant" }),
      ],
    });
    const profile: Profile = { ...blank, state: "Rajasthan", gender: "M" };
    const match = evaluateScheme(scheme, profile);
    expect(match.status).toBe("NOT_ELIGIBLE");
    expect(match.reason_rules).toEqual(["Woman applicant"]);
  });

  it("an inactive scheme is excluded", () => {
    const inactive = makeScheme({
      active: false,
      rules: [makeRule({ field: "state", op: "==", value: "Rajasthan", label_en: "Resident of Rajasthan" })],
    });
    const profile: Profile = { ...blank, state: "Rajasthan" };
    expect(matchSchemes(profile, [inactive])).toHaveLength(0);
  });

  it("the engine never returns LIKELY_ELIGIBLE when any rule is unknown", () => {
    for (const persona of personaList) {
      for (const scheme of schemeList) {
        const match = evaluateScheme(scheme, persona.profile);
        const hasUnknown = match.rule_results.some((r) => r.result === "unknown");
        if (hasUnknown) {
          expect(match.status).not.toBe("LIKELY_ELIGIBLE");
        }
      }
    }
  });
});
