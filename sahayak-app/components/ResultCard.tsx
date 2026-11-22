"use client";

import Link from "next/link";
import { useLang, type Lang } from "@/components/LangProvider";
import type { SchemeMatch, SchemeStatus } from "@/lib/engine";

export interface ResultCardProps {
  match: SchemeMatch;
  lang?: Lang;
  skippedFields?: string[];
}

const STATUS_CONFIG: Record<
  SchemeStatus,
  {
    borderLeft: string;
    badgeBg: string;
    badgeText: string;
    dotColor: string;
    statusKey: string;
  }
> = {
  LIKELY_ELIGIBLE: {
    borderLeft: "border-l-success",
    badgeBg: "bg-emerald-100/80",
    badgeText: "text-emerald-900",
    dotColor: "bg-success",
    statusKey: "results.likely",
  },
  NEED_MORE_INFO: {
    borderLeft: "border-l-warning",
    badgeBg: "bg-amber-100/80",
    badgeText: "text-amber-900",
    dotColor: "bg-warning",
    statusKey: "results.need_info",
  },
  NOT_ELIGIBLE: {
    borderLeft: "border-l-neutral",
    badgeBg: "bg-neutral/15",
    badgeText: "text-neutral-800",
    dotColor: "bg-neutral",
    statusKey: "results.not_eligible",
  },
};

export default function ResultCard({ match, lang: langProp }: ResultCardProps) {
  const ctx = useLang();
  const lang = langProp ?? ctx.lang;
  const { scheme, status } = match;
  const config = STATUS_CONFIG[status];

  let detail: string | null = null;
  if (status === "NEED_MORE_INFO") {
    const missing = match.missing_fields;
    const hasMissingAge = missing.includes("age");

    if (missing.length === 1 && hasMissingAge) {
      detail = lang === "hi" ? "सटीक उम्र की पुष्टि चाहिए" : "need your exact age to confirm";
    } else if (missing.length > 0) {
      const fieldNames = missing.map((f) => {
        if (f === "age") return lang === "hi" ? "सटीक उम्र" : "exact age";
        return ctx.t(`fields.${f}`);
      });
      const prefix = lang === "hi" ? "ज़रूरी: " : "Need: ";
      detail = prefix + fieldNames.join(", ");
    }
  } else if (status === "NOT_ELIGIBLE") {
    const failing = match.rule_results.find((r) => r.result === "not_met");
    if (failing) {
      const ruleLabel = lang === "hi" ? failing.rule.label_hi : failing.rule.label_en;
      detail = `${ctx.t("results.not_met")}: ${ruleLabel}`;
    }
  }

  const schemeName = lang === "hi" ? scheme.name_hi : scheme.name_en;
  const benefitText = lang === "hi" ? scheme.benefit_text_hi : scheme.benefit_text_en;

  return (
    <Link
      href={`/scheme/${scheme.id}`}
      className={`glass-hover block min-h-[56px] rounded-3xl glass-card border border-white/80 p-5 sm:p-6 shadow-glass border-l-[6px] ${config.borderLeft} group focus:outline-none focus-visible:ring-3 focus-visible:ring-primary`}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${config.badgeBg} ${config.badgeText} shadow-xs`}
        >
          <span className={`h-2 w-2 rounded-full ${config.dotColor}`} />
          {ctx.t(config.statusKey)}
        </span>
      </div>

      <h3 className="mt-3 text-lg sm:text-xl font-extrabold text-ink group-hover:text-primary transition-colors">
        {schemeName}
      </h3>

      {benefitText && (
        <p className="mt-2 text-sm sm:text-base text-ink-secondary line-clamp-2 leading-relaxed">
          {benefitText}
        </p>
      )}

      {detail && (
        <div className="mt-3">
          <span className="inline-block text-xs sm:text-sm font-semibold text-amber-900 bg-amber-50/90 border border-amber-200/80 px-3 py-1 rounded-xl">
            {detail}
          </span>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-black/5 pt-3">
        <span className="text-sm font-bold text-primary group-hover:underline flex items-center gap-1">
          {ctx.t("results.view_details")}
          <span className="transition-transform group-hover:translate-x-1">→</span>
        </span>
        {scheme.fee && (
          <span className="text-xs font-medium text-ink-secondary bg-white/70 px-2.5 py-1 rounded-lg border border-neutral/20">
            {scheme.fee === "0" || scheme.fee.toLowerCase() === "free"
              ? (lang === "hi" ? "मुफ़्त" : "Free")
              : scheme.fee}
          </span>
        )}
      </div>
    </Link>
  );
}
