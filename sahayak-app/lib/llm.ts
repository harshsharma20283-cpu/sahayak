const API_URL = "https://api.anthropic.com/v1/messages";

// Thrown for responses worth retrying (non-2xx, bad JSON, failed check).
class BadResponse extends Error {}

async function requestOnce(
  apiKey: string,
  system: string,
  userText: string,
  timeoutMs: number,
): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.LLM_MODEL || "claude-3-5-haiku-latest",
        max_tokens: 400,
        system,
        // User text is data: it goes in messages, never into the system prompt.
        messages: [{ role: "user", content: userText }],
      }),
      signal: controller.signal,
    });
    if (!res.ok) throw new BadResponse(`HTTP ${res.status}`);

    let text: unknown;
    try {
      const body = JSON.parse(await res.text()) as { content?: { text?: unknown }[] };
      text = body.content?.[0]?.text;
    } catch {
      throw new BadResponse("bad envelope");
    }
    if (typeof text !== "string") throw new BadResponse("no text");
    try {
      return JSON.parse(text);
    } catch {
      throw new BadResponse("invalid JSON");
    }
  } finally {
    clearTimeout(timer);
  }
}

// Returns the validated JSON, or null on any failure. Never throws.
export async function callJson(
  system: string,
  userText: string,
  check: (x: unknown) => boolean,
  timeoutMs = 8000,
): Promise<unknown | null> {
  try {
    const apiKey = process.env.LLM_API_KEY;
    if (!apiKey) return null;

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const value = await requestOnce(apiKey, system, userText, timeoutMs);
        if (check(value)) return value;
        // Failed check counts as an invalid response: retry once.
      } catch (err) {
        // Network/timeout errors are not retried; bad responses are.
        if (!(err instanceof BadResponse)) return null;
      }
    }
    return null;
  } catch {
    return null;
  }
}
