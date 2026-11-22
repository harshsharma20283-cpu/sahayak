import { readFileSync } from "fs";
import path from "path";
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
