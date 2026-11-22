"use client";

import { useLang } from "@/components/LangProvider";
import PrintButton from "@/components/PrintButton";
import type { Scheme } from "@/lib/types";

export default function ParchiView({ scheme }: { scheme: Scheme }) {
  const { lang, t } = useLang();
  const schemeName = lang === "hi" ? scheme.name_hi : scheme.name_en;

  return (
    <main className="mx-auto max-w-2xl p-4 space-y-4">
      <div className="print:hidden flex justify-end">
        <PrintButton />
      </div>

      <div className="print-only-slip bg-white text-black p-6 border-2 border-black space-y-4">
        <h1 className="text-2xl font-bold">{t("parchi.title")}</h1>

        <div>
          <p className="text-xl font-semibold">{schemeName}</p>
        </div>

        <div>
          <h2 className="font-semibold">{t("parchi.documents")}</h2>
          <ul className="space-y-1">
            {scheme.documents.map((d, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="inline-block w-4 h-4 border border-black" aria-hidden="true" />
                <span>{lang === "hi" ? d.name_hi : d.name_en}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="font-semibold">{t("parchi.steps")}</h2>
          <ol className="list-decimal pl-6 space-y-1">
            {scheme.apply_steps.map((s, i) => (
              <li key={i}>{lang === "hi" ? s.hi : s.en}</li>
            ))}
          </ol>
        </div>

        <div>
          <p>
            {t("parchi.official_site")}: {scheme.official_url}
          </p>
          {scheme.verification_status === "verified" && scheme.last_verified && (
            <p>
              {t("parchi.last_verified")}: {scheme.last_verified}
            </p>
          )}
        </div>

        <div className="text-sm border-t border-black pt-2 space-y-1">
          <p>{t("footer.decision")}</p>
          <p>{t("banner.free_notice")}</p>
        </div>
      </div>
    </main>
  );
}
