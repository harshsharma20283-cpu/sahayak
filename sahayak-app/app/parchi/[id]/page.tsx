import { getDb } from "@/lib/db";
import type { Scheme } from "@/lib/types";
import ParchiView from "./ParchiView";

export const dynamic = "force-dynamic";

export default async function ParchiPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const db = getDb();
  const res = await db.execute({
    sql: "SELECT json FROM schemes WHERE id = ?",
    args: [id],
  });
  const row = res.rows[0] as { json: string } | undefined;

  if (!row) {
    return (
      <main className="mx-auto max-w-2xl p-4">
        <p className="font-semibold">Scheme not found</p>
      </main>
    );
  }

  const scheme = JSON.parse(row.json) as Scheme;

  return <ParchiView scheme={scheme} />;
}
