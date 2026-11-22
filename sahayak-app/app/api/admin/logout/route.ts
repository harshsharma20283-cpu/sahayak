import { NextResponse } from "next/server";

export async function POST() {
  try {
    const res = NextResponse.json({ ok: true });
    res.cookies.set("sahayak_admin", "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    return res;
  } catch {
    return NextResponse.json(
      { error_hi: "कुछ गड़बड़ हो गई, कृपया दोबारा कोशिश करें", error_en: "Something went wrong" },
      { status: 500 }
    );
  }
}
