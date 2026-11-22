"use client";

import { useLang } from "@/components/LangProvider";

export default function TopBar() {
  const { t } = useLang();
  return (
    <div
      role="note"
      className="relative z-50 bg-[#165337] px-4 py-2 text-center text-sm font-medium text-white/95 shadow-sm transition-colors border-b border-white/10"
    >
      <div className="mx-auto flex max-w-[1080px] items-center justify-center gap-2">
        <span className="inline-block h-2 w-2 rounded-full bg-accent animate-pulse" />
        <span>{t("banner.demo")}</span>
      </div>
    </div>
  );
}
