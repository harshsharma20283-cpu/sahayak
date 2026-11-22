"use client";

import { useState } from "react";
import { useLang } from "@/components/LangProvider";

const EXAMPLE = "AGE 62 WIDOW 35000";

function parseSms(text: string, lang: "hi" | "en"): string[] {
  const found: string[] = [];
  const ageMatch = /\bAGE\s*(\d{1,3})\b/i.exec(text);
  if (ageMatch) found.push(lang === "hi" ? `उम्र ${ageMatch[1]}` : `Age ${ageMatch[1]}`);
  if (/\bWIDOW\b/i.test(text)) found.push(lang === "hi" ? "विधवा" : "Widow");

  const rest = ageMatch ? text.replace(ageMatch[0], " ") : text;
  const numbers = rest.match(/\d+/g) ?? [];
  if (numbers.length > 0) found.push(lang === "hi" ? `आय ${numbers[0]}` : `Income ${numbers[0]}`);

  return found;
}

export default function KeypadSim() {
  const { lang } = useLang();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [reply, setReply] = useState<{ parsed: string[] } | null>(null);

  function close() {
    setOpen(false);
    setReply(null);
    setText("");
  }

  function send() {
    setReply({ parsed: parseSms(text, lang) });
  }

  const triggerText = lang === "hi" ? "बटन वाला फ़ोन? SMS सिमुलेटर" : "No smartphone? SMS simulator";
  const title = lang === "hi" ? "SMS सिमुलेटर" : "SMS Simulator";
  const desc = lang === "hi" ? "सादे फ़ोन (keypad phone) से SMS द्वारा पात्रता जाँचें:" : "Check eligibility via SMS from a feature phone:";
  const placeholder = lang === "hi" ? "यहाँ SMS लिखें..." : "Type SMS message here...";
  const sendText = lang === "hi" ? "SMS भेजें" : "Send SMS";
  const closeText = lang === "hi" ? "बंद करें" : "Close";
  const replyPrefix = lang === "hi" ? "सिमुलेशन: संभावित रूप से पात्र योजनाएँ देखने के लिए वेबसाइट खोलें" : "Simulation: open website to view likely eligible schemes";
  const identifiedPrefix = lang === "hi" ? "पहचाने गए विवरण:" : "Identified details:";

  return (
    <>
      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="min-h-[56px] rounded-xl px-4 py-3 font-semibold text-primary underline"
        >
          {triggerText}
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="sms-sim-title"
            className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-xl"
          >
            <h2 id="sms-sim-title" className="text-xl font-bold text-ink">
              {title}
            </h2>

            <p className="text-sm text-neutral">{desc}</p>
            <p className="font-mono text-sm font-semibold text-ink">
              {lang === "hi" ? "उदाहरण:" : "Example:"} {EXAMPLE}
            </p>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={placeholder}
              rows={3}
              className="w-full rounded-xl border border-neutral/40 p-3 text-ink focus:border-primary focus:outline-none"
            />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={send}
                disabled={text.trim() === ""}
                className="min-h-[48px] flex-1 rounded-xl bg-primary px-4 py-2 font-semibold text-white disabled:opacity-50"
              >
                {sendText}
              </button>
              <button
                type="button"
                onClick={close}
                className="min-h-[48px] rounded-xl border border-neutral/40 px-4 py-2 font-semibold text-ink"
              >
                {closeText}
              </button>
            </div>

            {reply && (
              <div className="space-y-2 rounded-xl bg-neutral/10 p-4 text-sm text-ink">
                <p className="font-semibold">{replyPrefix}</p>
                {reply.parsed.length > 0 && (
                  <p>
                    {identifiedPrefix} {reply.parsed.join(", ")}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
