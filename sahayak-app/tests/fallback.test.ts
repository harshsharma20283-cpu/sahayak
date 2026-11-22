import { describe, it, expect } from "vitest";
import { fallbackParse } from "../lib/fallback-parser";

describe("fallbackParse", () => {
  it("no age or gender from a village sentence", () => {
    const r = fallbackParse("मैं गाँव में रहता हूँ");
    expect(r.age).toBeNull();
    expect(r.gender).toBeNull();
  });

  it("parses: 'i mother is 65 year old' -> age 65, gender F, everything else null", () => {
    const r = fallbackParse("i mother is 65 year old");
    expect(r.age).toBe(65);
    expect(r.gender).toBe("F");
    expect(r.marital).toBeNull();
    expect(r.state).toBeNull();
    expect(r.district).toBeNull();
    expect(r.annual_family_income).toBeNull();
    expect(r.land_bigha).toBeNull();
    expect(r.occupation).toBeNull();
    expect(r.disability).toBeNull();
    expect(r.children_count).toBeNull();
  });

  it("parses: 'meri maa 65 saal ki hai, vidhwa hain, Jaipur, 2 bigha khet, salana aay 35000'", () => {
    const r = fallbackParse(
      "meri maa 65 saal ki hai, vidhwa hain, Jaipur, 2 bigha khet, salana aay 35000"
    );
    expect(r.age).toBe(65);
    expect(r.gender).toBe("F");
    expect(r.marital).toBe("widow");
    expect(r.district).toBe("Jaipur");
    expect(r.land_bigha).toBe(2);
    expect(r.annual_family_income).toBe(35000);
  });

  it("parses: 'meri beti 25 saal ki hai, padhai karti hai, ghar ki aay 3 lakh' -> age 25, gender F, occupation student, income 300000", () => {
    const r = fallbackParse(
      "meri beti 25 saal ki hai, padhai karti hai, ghar ki aay 3 lakh"
    );
    expect(r.age).toBe(25);
    expect(r.gender).toBe("F");
    expect(r.occupation).toBe("student");
    expect(r.annual_family_income).toBe(300000);
    expect(r.marital).toBeNull();
    expect(r.state).toBeNull();
    expect(r.district).toBeNull();
    expect(r.land_bigha).toBeNull();
    expect(r.disability).toBeNull();
    expect(r.children_count).toBeNull();
  });

  it("maps student phrases to occupation student", () => {
    expect(fallbackParse("mera beta student hai").occupation).toBe("student");
    expect(fallbackParse("mera beta student hai").gender).toBe("M");
    expect(fallbackParse("school/college mein padhta hai").occupation).toBe("student");
    expect(fallbackParse("padhai karta hai").occupation).toBe("student");
  });

  it("parses: 'mera gram me rehta hu' -> all null", () => {
    const r = fallbackParse("mera gram me rehta hu");
    expect(r.age).toBeNull();
    expect(r.gender).toBeNull();
    expect(r.marital).toBeNull();
    expect(r.state).toBeNull();
    expect(r.district).toBeNull();
    expect(r.annual_family_income).toBeNull();
    expect(r.land_bigha).toBeNull();
    expect(r.occupation).toBeNull();
    expect(r.disability).toBeNull();
    expect(r.children_count).toBeNull();
  });

  it("parses all required age variations without guessing", () => {
    expect(fallbackParse("65 year old").age).toBe(65);
    expect(fallbackParse("65 years").age).toBe(65);
    expect(fallbackParse("65 yrs").age).toBe(65);
    expect(fallbackParse("age 65").age).toBe(65);
    expect(fallbackParse("65 saal").age).toBe(65);
    expect(fallbackParse("65 साल").age).toBe(65);
    expect(fallbackParse("उम्र 65").age).toBe(65);
    expect(fallbackParse("65 की उम्र").age).toBe(65);
  });

  it("parses income with lakh and hazar only near income words", () => {
    expect(fallbackParse("annual income 3 lakh").annual_family_income).toBe(300000);
    expect(fallbackParse("salana aay 35 hazar").annual_family_income).toBe(35000);
    expect(fallbackParse("कमाई 35,000").annual_family_income).toBe(35000);
    // Bare number without income word is NOT treated as income
    expect(fallbackParse("main 35000 number par phone kar raha hu").annual_family_income).toBeNull();
  });
});
