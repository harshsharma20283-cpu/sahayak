"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLang } from "@/components/LangProvider";

interface ImpactData {
  applications_started: number;
  schemes_matched: number;
  estimated_annual_benefit_rupees: number;
  sample: boolean;
  message: string;
}

export default function ImpactPage() {
  const { lang, t } = useLang();
  const [data, setData] = useState<ImpactData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  async function load() {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/impact");
      if (!res.ok) throw new Error("bad status");
      const d = (await res.json()) as ImpactData;
      setData(d);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <section className="mx-auto w-full max-w-3xl space-y-6 py-4 animate-fade-in">
      <div>
        <Link
          href="/"
          className="btn-press inline-flex min-h-[46px] items-center gap-2 rounded-full border border-primary/30 bg-white/70 px-5 py-2 text-base font-bold text-primary hover:bg-white shadow-sm"
        >
          ← {t("impact.back")}
        </Link>
      </div>

      <div className="glass-card rounded-3xl p-6 sm:p-8 shadow-glass border border-white/80 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/5 pb-4">
          <h1 className="heading-1">{t("impact.title")}</h1>
          {/* Sample Data Badge */}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100/90 border border-amber-300/60 px-3.5 py-1 text-xs sm:text-sm font-extrabold text-amber-900 shadow-xs">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            {t("admin.sample_badge")}
          </span>
        </div>

        {loading && (
          <div className="grid gap-4 sm:grid-cols-3 pt-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-black/5" />
            ))}
          </div>
        )}

        {error && (
          <div className="space-y-4 rounded-2xl bg-red-50/80 p-5 border border-danger/30">
            <p className="text-danger font-bold text-base">{t("impact.error")}</p>
            <button
              type="button"
              onClick={load}
              className="btn-press rounded-xl bg-primary px-5 py-2.5 font-bold text-white shadow-sm"
            >
              {t("impact.retry")}
            </button>
          </div>
        )}

        {data && !error && (
          <div className="grid gap-4 sm:grid-cols-3 pt-2">
            <div className="glass-subtle rounded-2xl p-5 border border-white/70 shadow-sm border-l-4 border-l-primary">
              <p className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-ink-secondary">
                {t("impact.apps_started")}
              </p>
              <p className="text-3xl sm:text-4xl font-extrabold text-ink mt-2">
                {data.applications_started}
              </p>
            </div>

            <div className="glass-subtle rounded-2xl p-5 border border-white/70 shadow-sm border-l-4 border-l-accent">
              <p className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-ink-secondary">
                {t("impact.schemes_matched")}
              </p>
              <p className="text-3xl sm:text-4xl font-extrabold text-ink mt-2">
                {data.schemes_matched}
              </p>
            </div>

            <div className="glass-subtle rounded-2xl p-5 border border-white/70 shadow-sm border-l-4 border-l-success">
              <p className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-ink-secondary">
                {t("impact.est_benefit")}
              </p>
              <p className="text-2xl sm:text-3xl font-extrabold text-primary mt-2">
                ₹{data.estimated_annual_benefit_rupees.toLocaleString(lang === "hi" ? "hi-IN" : "en-IN")}
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
