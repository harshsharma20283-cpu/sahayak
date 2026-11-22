"use client";

import { useEffect, useState } from "react";
import { useLang, type Lang } from "@/components/LangProvider";
import type { Document } from "@/lib/types";

export interface DocChecklistProps {
  scheme_id: string;
  documents: Document[];
  lang?: Lang;
}

type CheckState = Record<string, boolean>;

function storageKey(schemeId: string): string {
  return `sahayak_docs_${schemeId}`;
}

export default function DocChecklist({ scheme_id, documents }: DocChecklistProps) {
  const { lang, t } = useLang();
  // Keyed by English name so the saved state survives a language switch.
  const [checked, setChecked] = useState<CheckState>({});

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey(scheme_id));
      const parsed = raw ? (JSON.parse(raw) as unknown) : null;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        setChecked(parsed as CheckState);
      }
    } catch {
      // unreadable storage: start with an empty checklist
    }
  }, [scheme_id]);

  function toggle(key: string) {
    const next = { ...checked, [key]: !checked[key] };
    setChecked(next);
    try {
      window.localStorage.setItem(storageKey(scheme_id), JSON.stringify(next));
    } catch {
      // storage unavailable: state still works for this visit
    }
  }

  if (documents.length === 0) {
    return (
      <p className="rounded-2xl glass-subtle p-5 text-ink-secondary text-base">
        {t("scheme.no_documents")}
      </p>
    );
  }

  const total = documents.length;
  const done = documents.filter((d) => checked[d.name_en]).length;
  const pct = Math.round((done / total) * 100);

  const progressText =
    lang === "hi"
      ? `${total} में से ${done} तैयार`
      : `${done} of ${total} ready`;

  return (
    <div className="space-y-5">
      {/* Animated progress bar and pill */}
      <div className="space-y-2.5 rounded-2xl glass-subtle p-4 border border-white/60">
        <div className="flex items-center justify-between text-sm sm:text-base font-bold text-ink">
          <span>{progressText}</span>
          <span className="text-primary">{pct}%</span>
        </div>
        <div
          role="progressbar"
          aria-label={t("scheme.documents_heading")}
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={done}
          className="h-3 w-full overflow-hidden rounded-full bg-black/10 shadow-inner"
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-500 transition-all duration-300 shadow-sm"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <ul className="space-y-3">
        {documents.map((doc) => {
          const docName = lang === "hi" ? doc.name_hi : doc.name_en;
          const docTip = lang === "hi" ? doc.tip_hi : doc.tip_en;
          const isDone = !!checked[doc.name_en];

          return (
            <li key={doc.name_en}>
              <label
                className={`glass-hover flex min-h-[58px] cursor-pointer items-start gap-3.5 rounded-2xl p-4 transition-all duration-200 border ${
                  isDone
                    ? "bg-emerald-50/80 border-success/40 shadow-xs"
                    : "glass-subtle border-white/60 hover:border-primary/40 shadow-xs"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isDone}
                  onChange={() => toggle(doc.name_en)}
                  className="mt-1 h-6 w-6 shrink-0 rounded-lg accent-primary cursor-pointer"
                />
                <span className="flex-1 min-w-0">
                  <span className={`block font-bold text-base sm:text-lg ${isDone ? "text-emerald-950 line-through opacity-80" : "text-ink"}`}>
                    {docName}
                  </span>
                  {docTip && (
                    <span className="block text-xs sm:text-sm text-ink-secondary mt-0.5 leading-relaxed">
                      {docTip}
                    </span>
                  )}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
