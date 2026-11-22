"use client";

import Link from "next/link";
import { useLang } from "@/components/LangProvider";
import DocChecklist from "@/components/DocChecklist";
import MiddlemanAlert from "@/components/MiddlemanAlert";
import ReadAloud from "@/components/ReadAloud";
import RuleList from "@/components/RuleList";
import SourcePanel from "@/components/SourcePanel";
import type { Scheme } from "@/lib/types";

export default function SchemeView({ scheme }: { scheme: Scheme }) {
  const { lang, t } = useLang();

  const showVerifiedDate = scheme.verification_status === "verified" && !!scheme.last_verified;
  const schemeName = lang === "hi" ? scheme.name_hi : scheme.name_en;
  const benefitText = lang === "hi" ? scheme.benefit_text_hi : scheme.benefit_text_en;
  const feeText =
    scheme.fee === "0" || scheme.fee.toLowerCase() === "free"
      ? (lang === "hi" ? "मुफ़्त" : "Free")
      : scheme.fee;

  return (
    <article className="mx-auto w-full max-w-3xl space-y-6 py-4 animate-fade-in">
      {/* Back button pill */}
      <div>
        <Link
          href="/"
          className="btn-press inline-flex min-h-[46px] items-center gap-2 rounded-full border border-primary/30 bg-white/70 px-5 py-2 text-base font-bold text-primary hover:bg-white shadow-sm"
        >
          ← {t("scheme.back")}
        </Link>
      </div>

      {/* Scheme Header Card */}
      <header className="glass-card rounded-3xl p-6 sm:p-8 shadow-glass border border-white/80 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {showVerifiedDate ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100/90 px-3.5 py-1 text-xs sm:text-sm font-bold text-emerald-900 shadow-xs border border-emerald-200/60">
              <span className="h-2 w-2 rounded-full bg-success" />
              {t("scheme.verified")}: {scheme.last_verified}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral/15 px-3.5 py-1 text-xs sm:text-sm font-bold text-ink shadow-xs">
              {t("scheme.confirm_on_portal")}
            </span>
          )}
          <span className="inline-flex items-center rounded-full bg-white/80 px-3.5 py-1 text-xs sm:text-sm font-bold text-ink-secondary border border-neutral/20 shadow-xs">
            {t("scheme.fee")}: {feeText}
          </span>
        </div>

        <h1 className="heading-1">
          {schemeName}
        </h1>

        <div className="rounded-2xl glass-subtle p-4 border border-white/60">
          <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-ink-secondary mb-1">
            {t("scheme.benefit_heading")}
          </h2>
          <p className="text-base sm:text-lg text-ink font-semibold leading-relaxed">
            {benefitText}
          </p>
        </div>

        {/* Listen & Official Portal Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <ReadAloud
            text_hi={`${scheme.name_hi}। ${scheme.benefit_text_hi}`}
            text_en={`${scheme.name_en}. ${scheme.benefit_text_en}`}
          />
          <a
            href={scheme.official_url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-press flex min-h-[56px] items-center justify-center gap-2 rounded-2xl border border-primary/40 bg-white/80 px-5 py-3 font-bold text-primary hover:bg-white shadow-sm transition"
          >
            <span>{t("scheme.open_official")}</span>
            <span>↗</span>
          </a>
        </div>
      </header>

      {/* Eligibility Rules Checklist */}
      <section className="glass-card rounded-3xl p-6 sm:p-8 shadow-glass border border-white/80 space-y-4">
        <RuleList rules={scheme.rules} scheme_id={scheme.id} />
      </section>

      {/* Documents Required */}
      <section className="glass-card rounded-3xl p-6 sm:p-8 shadow-glass border border-white/80 space-y-4">
        <h2 className="heading-3">{t("scheme.documents_heading")}</h2>
        <DocChecklist scheme_id={scheme.id} documents={scheme.documents} />
      </section>

      {/* How to Apply Steps */}
      <section className="glass-card rounded-3xl p-6 sm:p-8 shadow-glass border border-white/80 space-y-4">
        <h2 className="heading-3">{t("scheme.apply_steps_heading")}</h2>
        {scheme.apply_steps.length === 0 ? (
          <p className="text-ink-secondary text-base">
            {t("scheme.no_steps")}
          </p>
        ) : (
          <ol className="space-y-3">
            {scheme.apply_steps.map((step, index) => (
              <li
                key={index}
                className="flex items-start gap-3.5 rounded-2xl glass-subtle p-4 border border-white/60 shadow-xs"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary text-white text-sm font-extrabold shadow-sm">
                  {index + 1}
                </span>
                <span className="text-base sm:text-lg text-ink font-medium pt-0.5 leading-relaxed">
                  {lang === "hi" ? step.hi : step.en}
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* Sources Panel */}
      {scheme.sources && scheme.sources.length > 0 && (
        <SourcePanel sources={scheme.sources} />
      )}

      {/* Anti-middleman Alert */}
      <MiddlemanAlert scheme_id={scheme.id} />

      {/* Sticky Bottom Bar with CTA */}
      <div className="sticky bottom-0 -mx-4 sm:mx-0 px-4 py-3 glass-strong rounded-3xl shadow-glass-strong border border-white/80 z-30">
        <Link
          href={`/applications?start=${encodeURIComponent(scheme.id)}`}
          className="btn-press flex min-h-[56px] w-full items-center justify-center rounded-2xl bg-gradient-to-r from-primary to-emerald-700 px-6 py-4 text-lg font-bold text-white shadow-md shadow-primary/30 hover:opacity-95"
        >
          {t("scheme.apply_now")}
        </Link>
      </div>
    </article>
  );
}
