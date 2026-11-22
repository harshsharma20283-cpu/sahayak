"use client";

import { useLang, type Lang } from "@/components/LangProvider";

interface SourceItem {
  name: string;
  url: string;
  amount_shown: string | null;
}

interface SourcePanelProps {
  sources: SourceItem[];
  lang?: Lang;
}

export default function SourcePanel({ sources }: SourcePanelProps) {
  const { t } = useLang();
  const distinctAmounts = new Set(
    sources.map((s) => s.amount_shown).filter((a): a is string => a !== null)
  );
  const amountsDiffer = distinctAmounts.size >= 2;

  return (
    <div className="glass-card rounded-3xl p-6 shadow-glass border border-white/80 space-y-3">
      <h3 className="heading-3">{t("scheme.sources_heading")}</h3>

      {amountsDiffer && (
        <p className="rounded-2xl bg-amber-50 border border-warning/40 p-3.5 text-sm font-bold text-amber-900">
          {t("scheme.sources_conflict")}
        </p>
      )}

      <ul className="space-y-2">
        {sources.map((s, i) => (
          <li key={`${s.url}-${i}`} className="flex items-center gap-2 text-sm sm:text-base">
            <span className="text-primary font-bold">↗</span>
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-primary underline hover:text-primary-hover truncate"
            >
              {s.name}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
