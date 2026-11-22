"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLang } from "@/components/LangProvider";
import ResultCard from "@/components/ResultCard";
import type { SchemeMatch } from "@/lib/engine";
import type { Profile } from "@/lib/types";

const PROFILE_KEY = "sahayak_profile";
const MATCH_KEY = "sahayak_last_match";
const SKIPPED_KEY = "sahayak_skipped_fields";

function isBlankProfile(p: Profile | null): boolean {
  if (!p) return true;
  return Object.values(p).every((v) => v === null || v === undefined);
}

export default function SchemesPage() {
  const { t } = useLang();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [matches, setMatches] = useState<SchemeMatch[]>([]);
  const [skippedFields, setSkippedFields] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const rawProfile = window.sessionStorage.getItem(PROFILE_KEY);
      const parsedProfile: Profile | null = rawProfile ? JSON.parse(rawProfile) : null;
      setProfile(parsedProfile);

      const rawSkipped = window.sessionStorage.getItem(SKIPPED_KEY);
      if (rawSkipped) {
        try {
          const parsedSkipped = JSON.parse(rawSkipped);
          if (Array.isArray(parsedSkipped)) setSkippedFields(parsedSkipped);
        } catch {}
      }

      if (parsedProfile && !isBlankProfile(parsedProfile)) {
        const rawMatches = window.sessionStorage.getItem(MATCH_KEY);
        if (rawMatches) {
          const parsed = JSON.parse(rawMatches);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMatches(parsed);
            setLoading(false);
            return;
          }
        }

        // Otherwise fetch matches from API
        fetch("/api/match", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ profile: parsedProfile }),
        })
          .then((r) => r.json())
          .then((data) => {
            if (data?.matches && Array.isArray(data.matches)) {
              setMatches(data.matches);
              window.sessionStorage.setItem(MATCH_KEY, JSON.stringify(data.matches));
            }
          })
          .catch(() => {})
          .finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    } catch {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <section className="mx-auto max-w-3xl space-y-6 py-8">
        <h1 className="heading-1">{t("schemes.page_title")}</h1>
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-3xl glass-card" />
          ))}
        </div>
      </section>
    );
  }

  // If there is no profile yet, show "Tell us about yourself first" with a button to Home.
  if (!profile || isBlankProfile(profile)) {
    return (
      <section className="mx-auto max-w-2xl py-12 text-center animate-fade-in">
        <div className="glass-card rounded-3xl p-8 sm:p-12 shadow-glass border border-white/80 space-y-6 flex flex-col items-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 text-primary shadow-inner">
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" />
              <path strokeLinecap="round" d="M12 16v-4M12 8h.01" />
            </svg>
          </div>

          <div className="space-y-2">
            <h1 className="heading-1">{t("schemes.empty_title")}</h1>
            <p className="text-base sm:text-lg text-ink-secondary max-w-md mx-auto">
              {t("schemes.empty_subtitle")}
            </p>
          </div>

          <Link
            href="/"
            className="btn-press inline-flex min-h-[56px] items-center justify-center rounded-2xl bg-gradient-to-r from-primary to-emerald-700 px-8 py-3.5 text-base sm:text-lg font-bold text-white shadow-md shadow-primary/30 hover:opacity-95"
          >
            {t("schemes.go_home")}
          </Link>
        </div>
      </section>
    );
  }

  // If a profile exists, show the match results (green/amber/grey cards)
  const likely = matches.filter((m) => m.status === "LIKELY_ELIGIBLE");
  const needInfo = matches.filter((m) => m.status === "NEED_MORE_INFO");
  const notEligible = matches.filter((m) => m.status === "NOT_ELIGIBLE");

  return (
    <section className="mx-auto max-w-3xl space-y-8 py-4 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="heading-1">{t("schemes.page_title")}</h1>
        <Link
          href="/"
          className="btn-press rounded-full border border-primary/30 bg-white/70 px-4 py-2 text-sm font-bold text-primary hover:bg-white shadow-sm"
        >
          {t("schemes.edit_profile")}
        </Link>
      </div>

      {/* Summary Banner */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 shadow-glass border border-white/80 space-y-4">
        <p className="text-xl sm:text-2xl font-extrabold text-ink">
          {t("results.title", { count: likely.length })}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="glass-subtle rounded-2xl p-4 text-center border-l-4 border-l-success">
            <span className="text-2xl sm:text-3xl font-extrabold text-success block">
              {likely.length}
            </span>
            <span className="text-xs sm:text-sm font-bold text-ink-secondary">
              {t("results.likely")}
            </span>
          </div>
          <div className="glass-subtle rounded-2xl p-4 text-center border-l-4 border-l-warning">
            <span className="text-2xl sm:text-3xl font-extrabold text-warning block">
              {needInfo.length}
            </span>
            <span className="text-xs sm:text-sm font-bold text-ink-secondary">
              {t("results.need_info")}
            </span>
          </div>
          <div className="glass-subtle rounded-2xl p-4 text-center border-l-4 border-l-neutral">
            <span className="text-2xl sm:text-3xl font-extrabold text-neutral block">
              {notEligible.length}
            </span>
            <span className="text-xs sm:text-sm font-bold text-ink-secondary">
              {t("results.not_eligible")}
            </span>
          </div>
        </div>
      </div>

      {matches.length === 0 && (
        <div className="glass-card text-center p-8 rounded-3xl">
          <p className="text-ink-secondary text-lg">{t("results.no_schemes")}</p>
        </div>
      )}

      {/* 2-column grid for schemes */}
      {likely.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="h-3.5 w-3.5 rounded-full bg-success" />
            <h2 className="heading-3">{t("results.likely")}</h2>
            <span className="rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-bold text-success">
              {likely.length}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {likely.map((m) => (
              <ResultCard key={m.scheme.id} match={m} skippedFields={skippedFields} />
            ))}
          </div>
        </div>
      )}

      {needInfo.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="h-3.5 w-3.5 rounded-full bg-warning" />
            <h2 className="heading-3">{t("results.need_info")}</h2>
            <span className="rounded-full bg-warning/15 px-2.5 py-0.5 text-xs font-bold text-warning">
              {needInfo.length}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {needInfo.map((m) => (
              <ResultCard key={m.scheme.id} match={m} skippedFields={skippedFields} />
            ))}
          </div>
        </div>
      )}

      {notEligible.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="h-3.5 w-3.5 rounded-full bg-neutral" />
            <h2 className="heading-3">{t("results.not_eligible")}</h2>
            <span className="rounded-full bg-neutral/15 px-2.5 py-0.5 text-xs font-bold text-neutral">
              {notEligible.length}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {notEligible.map((m) => (
              <ResultCard key={m.scheme.id} match={m} skippedFields={skippedFields} />
            ))}
          </div>
        </div>
      )}

      <div className="pt-4">
        <Link
          href="/"
          className="btn-press flex min-h-[56px] w-full items-center justify-center rounded-2xl border border-primary/30 bg-white/80 px-6 py-4 text-base sm:text-lg font-bold text-primary hover:bg-white shadow-sm transition"
        >
          {t("results.start_over")}
        </Link>
      </div>
    </section>
  );
}
