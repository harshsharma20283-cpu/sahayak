import { readFileSync, existsSync } from "fs";
import path from "path";

// Load .env.local if present
const envLocalPath = path.resolve(__dirname, "..", ".env.local");
if (existsSync(envLocalPath)) {
  const content = readFileSync(envLocalPath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

import { getDb, initSchema } from "../lib/db";
import { repairMojibake } from "../lib/encoding";
import type { Scheme } from "../lib/types";

async function main() {
  const seedPath = path.resolve(__dirname, "..", "seed", "schemes.json");
  const raw = readFileSync(seedPath, "utf8");
  const rawSchemes = JSON.parse(raw) as Scheme[];
  const schemes = repairMojibake(rawSchemes);

  const db = getDb();
  await initSchema(db);

  const now = new Date().toISOString();

  for (const scheme of schemes) {
    await db.execute({
      sql: `INSERT INTO schemes (id, json, updated_at) VALUES (?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET json = excluded.json, updated_at = excluded.updated_at`,
      args: [scheme.id, JSON.stringify(scheme), now],
    });
  }

  const res = await db.execute("SELECT COUNT(*) AS n FROM schemes");
  const count = res.rows[0]?.n;

  console.log(`Seeded ${schemes.length} schemes`);
  console.log(`Total rows in schemes: ${count}`);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
