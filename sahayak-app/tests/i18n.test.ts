import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import hi from "../lib/i18n/hi.json";
import en from "../lib/i18n/en.json";

describe("i18n translation dictionaries", () => {
  it("has matching keys between hi.json and en.json", () => {
    const hiKeys = Object.keys(hi).sort();
    const enKeys = Object.keys(en).sort();

    const missingInEn = hiKeys.filter((k) => !(k in en));
    const missingInHi = enKeys.filter((k) => !(k in hi));

    expect(missingInEn, `Keys in hi.json missing from en.json: ${missingInEn.join(", ")}`).toEqual([]);
    expect(missingInHi, `Keys in en.json missing from hi.json: ${missingInHi.join(", ")}`).toEqual([]);
  });

  it("checks components and app pages for hardcoded Hindi or bilingual strings", () => {
    const rootDir = path.resolve(__dirname, "..");
    const searchDirs = [path.join(rootDir, "components"), path.join(rootDir, "app")];

    const violations: { file: string; line: number; text: string; reason: string }[] = [];

    // Regex for bilingual combined strings like "हिंदी / English" or "English / हिंदी"
    const bilingualRegex = /([\u0900-\u097F]+\s*\/\s*[A-Za-z]+|[A-Za-z]+\s*\/\s*[\u0900-\u097F]+)/;
    // Regex for hardcoded Hindi in JSX or raw strings outside i18n
    const devanagariRegex = /[\u0900-\u097F]{2,}/;

    function scanFile(filePath: string) {
      // Skip i18n files, api routes that legitimately return localized error fallbacks, and test files
      if (
        filePath.includes("i18n") ||
        filePath.includes("api") ||
        filePath.includes("test") ||
        filePath.endsWith(".d.ts")
      ) {
        return;
      }

      const content = fs.readFileSync(filePath, "utf-8");
      const lines = content.split("\n");

      lines.forEach((line, idx) => {
        const lineNum = idx + 1;
        const trimmed = line.trim();

        // Skip comments and imports
        if (trimmed.startsWith("//") || trimmed.startsWith("/*") || trimmed.startsWith("*")) return;
        if (trimmed.startsWith("import ")) return;

        // Check for bilingual combined labels
        if (bilingualRegex.test(line)) {
          violations.push({
            file: path.relative(rootDir, filePath),
            line: lineNum,
            text: trimmed,
            reason: "Bilingual combined label found (must be in hi.json / en.json)",
          });
          return;
        }

        // Check for raw Devanagari in components outside allowed exceptions
        if (devanagariRegex.test(line)) {
          // Allow internal constants or type guards if any, but not JSX user strings
          // Specifically check JSX text or string literals
          if (
            line.includes("<") ||
            line.includes("placeholder=") ||
            line.includes("aria-label=") ||
            line.includes("title=")
          ) {
            violations.push({
              file: path.relative(rootDir, filePath),
              line: lineNum,
              text: trimmed,
              reason: "Hardcoded Hindi string in JSX outside dictionaries",
            });
          }
        }
      });
    }

    function walkDir(dir: string) {
      if (!fs.existsSync(dir)) return;
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walkDir(fullPath);
        } else if (entry.isFile() && (entry.name.endsWith(".tsx") || entry.name.endsWith(".ts"))) {
          scanFile(fullPath);
        }
      }
    }

    for (const dir of searchDirs) {
      walkDir(dir);
    }

    expect(
      violations,
      `Found hardcoded Hindi or bilingual strings:\n${violations
        .map((v) => `  ${v.file}:${v.line} - ${v.reason}: "${v.text}"`)
        .join("\n")}`
    ).toEqual([]);
  });
});
