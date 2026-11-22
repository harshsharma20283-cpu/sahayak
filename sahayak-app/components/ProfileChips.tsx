"use client";

import { useState } from "react";
import { useLang, type Lang } from "@/components/LangProvider";
import type { Profile } from "@/lib/types";

export type ChipField =
  | "age"
  | "gender"
  | "marital"
  | "district"
  | "annual_family_income"
  | "land_bigha"
  | "occupation"
  | "disability"
  | "children_count";

type Kind = "number" | "chips";

interface ChipOpt {
  value: unknown;
  hi: string;
  en: string;
}

interface FieldDef {
  key: ChipField;
  hi: string;
  en: string;
  kind: Kind;
  icon: string;
  options?: ChipOpt[];
  min?: number;
  max?: number;
  integer?: boolean;
}

export interface ProfileChipsProps {
  profile: Profile;
  onChange: (field: ChipField, value: Profile[ChipField]) => void;
  lang?: Lang;
}

const DISTRICT_CHIPS: ChipOpt[] = [
  { value: "Jaipur", hi: "जयपुर", en: "Jaipur" },
  { value: "Kota", hi: "कोटा", en: "Kota" },
  { value: "Alwar", hi: "अलवर", en: "Alwar" },
  { value: "Dausa", hi: "दौसा", en: "Dausa" },
  { value: "Ajmer", hi: "अजमेर", en: "Ajmer" },
  { value: "Jodhpur", hi: "जोधपुर", en: "Jodhpur" },
  { value: "Udaipur", hi: "उदयपुर", en: "Udaipur" },
  { value: "Bikaner", hi: "बीकानेर", en: "Bikaner" },
  { value: "Sikar", hi: "सीकर", en: "Sikar" },
  { value: "Bhilwara", hi: "भीलवाड़ा", en: "Bhilwara" },
];

const FIELDS: FieldDef[] = [
  {
    key: "age",
    hi: "उम्र",
    en: "Age",
    kind: "number",
    icon: "M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0",
    min: 1,
    max: 120,
    integer: true,
  },
  {
    key: "gender",
    hi: "लिंग",
    en: "Gender",
    kind: "chips",
    icon: "M12 12a4 4 0 100-8 4 4 0 000 8zM12 12v9M9 18h6",
    options: [
      { value: "F", hi: "महिला", en: "Female" },
      { value: "M", hi: "पुरुष", en: "Male" },
      { value: "Other", hi: "अन्य", en: "Other" },
    ],
  },
  {
    key: "marital",
    hi: "वैवाहिक स्थिति",
    en: "Marital status",
    kind: "chips",
    icon: "M12 20s-7-4.5-7-10a4 4 0 017-2.5A4 4 0 0119 10c0 5.5-7 10-7 10z",
    options: [
      { value: "single", hi: "अविवाहित", en: "Single" },
      { value: "married", hi: "शादीशुदा", en: "Married" },
      { value: "widow", hi: "विधवा", en: "Widow" },
      { value: "divorced", hi: "तलाकशुदा", en: "Divorced" },
      { value: "separated", hi: "अलग", en: "Separated" },
    ],
  },
  {
    key: "district",
    hi: "ज़िला",
    en: "District",
    kind: "chips",
    icon: "M12 21s-6-5.5-6-10a6 6 0 1112 0c0 4.5-6 10-6 10zM12 13a3 3 0 100-6 3 3 0 000 6z",
    options: DISTRICT_CHIPS,
  },
  {
    key: "annual_family_income",
    hi: "सालाना आय",
    en: "Annual income",
    kind: "number",
    icon: "M12 3v18M16 7H10a2.5 2.5 0 000 5h4a2.5 2.5 0 010 5H8",
    min: 0,
  },
  {
    key: "land_bigha",
    hi: "ज़मीन (बीघा)",
    en: "Land (bigha)",
    kind: "number",
    icon: "M3 17l5-9 4 6 3-4 6 7H3z",
    min: 0,
  },
  {
    key: "occupation",
    hi: "काम",
    en: "Occupation",
    kind: "chips",
    icon: "M4 7h16v12H4zM9 7V5h6v2",
    options: [
      { value: "farmer", hi: "किसान", en: "Farmer" },
      { value: "labour", hi: "मज़दूर", en: "Labour" },
      { value: "student", hi: "विद्यार्थी", en: "Student" },
      { value: "unemployed", hi: "बेरोज़गार", en: "Unemployed" },
      { value: "other", hi: "अन्य", en: "Other" },
    ],
  },
  {
    key: "disability",
    hi: "दिव्यांगता",
    en: "Disability",
    kind: "chips",
    icon: "M12 4a2 2 0 100-4 2 2 0 000 4zM6 9h12M12 9v12M8 21l4-6 4 6",
    options: [
      { value: true, hi: "हाँ", en: "Yes" },
      { value: false, hi: "नहीं", en: "No" },
    ],
  },
  {
    key: "children_count",
    hi: "बच्चे",
    en: "Children",
    kind: "number",
    icon: "M12 12a3 3 0 100-6 3 3 0 000 6zM5 20a7 7 0 0114 0",
    min: 0,
    integer: true,
  },
];

