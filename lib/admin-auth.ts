import { createHash } from "crypto";

export const ADMIN_COOKIE = "sahayak_admin";

export function adminCookieValue(): string | null {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return null;
  return createHash("sha256").update(`${email}:${password}:sahayak`).digest("hex");
}

export function isAdmin(request: Request): boolean {
  const expected = adminCookieValue();
  if (!expected) return false;
  const header = request.headers.get("cookie") ?? "";
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    if (part.slice(0, idx).trim() === ADMIN_COOKIE) {
      return part.slice(idx + 1).trim() === expected;
    }
  }
  return false;
}
