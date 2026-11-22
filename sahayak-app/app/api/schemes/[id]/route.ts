import { getDb } from "@/lib/db";
import { jsonResponse } from "@/lib/api-response";
import { repairMojibake } from "@/lib/encoding";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const db = getDb();
    const result = await db.execute({
      sql: "SELECT json FROM schemes WHERE id = ?",
      args: [params.id],
    });
    const row = result.rows[0] as { json: string } | undefined;

    if (!row) {
      return jsonResponse(
        {
          error_hi: "योजना नहीं मिली",
          error_en: "Scheme not found",
        },
        { status: 404 }
      );
    }

    return jsonResponse(repairMojibake(JSON.parse(row.json)));
  } catch {
    return jsonResponse(
      {
        error_hi: "कुछ गड़बड़ हुई, दोबारा कोशिश करें",
        error_en: "Something went wrong, please try again",
      },
      { status: 500 }
    );
  }
}
