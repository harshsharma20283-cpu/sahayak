import fs from "fs";
import schemes from "../seed/schemes.json";
import type { Scheme } from "./types";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DATA_FILE = "data/schemes.json";

export function loadSchemes(): Scheme[] {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, "utf8")) as Scheme[];
    }
  } catch {
    // unreadable or invalid data file: fall back to the seed data
  }
  return schemes as unknown as Scheme[];
}

export function saveSchemes(schemes: Scheme[]): void {
  fs.mkdirSync("data", { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(schemes, null, 2));
}

export function validateScheme(s: Scheme): { ok: boolean; errors: string[] } {
  const errors: string[] = [];

  const url = s?.official_url;
  if (typeof url !== "string" || url.trim() === "") {
    errors.push("official_url is missing");
  } else {
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== "https:") errors.push("official_url is not https");
    } catch {
      errors.push("official_url is not a valid URL");
    }
  }

  const verified = s?.last_verified;
  if (typeof verified !== "string" || !DATE_RE.test(verified)) {
    errors.push("last_verified must be YYYY-MM-DD");
  }

  return { ok: errors.length === 0, errors };
}

export function validateAll(): Array<{ id: string; ok: boolean; errors: string[] }> {
  try {
    return loadSchemes().map((s) => {
      const { ok, errors } = validateScheme(s);
      return { id: String(s?.id ?? ""), ok, errors };
    });
  } catch (e) {
    return [{ id: "*", ok: false, errors: [`failed to load schemes: ${String(e)}`] }];
  }
}
