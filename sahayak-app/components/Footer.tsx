"use client";

import Link from "next/link";
import { useLang } from "@/components/LangProvider";

export default function Footer() {
  const { t } = useLang();
  return (
    <footer className="mt-auto w-full max-w-[1080px] mx-auto px-4 sm:px-6 pb-24 sm:pb-8 pt-4">
      <div className="glass-subtle rounded-2xl px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left text-sm text-ink-secondary">
        <p className="max-w-xl text-xs sm:text-sm">
          {t("footer.decision")}
        </p>
        <div className="flex items-center gap-4 shrink-0">
          <Link
            href="/impact"
            className="font-semibold text-primary hover:underline hover:text-primary-hover text-sm"
          >
            {t("impact.title")}
          </Link>
          <span className="text-neutral/40">·</span>
          <Link
            href="/admin"
            className="font-semibold text-primary hover:underline hover:text-primary-hover text-sm"
          >
            {t("footer.sponsor_link")}
          </Link>
        </div>
      </div>
    </footer>
  );
}
