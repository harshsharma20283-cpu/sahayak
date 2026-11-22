"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { translate, type Lang, type TranslationKey } from "@/lib/i18n";

export type { Lang, TranslationKey };

interface LangContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const STORAGE_KEY = "sahayak_lang";

let currentGlobalLang: Lang = "hi";

const LangContext = createContext<LangContextValue>({
  lang: "hi",
  setLang: () => {},
  t: (key: string, vars?: Record<string, string | number>) => translate(key, "hi", vars),
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("hi");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === "hi" || saved === "en") {
        setLangState(saved);
        currentGlobalLang = saved;
      }
    } catch {
      // Storage unavailable
    }
  }, []);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    currentGlobalLang = next;
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage unavailable
    }
  }, []);

  const tFunc = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      return translate(key, lang, vars);
    },
    [lang]
  );

  return (
    <LangContext.Provider value={{ lang, setLang, t: tFunc }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang(): LangContextValue {
  return useContext(LangContext);
}

/**
 * Universal translation helper.
 * If called as t(key, vars): translates using global/current language.
 * If called legacy-style as t(hi, en, lang): supports transition.
 */
export function t(
  keyOrHi: string,
  varsOrEn?: Record<string, string | number> | string,
  langOverride?: Lang
): string {
  if (typeof varsOrEn === "string") {
    // Legacy call: t(hiText, enText, lang)
    const targetLang = langOverride || currentGlobalLang;
    return targetLang === "hi" ? keyOrHi : varsOrEn;
  }
  return translate(keyOrHi, langOverride || currentGlobalLang, varsOrEn);
}
