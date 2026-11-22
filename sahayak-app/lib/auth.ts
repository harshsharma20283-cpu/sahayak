import { createHmac, timingSafeEqual } from "node:crypto";

const ADMIN_COOKIE = "sahayak_admin";
const ADMIN_MESSAGE = "sahayak-admin";

export function makeToken(): string {
  const key = process.env.SESSION_SECRET || "dev-only-secret";
  return createHmac("sha256", key).update(ADMIN_MESSAGE).digest("hex");
}

export function isAdmin(req: Request): boolean {
  if (!process.env.ADMIN_PASSWORD) return false;

  const header = req.headers.get("cookie") || "";
  const match = header
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${ADMIN_COOKIE}=`));
  if (!match) return false;

  const provided = Buffer.from(decodeURIComponent(match.slice(ADMIN_COOKIE.length + 1)));
  const expected = Buffer.from(makeToken());
  if (provided.length !== expected.length) return false;
  return timingSafeEqual(provided, expected);
}
