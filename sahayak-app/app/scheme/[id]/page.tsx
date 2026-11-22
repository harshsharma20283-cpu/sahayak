import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import type { Scheme } from "@/lib/types";
import SchemeView from "./SchemeView";

export const runtime = "nodejs";

export default async function SchemePage({ params }: { params: { id: string } }) {
  const db = getDb();
  const res = await db.execute({
    sql: "SELECT json FROM schemes WHERE id = ?",
    args: [params.id],
  });
  const row = res.rows[0] as { json: string } | undefined;
  if (!row) notFound();
  const scheme = JSON.parse(row.json as string) as Scheme;

  return <SchemeView scheme={scheme} />;
}
