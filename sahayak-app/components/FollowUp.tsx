"use client";

import { useState } from "react";
import { useLang, type Lang } from "@/components/LangProvider";
import { questionFor } from "@/lib/questions";

export interface FollowUpProps {
  field: string;
  onAnswer: (value: unknown) => void;
  lang?: Lang;
}

export default function FollowUp({ field, onAnswer, lang: langProp }: FollowUpProps) {
  const ctx = useLang();
  const lang = langProp ?? ctx.lang;
  const entry = questionFor(field);

  const [ageInput, setAgeInput] = useState<string>("60");

  if (!entry) return null;

  const question = lang === "hi" ? entry.ask_hi : entry.ask_en;
  const note = entry.note_hi || entry.note_en ? (lang === "hi" ? (entry.note_hi ?? "") : (entry.note_en ?? "")) : null;

  const isNumeric = entry.type === "numeric" || field === "age";

  function handleAgeSubmit() {
    const n = Number(ageInput.trim());
    if (Number.isFinite(n) && n >= 1 && n <= 120) {
      onAnswer(n);
    }
  }

  function handleStep(delta: number) {
    const current = Number(ageInput.trim()) || 60;
    const next = Math.min(120, Math.max(1, current + delta));
    setAgeInput(String(next));
  }

  return (
    <section aria-labelledby="followup-question" className="space-y-5">
      <div className="space-y-2 text-center sm:text-left">
        <h2 id="followup-question" className="heading-2">
          {question}
        </h2>
        {note && <p className="text-base text-ink-secondary">{note}</p>}
      </div>

      {isNumeric ? (
        <div className="glass-card border border-primary/30 p-6 sm:p-8 space-y-6 shadow-glass">
          <div className="flex items-center justify-center gap-4">
            <button
              type="button"
              aria-label={ctx.t("followup.decrease_age")}
              onClick={() => handleStep(-1)}
              className="btn-press flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/30 bg-white/80 text-3xl font-extrabold text-primary shadow-sm hover:bg-primary/10"
            >
              −
            </button>
            <input
              type="number"
              inputMode="numeric"
              pattern="[0-9]*"
              min={1}
              max={120}
              value={ageInput}
              onChange={(e) => setAgeInput(e.target.value)}
              className="h-16 w-36 rounded-2xl border-2 border-primary/50 bg-white/90 text-center text-3xl font-extrabold text-ink focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/20 shadow-inner"
            />
            <button
              type="button"
              aria-label={ctx.t("followup.increase_age")}
              onClick={() => handleStep(1)}
              className="btn-press flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/30 bg-white/80 text-3xl font-extrabold text-primary shadow-sm hover:bg-primary/10"
            >
              +
            </button>
          </div>

          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={handleAgeSubmit}
              disabled={!Number(ageInput) || Number(ageInput) < 1 || Number(ageInput) > 120}
              className="btn-press min-h-[56px] w-full rounded-2xl bg-gradient-to-r from-primary to-emerald-700 px-6 py-4 text-lg font-bold text-white shadow-md shadow-primary/30 hover:opacity-95 disabled:opacity-50"
            >
              {ctx.t("followup.continue")}
            </button>
            <button
              type="button"
              onClick={() => onAnswer(null)}
              className="btn-press min-h-[50px] w-full rounded-2xl border border-neutral/30 bg-white/60 px-4 py-2.5 font-semibold text-ink-secondary hover:text-ink hover:border-primary/50 hover:bg-white/90 transition-all"
            >
              {ctx.t("followup.not_sure")}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {entry.options.map((option, index) => {
            const optLabel = lang === "hi" ? option.label_hi : option.label_en;
            return (
              <button
                key={`${field}-${index}`}
                type="button"
                onClick={() => onAnswer(option.value)}
                className="glass-hover min-h-[60px] w-full rounded-2xl border border-primary/30 bg-white/80 px-5 py-4 text-left text-lg font-bold text-ink shadow-sm hover:border-primary hover:bg-primary/10 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span>{optLabel}</span>
                  <span className="text-primary opacity-60">→</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
