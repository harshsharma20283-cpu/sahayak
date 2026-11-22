/**
 * Encoding utilities to detect and repair mojibake (e.g. UTF-8 decoded as Latin1 / Windows-1252).
 */

export function hasMojibake(str: string): boolean {
  return str.includes("à¤") || str.includes("à¥") || str.includes("Ã");
}

export function repairMojibakeString(str: string): string {
  if (!hasMojibake(str)) return str;
  try {
    return Buffer.from(str, "latin1").toString("utf8");
  } catch {
    return str;
  }
}

export function repairMojibake<T>(val: T): T {
  if (typeof val === "string") {
    return repairMojibakeString(val) as unknown as T;
  }
  if (Array.isArray(val)) {
    return val.map((item) => repairMojibake(item)) as unknown as T;
  }
  if (typeof val === "object" && val !== null) {
    const res: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(val)) {
      res[k] = repairMojibake(v);
    }
    return res as unknown as T;
  }
  return val;
}
