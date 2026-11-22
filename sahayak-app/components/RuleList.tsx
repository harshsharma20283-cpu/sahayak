"use client";

import { useEffect, useState } from "react";
import { useLang, type Lang } from "@/components/LangProvider";
import type { RuleResult, SchemeMatch } from "@/lib/engine";
import type { Rule } from "@/lib/types";

export interface RuleListProps {
  rule_results?: RuleResult[];
  rules?: Rule[];
  scheme_id?: string;
  lang?: Lang;
}

const STORAGE_KEY = "sahayak_last_match";

function fromRules(rules: Rule[]): RuleResult[] {
  return rules.map((rule) => ({ rule, result: "unknown" as const }));
}

function readStoredResults(schemeId: string): RuleResult[] | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const matches = JSON.parse(raw) as SchemeMatch[];
    if (!Array.isArray(matches)) return null;
    const found = matches.find((m) => m?.scheme?.id === schemeId);
    return found && Array.isArray(found.rule_results) ? found.rule_results : null;
  } catch {
    return null;
  }
}

function Mark({ result }: { result: RuleResult["result"] }) {
  if (result === "met") {
    return (
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-success shadow-xs">
        <svg aria-label="met" role="img" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12l4 4 10-10" />
        </svg>
      </span>
    );
  }
  if (result === "not_met") {
    return (
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100 text-danger shadow-xs">
        <svg aria-label="not met" role="img" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.8} strokeLinecap="round">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </span>
    );
  }
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-warning shadow-xs">
      <svg aria-label="unknown" role="img" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.8} strokeLinecap="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v4M12 16h.01" />
      </svg>
    </span>
  );
}

export default function RuleList({
  rule_results,
  rules,
  scheme_id,
}: RuleListProps) {
  const { lang, t } = useLang();
  const [list, setList] = useState<RuleResult[]>(() => {
    if (rule_results) return rule_results;
    if (rules) return fromRules(rules);
    return [];
  });

  useEffect(() => {
    if (rule_results) {
      setList(rule_results);
      return;
    }
    if (scheme_id) {
      const stored = readStoredResults(scheme_id);
      if (stored) {
        setList(stored);
        return;
      }
    }
    if (rules) setList(fromRules(rules));
  }, [rule_results, scheme_id, rules]);

  if (list.length === 0) return null;

  return (
    <section aria-labelledby="rules-heading" className="space-y-4">
      <h2 id="rules-heading" className="heading-3">
        {t("scheme.rules_heading")}
      </h2>
      <ul className="space-y-2.5">
        {list.map((item, idx) => {
          const label = lang === "hi" ? item.rule.label_hi : item.rule.label_en;
          return (
            <li
              key={`${item.rule.field}-${idx}`}
              className="flex items-center gap-3.5 rounded-2xl glass-subtle p-4 border border-white/60 shadow-xs"
            >
              <Mark result={item.result} />
              <span className="text-base sm:text-lg font-semibold text-ink leading-snug">
                {label}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
