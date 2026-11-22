"use client";

import { useState } from "react";

type Message = { kind: "success" | "error"; text: string } | null;

const FALLBACK_SPEECH =
  "Is yojana ki jaankari screen par di gayi hai. Kripya dhyaan se padhein.";

export default function SchemeActions({ schemeId }: { schemeId: string }) {
  const [message, setMessage] = useState<Message>(null);
  const [busy, setBusy] = useState(false);

  async function post(url: string, body: unknown, successText: string, errorText: string) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setMessage({ kind: "success", text: successText });
      } else {
        setMessage({ kind: "error", text: errorText });
      }
    } catch {
      setMessage({ kind: "error", text: errorText });
    } finally {
      setBusy(false);
    }
  }

  function handleReport() {
    post(
      "/api/report",
      { scheme_id: schemeId, district: null, note: "Paise maange gaye" },
      "Aapki report darj ho gayi hai. Dhanyavaad.",
      "Report darj nahi ho saki. Kripya thodi der baad phir koshish karein."
    );
  }

  function handleApply() {
    post(
      "/api/applications",
      { scheme_id: schemeId, status: "saved" },
      "Application save ho gayi hai.",
      "Application save nahi ho saki. Kripya phir koshish karein."
    );
  }

  function handleSpeak() {
    const hasSpeech =
      typeof window !== "undefined" &&
      "speechSynthesis" in window &&
      typeof window.SpeechSynthesisUtterance !== "undefined";
    if (!hasSpeech) {
      setMessage({ kind: "error", text: "Is browser mein awaaz sunne ki suvidha nahi hai." });
      return;
    }
    const contentEl = document.getElementById("scheme-content");
    const text = (contentEl?.innerText || FALLBACK_SPEECH).slice(0, 3000);
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "hi-IN";
    window.speechSynthesis.speak(utterance);
    setMessage(null);
  }

  const btn =
    "min-h-[48px] rounded-lg px-4 py-3 text-base font-semibold disabled:opacity-60";

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleReport}
          disabled={busy}
          className={`${btn} bg-red-600 text-white`}
        >
          Report karein
        </button>
        <button
          type="button"
          onClick={handleApply}
          disabled={busy}
          className={`${btn} bg-green-700 text-white`}
        >
          Application shuru karein
        </button>
        <button
          type="button"
          onClick={handleSpeak}
          className={`${btn} bg-blue-700 text-white`}
        >
          Suno
        </button>
      </div>
      {message && (
        <p
          role="status"
          className={
            message.kind === "success" ? "text-green-700 font-medium" : "text-red-700 font-medium"
          }
        >
          {message.text}
        </p>
      )}
    </section>
  );
}
