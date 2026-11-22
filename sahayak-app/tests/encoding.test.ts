import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { getDb } from "../lib/db";
import { matchSchemes } from "../lib/engine";
import { hasMojibake, repairMojibakeString, repairMojibake } from "../lib/encoding";
import { translate } from "../lib/i18n";
import type { Profile, Scheme } from "../lib/types";

function collectStrings(val: unknown): string[] {
  const acc: string[] = [];
  function walk(x: unknown) {
    if (typeof x === "string") {
      acc.push(x);
    } else if (Array.isArray(x)) {
      for (const item of x) walk(item);
    } else if (typeof x === "object" && x !== null) {
      for (const v of Object.values(x)) walk(v);
    }
  }
  walk(val);
  return acc;
}

describe("Text Encoding & Mojibake Prevention", () => {
  it("repairMojibake converts corrupted Latin1/Windows-1252 strings back to clean UTF-8 Hindi", () => {
    const corrupted = "à¤µà¤¿à¤§à¤µà¤¾";
    expect(hasMojibake(corrupted)).toBe(true);
    const repaired = repairMojibakeString(corrupted);
    expect(repaired).toBe("विधवा");
    expect(hasMojibake(repaired)).toBe(false);

    const fullCorrupted = "à¤µà¤¿à¤§à¤µà¤¾ / à¤\u00A0à¤•à¤² à¤®à¤¹à¤¿à¤²à¤¾ à¤ªà¥‡à¤‚à¤¶à¤¨";
    expect(repairMojibake(fullCorrupted)).toContain("विधवा");
  });

  it("fails if any scheme field in seed/schemes.json contains mojibake ('à¤', 'à¥', 'Ã')", () => {
    const seedPath = path.resolve(__dirname, "..", "seed", "schemes.json");
    const raw = fs.readFileSync(seedPath, "utf8");
    const schemes = JSON.parse(raw);

    const badStrings: { scheme: string; text: string }[] = [];
    for (const s of schemes) {
      const strings = collectStrings(s);
      for (const str of strings) {
        if (hasMojibake(str)) {
          badStrings.push({ scheme: s.id, text: str });
        }
      }
    }

    expect(badStrings, `Mojibake found in seed/schemes.json: ${JSON.stringify(badStrings)}`).toEqual([]);
  });

  it("fails if any field in seed/personas.json contains mojibake", () => {
    const seedPath = path.resolve(__dirname, "..", "seed", "personas.json");
    const raw = fs.readFileSync(seedPath, "utf8");
    const personas = JSON.parse(raw);

    const badStrings: string[] = [];
    for (const p of personas) {
      const strings = collectStrings(p);
      for (const str of strings) {
        if (hasMojibake(str)) badStrings.push(str);
      }
    }

    expect(badStrings).toEqual([]);
  });

  it("fails if any scheme record in the database contains mojibake", async () => {
    const db = getDb();
    const res = await db.execute("SELECT id, json FROM schemes");
    const rows = res.rows as { id: string; json: string }[];

    const badRecords: { id: string; badText: string }[] = [];
    for (const row of rows) {
      if (hasMojibake(row.json)) {
        badRecords.push({ id: row.id, badText: row.json.slice(0, 150) });
      }
    }

    expect(badRecords, `Database has mojibake records: ${JSON.stringify(badRecords)}`).toEqual([]);
  });

  it("fails if API / engine scheme match output contains mojibake", async () => {
    const db = getDb();
    const res = await db.execute("SELECT json FROM schemes");
    const schemes = res.rows.map((r) => JSON.parse(r.json as string) as Scheme);

    const testProfile: Profile = {
      age: 65,
      gender: "F",
      marital: "widow",
      state: "Rajasthan",
      district: "Jaipur",
      annual_family_income: 35000,
      land_bigha: 2,
      occupation: "farmer",
      disability: false,
      children_count: 0,
      is_bpl: false,
    };

    const matches = matchSchemes(testProfile, schemes);
    const strings = collectStrings(matches);

    const badStrings = strings.filter((s) => hasMojibake(s));
    expect(badStrings, `Match output contains mojibake: ${badStrings.join(", ")}`).toEqual([]);
  });
});

describe("Field Label Translation & Missing Label Fallback", () => {
  it("translates fields.land_bigha, fields.annual_family_income, fields.children_count in both hi and en", () => {
    expect(translate("fields.land_bigha", "hi")).toBe("ज़मीन (बीघा)");
    expect(translate("fields.land_bigha", "en")).toBe("Land (bigha)");

    expect(translate("fields.annual_family_income", "hi")).toBe("सालाना आय");
    expect(translate("fields.annual_family_income", "en")).toBe("Annual family income");

    expect(translate("fields.children_count", "hi")).toBe("बच्चे");
    expect(translate("fields.children_count", "en")).toBe("Children");
  });

  it("never shows a raw dotted key when translation is missing", () => {
    const fallbackHi = translate("fields.untranslated_field", "hi");
    expect(fallbackHi).not.toContain("fields.");
    expect(fallbackHi).toBe("Untranslated Field");

    const fallbackEn = translate("custom.some_nested_label", "en");
    expect(fallbackEn).not.toContain("custom.");
    expect(fallbackEn).toBe("Some Nested Label");
  });
});
