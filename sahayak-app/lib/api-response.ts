import { NextResponse } from "next/server";

export const JSON_UTF8_HEADERS = {
  "content-type": "application/json; charset=utf-8",
} as const;

export function jsonResponse<T>(data: T, init?: ResponseInit): NextResponse<T> {
  const headers = new Headers(init?.headers);
  if (!headers.has("content-type")) {
    headers.set("content-type", "application/json; charset=utf-8");
  } else {
    const current = headers.get("content-type") || "";
    if (!current.includes("charset")) {
      headers.set("content-type", `${current}; charset=utf-8`);
    }
  }
  return NextResponse.json(data, { ...init, headers });
}
