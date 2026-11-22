"use client";

import Link from "next/link";
import { useLang, type Lang } from "@/components/LangProvider";

export interface MiddlemanAlertProps {
  scheme_id: string;
  lang?: Lang;
}

export default function MiddlemanAlert({ scheme_id }: MiddlemanAlertProps) {
  const { t } = useLang();

  return (
    <section
      role="note"
      aria-label={t("banner.free_notice")}
      className="glass-card rounded-3xl border border-amber-400/80 bg-amber-50/75 backdrop-blur-md p-6 shadow-glass space-y-4"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-800 text-lg font-bold">
          !
        </span>
        <p className="text-base sm:text-lg font-bold text-amber-950 pt-1 leading-snug">
          {t("banner.free_notice")}
        </p>
      </div>
      <Link
        href={`/report?scheme=${encodeURIComponent(scheme_id)}`}
        className="btn-press flex min-h-[56px] w-full items-center justify-center rounded-2xl bg-[#14211B] px-6 py-3.5 text-base sm:text-lg font-bold text-white shadow-md hover:bg-black transition-all"
      >
        {t("scheme.report")}
      </Link>
    </section>
  );
}
