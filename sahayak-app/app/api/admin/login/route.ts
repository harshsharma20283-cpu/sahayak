import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { makeToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const expectedPassword = process.env.ADMIN_PASSWORD;
    if (!expectedPassword) {
      return NextResponse.json(
        { error_hi: "सर्वर सेटअप अधूरा है", error_en: "Server not configured" },
        { status: 500 }
      );
    }

    const body = (await req.json().catch(() => null)) as { password?: unknown } | null;
    const provided = typeof body?.password === "string" ? body.password : "";

    const providedHash = createHash("sha256").update(provided).digest();
    const expectedHash = createHash("sha256").update(expectedPassword).digest();
    const matches = timingSafeEqual(providedHash, expectedHash);

    if (!matches) {
      return NextResponse.json(
        { error_hi: "पासवर्ड गलत है", error_en: "Wrong password" },
        { status: 401 }
      );
    }

    const res = NextResponse.json({ ok: true });
    res.cookies.set("sahayak_admin", makeToken(), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });
    return res;
  } catch {
    return NextResponse.json(
      { error_hi: "कुछ गड़बड़ हो गई, कृपया दोबारा कोशिश करें", error_en: "Something went wrong" },
      { status: 500 }
    );
  }
}
