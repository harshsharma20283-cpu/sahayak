"use client";

import { useEffect, useState } from "react";
import { useLang, type Lang } from "@/components/LangProvider";

export interface ReadAloudProps {
  text_hi: string;
  text_en: string;
  lang?: Lang;
}

export default function ReadAloud({ text_hi, text_en }: ReadAloudProps) {
  const { lang, t } = useLang();
  const [supported, setSupported] = useState<boolean | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const ok =
      typeof window !== "undefined" &&
      "speechSynthesis" in window &&
      typeof window.SpeechSynthesisUtterance !== "undefined";
    setSupported(ok);
    return () => {
      if (ok) window.speechSynthesis.cancel();
    };
  }, []);

  function listen() {
    if (!supported) return;
    const synth = window.speechSynthesis;
    try {
      synth.cancel();
      const utterance = new window.SpeechSynthesisUtterance(lang === "hi" ? text_hi : text_en);
      utterance.lang = lang === "hi" ? "hi-IN" : "en-IN";
      utterance.onerror = () => setNotice(t("home.mic_error"));
      setNotice(null);
      synth.speak(utterance);
    } catch {
      setNotice(t("home.mic_error"));
    }
  }

  if (supported === false) {
    return (
      <p className="text-center text-sm text-neutral">
        {t("home.mic_unsupported")}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={listen}
        className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-xl bg-primary/10 px-4 py-3 font-semibold text-primary hover:bg-primary/20"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2}>
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M15.54 8.46a5 5 0 010 7.07M19.07 4.93a10 10 0 010 14.14" />
        </svg>
        <span>{t("scheme.read_aloud")}</span>
      </button>
      {notice && <p role="alert" className="text-center text-sm text-danger">{notice}</p>}
    </div>
  );
}
