import { randomUUID } from "node:crypto";
import { getDb } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import { jsonResponse } from "@/lib/api-response";
import { repairMojibake } from "@/lib/encoding";

export const runtime = "nodejs";

const UNAUTHORIZED = {
  error_hi: "लॉगिन ज़रूरी है",
  error_en: "Login required",
};

const SERVER_ERROR = {
  error_hi: "सर्वर में त्रुटि हुई, कृपया फिर से कोशिश करें",
  error_en: "Server error, please try again",
};

const NOT_FOUND = {
  error_hi: "योजना नहीं मिली",
  error_en: "Scheme not found",
};

const ALLOWED_HOSTS = new Set([
  "ssp.rajasthan.gov.in",
  "myscheme.gov.in",
  "nsap.nic.in",
  "pmkisan.gov.in",
]);

const FORBIDDEN_KEY_PARTS = ["aadhaar", "phone", "address"];

function isAllowedOfficialUrl(raw: string): boolean {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  if (url.protocol !== "https:") return false;
  const host = url.hostname.toLowerCase();
  return ALLOWED_HOSTS.has(host) || host.endsWith(".rajasthan.gov.in");
}

function validateScheme(body: unknown): string[] {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return ["body must be a JSON object"];
  }
  const details: string[] = [];
  const data = body as Record<string, unknown>;

  for (const key of Object.keys(data)) {
    const lower = key.toLowerCase();
    if (lower === "name" || FORBIDDEN_KEY_PARTS.some((part) => lower.includes(part))) {
      details.push(`field "${key}" is not allowed`);
    }
  }

  const officialUrl = data.official_url;
  if (typeof officialUrl !== "string" || !isAllowedOfficialUrl(officialUrl)) {
    details.push(
      "official_url must be an https URL on ssp.rajasthan.gov.in, myscheme.gov.in, nsap.nic.in, pmkisan.gov.in or *.rajasthan.gov.in",
    );
  }

  const status = data.verification_status;
  if (status !== "verified" && status !== "needs_verification") {
    details.push('verification_status must be "verified" or "needs_verification"');
  }

  if (status === "verified") {
    const lastVerified = data.last_verified;
    if (typeof lastVerified !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(lastVerified)) {
      details.push("last_verified must match YYYY-MM-DD when verification_status is verified");
    }
    const sources = data.sources;
    if (!Array.isArray(sources) || sources.length < 1) {
      details.push("sources must contain at least 1 entry when verification_status is verified");
    }
  }

  return details;
}

function validationError(details: string[]) {
  return jsonResponse(
    { error_hi: "जानकारी सही नहीं है", error_en: "Invalid data", details },
    { status: 400 },
  );
}

async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return undefined;
  }
}

export async function GET(req: Request) {
  if (!isAdmin(req)) return jsonResponse(UNAUTHORIZED, { status: 401 });
  try {
    const db = getDb();
    const result = await db.execute("SELECT id, json, updated_at FROM schemes ORDER BY updated_at DESC");
    const schemes = result.rows.map((row) => repairMojibake(JSON.parse(row.json as string)));
    return jsonResponse({ schemes });
  } catch {
    return jsonResponse(SERVER_ERROR, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!isAdmin(req)) return jsonResponse(UNAUTHORIZED, { status: 401 });

  const body = await readJson(req);
  if (body === undefined) return validationError(["body must be valid JSON"]);

  const details = validateScheme(body);
  if (details.length > 0) return validationError(details);

  try {
    const data = repairMojibake(body as Record<string, unknown>);
    const id = typeof data.id === "string" && data.id.length > 0 ? data.id : randomUUID();
    const scheme = { ...data, id };
    const db = getDb();
    await db.execute({
      sql: "INSERT INTO schemes (id, json, updated_at) VALUES (?, ?, ?)",
      args: [id, JSON.stringify(scheme), new Date().toISOString()],
    });
    return jsonResponse({ ok: true, scheme }, { status: 201 });
  } catch {
    return jsonResponse(SERVER_ERROR, { status: 500 });
  }
}

export async function PUT(req: Request) {
  if (!isAdmin(req)) return jsonResponse(UNAUTHORIZED, { status: 401 });

  const body = await readJson(req);
  if (body === undefined) return validationError(["body must be valid JSON"]);

  const details = validateScheme(body);
  const data = repairMojibake(body as Record<string, unknown>);
  if (typeof data?.id !== "string" || data.id.length === 0) {
    details.push("id is required to update a scheme");
  }
  if (details.length > 0) return validationError(details);

  try {
    const id = data.id as string;
    const db = getDb();
    const result = await db.execute({
      sql: "UPDATE schemes SET json = ?, updated_at = ? WHERE id = ?",
      args: [JSON.stringify(data), new Date().toISOString(), id],
    });
    if (result.rowsAffected === 0) {
      return jsonResponse(NOT_FOUND, { status: 404 });
    }
    return jsonResponse({ ok: true, scheme: data });
  } catch {
    return jsonResponse(SERVER_ERROR, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  if (!isAdmin(req)) return jsonResponse(UNAUTHORIZED, { status: 401 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return validationError(["id query parameter is required"]);

  try {
    const db = getDb();
    const result = await db.execute({
      sql: "DELETE FROM schemes WHERE id = ?",
      args: [id],
    });
    if (result.rowsAffected === 0) {
      return jsonResponse(NOT_FOUND, { status: 404 });
    }
    return jsonResponse({ ok: true });
  } catch {
    return jsonResponse(SERVER_ERROR, { status: 500 });
  }
}
