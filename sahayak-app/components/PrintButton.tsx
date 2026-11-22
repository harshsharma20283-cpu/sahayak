"use client";

import { useLang } from "@/components/LangProvider";

export default function PrintButton() {
  const { t } = useLang();
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="print:hidden rounded-lg border border-neutral/40 px-4 py-2 font-semibold text-ink hover:border-primary"
    >
      {t("parchi.print")}
    </button>
  );
}