function getFormattedValue(def: FieldDef, v: unknown, lang: Lang, tFn: (k: string) => string): string {
  if (v === null || v === undefined) {
    return tFn("chips.not_specified");
  }
  if (def.options) {
    const opt = def.options.find((o) => o.value === v);
    if (opt) return lang === "hi" ? opt.hi : opt.en;
  }
  if (typeof v === "boolean") {
    return v ? tFn("yesno.yes") : tFn("yesno.no");
  }
  if (def.key === "annual_family_income" && typeof v === "number") {
    return `₹${v.toLocaleString(lang === "hi" ? "hi-IN" : "en-IN")}`;
  }
  if (def.key === "land_bigha" && typeof v === "number") {
    return `${v} ${lang === "hi" ? "बीघा" : "bigha"}`;
  }
  if (def.key === "age" && typeof v === "number") {
    return `${v} ${lang === "hi" ? "वर्ष" : "years"}`;
  }
  return String(v);
}

export default function ProfileChips({ profile, onChange, lang: langProp }: ProfileChipsProps) {
  const ctx = useLang();
  const lang = langProp ?? ctx.lang;
  const [editing, setEditing] = useState<ChipField | null>(null);

  function toggleEdit(key: ChipField) {
    setEditing((prev) => (prev === key ? null : key));
  }

  function handleChipSelect(def: FieldDef, val: unknown) {
    onChange(def.key, val as Profile[ChipField]);
    setEditing(null);
  }

  function handleNumberChange(def: FieldDef, raw: string) {
    const trimmed = raw.trim();
    if (trimmed === "") {
      onChange(def.key, null);
      return;
    }
    const n = Number(trimmed);
    if (Number.isFinite(n) && (def.min === undefined || n >= def.min) && (def.max === undefined || n <= def.max)) {
      onChange(def.key, (def.integer ? Math.round(n) : n) as Profile[ChipField]);
    }
  }

  function handleNumberStep(def: FieldDef, delta: number) {
    const current = Number(profile[def.key]) || (def.key === "age" ? 60 : 0);
    const min = def.min ?? 0;
    const max = def.max ?? 10000000;
    const next = Math.min(max, Math.max(min, current + delta));
    onChange(def.key, next as Profile[ChipField]);
  }

  return (
    <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {FIELDS.map((def) => {
        const v = profile[def.key];
        const missing = v === null || v === undefined;
        const isOpen = editing === def.key;
        const fieldName = lang === "hi" ? def.hi : def.en;
        const displayVal = getFormattedValue(def, v, lang, ctx.t);

        return (
          <li
            key={def.key}
            className={`glass-hover rounded-3xl p-4 sm:p-5 transition-all ${
              missing
                ? "border-2 border-dashed border-amber-400/80 bg-amber-50/40 backdrop-blur-md"
                : "glass-card border border-white/80 shadow-glass"
            }`}
          >
            <div className="flex min-h-[56px] w-full items-center gap-3">
              {/* Circle icon with status indicator */}
              <div className="relative">
                <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-sm ${
                  missing
                    ? "bg-amber-100 text-amber-700"
                    : "bg-primary/10 text-primary border border-primary/20"
                }`}>
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d={def.icon} />
                  </svg>
                </span>
                {/* Small indicator dot: green check if filled, amber dot if missing */}
                <span
                  className={`absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-sm ${
                    missing ? "bg-amber-500" : "bg-success"
                  }`}
                  aria-hidden="true"
                >
                  {missing ? "!" : "✓"}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold uppercase tracking-wider text-ink-secondary">
                  {fieldName}
                </p>
                <p className={`text-base sm:text-lg truncate ${missing ? "text-amber-800 font-medium italic" : "text-ink font-bold"}`}>
                  {displayVal}
                </p>
              </div>

              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => toggleEdit(def.key)}
                className={`btn-press shrink-0 rounded-full px-3.5 py-1.5 text-sm font-bold transition-all border ${
                  isOpen
                    ? "bg-primary text-white border-primary"
                    : "border-primary/30 bg-white/70 text-primary hover:bg-primary hover:text-white"
                }`}
              >
                {isOpen ? ctx.t("common.close") : ctx.t("common.edit")}
              </button>
            </div>

            {/* Editing Section: Number Input with Stepper OR Clickable Chips */}
            {isOpen && (
              <div className="mt-4 border-t border-black/5 pt-3.5">
                {def.kind === "number" ? (
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleNumberStep(def, def.key === "annual_family_income" ? -10000 : def.key === "land_bigha" ? -0.5 : -1)}
                        className="btn-press flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-white/80 text-xl font-bold text-ink hover:bg-primary/10 shadow-sm"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        inputMode={def.integer ? "numeric" : "decimal"}
                        min={def.min}
                        max={def.max}
                        value={v === null || v === undefined ? "" : String(v)}
                        onChange={(e) => handleNumberChange(def, e.target.value)}
                        placeholder={fieldName}
                        className="h-12 flex-1 rounded-2xl border-2 border-primary/40 bg-white/90 px-3 text-center text-lg font-bold text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-inner"
                      />
                      <button
                        type="button"
                        onClick={() => handleNumberStep(def, def.key === "annual_family_income" ? 10000 : def.key === "land_bigha" ? 0.5 : 1)}
                        className="btn-press flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-white/80 text-xl font-bold text-ink hover:bg-primary/10 shadow-sm"
                      >
                        +
                      </button>
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setEditing(null)}
                        className="btn-press rounded-xl bg-primary px-5 py-2 text-sm font-bold text-white shadow-sm shadow-primary/25 hover:bg-primary-hover"
                      >
                        {ctx.t("common.save")}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Chips for gender/marital/district/etc. Save immediately on click */
                  <div className="flex flex-wrap gap-2">
                    {def.options?.map((opt) => {
                      const optLabel = lang === "hi" ? opt.hi : opt.en;
                      const isSelected = v === opt.value;
                      return (
                        <button
                          key={String(opt.value)}
                          type="button"
                          onClick={() => handleChipSelect(def, opt.value)}
                          className={`btn-press rounded-xl px-3.5 py-2 text-sm font-semibold transition shadow-sm ${
                            isSelected
                              ? "bg-primary text-white shadow-primary/30"
                              : "border border-neutral/20 bg-white/70 text-ink hover:border-primary hover:bg-primary/10"
                          }`}
                        >
                          {optLabel}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
