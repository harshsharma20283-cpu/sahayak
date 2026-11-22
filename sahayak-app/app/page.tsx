"use client";

import { useEffect, useRef, useState } from "react";
import { useLang } from "@/components/LangProvider";
import FollowUp from "@/components/FollowUp";
import KeypadSim from "@/components/KeypadSim";
import ProfileChips, { type ChipField } from "@/components/ProfileChips";
import ResultCard from "@/components/ResultCard";
import type { SchemeMatch } from "@/lib/engine";
import { nextQuestionField, askableMissingFields } from "@/lib/engine";
import { questionFor } from "@/lib/questions";
import type { Profile } from "@/lib/types";

type SpeechResultEvent = {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
};

type SpeechRec = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: SpeechResultEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechCtor = new () => SpeechRec;

const PROFILE_KEY = "sahayak_profile";
const MATCH_KEY = "sahayak_last_match";
const SKIPPED_KEY = "sahayak_skipped_fields";

type Stage = "welcome" | "extracting" | "confirm" | "matching" | "followup" | "results";

type ApiResult = { ok: true; data: unknown } | { ok: false };

async function postJson(url: string, body: unknown): Promise<ApiResult> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return { ok: false };
    return { ok: true, data: await res.json() };
  } catch {
    return { ok: false };
  }
}

function getSpeechCtor(): SpeechCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechCtor;
    webkitSpeechRecognition?: SpeechCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function extractedProfile(data: unknown): Profile | null {
  if (typeof data !== "object" || data === null) return null;
  const p = (data as { profile?: unknown }).profile;
  return typeof p === "object" && p !== null ? (p as Profile) : null;
}

function valueOf(p: Profile, field: string): unknown {
  return (p as unknown as Record<string, unknown>)[field];
}

function isEmpty(v: unknown): boolean {
  return v === null || v === undefined;
}

function saveMatches(matches: SchemeMatch[]) {
  try {
    window.sessionStorage.setItem(MATCH_KEY, JSON.stringify(matches));
  } catch {
    // storage unavailable
  }
}

function saveProfile(p: Profile) {
  try {
    window.sessionStorage.setItem(PROFILE_KEY, JSON.stringify(p));
  } catch {
    // storage unavailable
  }
}

function saveSkipped(skipped: string[]) {
  try {
    window.sessionStorage.setItem(SKIPPED_KEY, JSON.stringify(skipped));
  } catch {
    // storage unavailable
  }
}

function Waveform() {
  return (
    <div className="flex items-center justify-center gap-1.5 py-1" aria-hidden="true">
      <span className="h-4 w-1 animate-pulse rounded-full bg-danger [animation-delay:0ms]" />
      <span className="h-7 w-1 animate-pulse rounded-full bg-danger [animation-delay:150ms]" />
      <span className="h-10 w-1 animate-pulse rounded-full bg-danger [animation-delay:300ms]" />
      <span className="h-6 w-1 animate-pulse rounded-full bg-danger [animation-delay:450ms]" />
      <span className="h-8 w-1 animate-pulse rounded-full bg-danger [animation-delay:200ms]" />
      <span className="h-4 w-1 animate-pulse rounded-full bg-danger [animation-delay:100ms]" />
    </div>
  );
}

export default function WelcomePage() {
  const { lang, t } = useLang();
  const [text, setText] = useState("");
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState<boolean | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const recRef = useRef<SpeechRec | null>(null);

  const [stage, setStage] = useState<Stage>("welcome");
  const [failed, setFailed] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [followField, setFollowField] = useState<string | null>(null);
  const [askedFields, setAskedFields] = useState<string[]>([]);
  const [skippedFields, setSkippedFields] = useState<string[]>([]);
  const [totalQuestionsTarget, setTotalQuestionsTarget] = useState<number>(1);
  const [matches, setMatches] = useState<SchemeMatch[]>([]);
  const retryRef = useRef<(() => void) | null>(null);

  const sampleButtons = [
    {
      avatar: "👵",
      label: t("home.sample_1_label"),
      text: t("home.sample_1_text"),
    },
    {
      avatar: "👴",
      label: t("home.sample_2_label"),
      text: t("home.sample_2_text"),
    },
    {
      avatar: "👩‍👧‍👦",
      label: t("home.sample_3_label"),
      text: t("home.sample_3_text"),
    },
    {
      avatar: "🌾",
      label: t("home.sample_4_label"),
      text: t("home.sample_4_text"),
    },
    {
      avatar: "💬",
      label: t("home.sample_5_label"),
      text: t("home.sample_5_text"),
    },
  ];

  useEffect(() => {
    setSupported(getSpeechCtor() !== null);
    return () => {
      recRef.current?.stop();
    };
  }, []);

  async function runExtract(input: string) {
    retryRef.current = () => void runExtract(input);
    setFailed(false);
    setStage("extracting");
    const res = await postJson("/api/profile/extract", { text: input, lang });
    const p = res.ok ? extractedProfile(res.data) : null;
    if (!p) {
      setFailed(true);
      setStage("welcome");
      return;
    }
    setAskedFields([]);
    setSkippedFields([]);
    setMatches([]);
    setProfile(p);
    saveProfile(p);
    setStage("confirm");
  }

  async function runMatch(p: Profile, currentAsked: string[], currentSkipped: string[] = skippedFields) {
    retryRef.current = () => void runMatch(p, currentAsked, currentSkipped);
    setFailed(false);
    setProfile(p);
    saveProfile(p);
    setStage("matching");

    const res = await postJson("/api/match", { profile: p, asked_fields: currentAsked });
    const data = res.ok
      ? (res.data as { matches?: SchemeMatch[]; next_question_field?: string | null } | null)
      : null;
    if (!data || !Array.isArray(data.matches)) {
      setFailed(true);
      setStage("confirm");
      return;
    }

    const matchList = data.matches;
    setMatches(matchList);

    // Pick next missing field that unlocks the most schemes and has NOT been asked yet
    const next = nextQuestionField(matchList, currentAsked);
    const askable =
      next !== null &&
      questionFor(next) !== null &&
      isEmpty(valueOf(p, next)) &&
      !currentAsked.includes(next);

    setAskedFields(currentAsked);

    if (next !== null && askable) {
      const remainingAskable = askableMissingFields(matchList, currentAsked).filter((f) => questionFor(f) !== null);
      const total = currentAsked.length + remainingAskable.length;
      setTotalQuestionsTarget(Math.max(total, currentAsked.length + 1));
      setFollowField(next);
      setStage("followup");
      return;
    }

    saveMatches(matchList);
    saveSkipped(currentSkipped);
    setStage("results");
  }

  function answerFollowUp(value: unknown) {
    if (!profile || !followField) return;

    const nextAsked = [...askedFields, followField];
    let nextSkipped = skippedFields;

    const nextProfile = { ...profile, [followField]: value } as Profile;

    if (value === null) {
      nextSkipped = [...skippedFields, followField];
      setSkippedFields(nextSkipped);
    }

    void runMatch(nextProfile, nextAsked, nextSkipped);
  }

  function showResults() {
    saveMatches(matches);
    saveSkipped(skippedFields);
    setStage("results");
  }

  function changeField(field: ChipField, value: Profile[ChipField]) {
    setProfile((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, [field]: value } as Profile;
      saveProfile(updated);
      return updated;
    });
  }

  function startOver() {
    setStage("welcome");
    setFailed(false);
    setProfile(null);
    setMatches([]);
    setAskedFields([]);
    setSkippedFields([]);
    setFollowField(null);
  }

  function startListening() {
    const Ctor = getSpeechCtor();
    if (!Ctor) {
      setNotice(t("home.mic_unsupported"));
      return;
    }
    const errorMessage = t("home.mic_error");
    try {
      const rec = new Ctor();
      rec.lang = lang === "hi" ? "hi-IN" : "en-IN";
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      rec.onresult = (e) => {
        const transcript = e.results[0]?.[0]?.transcript ?? "";
        setText(transcript);
        setNotice(null);
      };
      rec.onerror = () => {
        setListening(false);
        setNotice(errorMessage);
      };
      rec.onend = () => setListening(false);
      recRef.current = rec;
      setNotice(null);
      setListening(true);
      rec.start();
    } catch {
      setListening(false);
      setNotice(errorMessage);
    }
  }

  function stopListening() {
    recRef.current?.stop();
    setListening(false);
  }

  const likely = matches.filter((m) => m.status === "LIKELY_ELIGIBLE");
  const needInfo = matches.filter((m) => m.status === "NEED_MORE_INFO");
  const notEligible = matches.filter((m) => m.status === "NOT_ELIGIBLE");

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 py-2">
      {stage === "welcome" && (
        <div className="space-y-8 animate-fade-in">
          {/* Hero Header */}
          <div className="space-y-3 text-center">
            <h1 className="heading-1">
              {t("app.name")}
            </h1>
            <p className="text-xl sm:text-2xl font-bold text-primary">
              {t("app.tagline")}
            </p>
            <p className="text-base sm:text-lg text-ink-secondary max-w-xl mx-auto leading-relaxed">
              {t("app.subtitle")}
            </p>
          </div>

          {/* Liquid Glass Mic Hero */}
          <div className="flex flex-col items-center gap-4 py-2">
            <div className="relative flex items-center justify-center">
              {/* Outer Pulsing Glow Wave */}
              <span
                aria-hidden="true"
                className={`absolute inline-flex h-36 w-36 rounded-full transition-all duration-300 ${
                  listening
                    ? "animate-ping bg-danger/40 opacity-75"
                    : "bg-primary/20 animate-pulse opacity-50"
                }`}
              />

              {/* 120px Circular Mic Button */}
              <button
                type="button"
                aria-label={t("home.mic_tap_to_speak")}
                onClick={listening ? stopListening : startListening}
                className={`btn-press relative flex h-[120px] w-[120px] items-center justify-center rounded-full text-white shadow-glass transition-all duration-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/40 ${
                  listening
                    ? "bg-gradient-to-tr from-rose-600 to-red-600 shadow-[0_0_36px_rgba(220,38,38,0.5)] scale-105"
                    : "bg-gradient-to-tr from-primary via-[#1F6F4A] to-emerald-600 shadow-glow hover:scale-105 hover:shadow-[0_0_36px_rgba(31,111,74,0.45)]"
                }`}
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className={`h-12 w-12 transition-transform ${listening ? "scale-110" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.2}
                >
                  <rect x="9" y="3" width="6" height="11" rx="3" />
                  <path strokeLinecap="round" d="M5 11a7 7 0 0014 0M12 18v3" />
                </svg>
              </button>
            </div>

            {listening ? (
              <div className="flex flex-col items-center gap-1.5">
                <Waveform />
                <p aria-live="polite" className="text-lg font-bold text-danger animate-pulse">
                  {t("home.mic_listening")}
                </p>
              </div>
            ) : (
              <p className="text-base sm:text-lg font-bold text-primary">
                {t("home.mic_tap_to_speak")}
              </p>
            )}

            {supported === false && (
              <p className="text-sm font-semibold text-warning text-center bg-amber-50 px-4 py-1.5 rounded-full border border-warning/30">
                {t("home.mic_unsupported")}
              </p>
            )}
            {notice && (
              <p role="alert" className="text-sm font-semibold text-danger text-center bg-red-50 px-4 py-1.5 rounded-full border border-danger/30">
                {notice}
              </p>
            )}
          </div>

          {/* 5 Tappable Sample Profile Cards directly under mic */}
          <div className="space-y-3">
            <p className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-ink-secondary text-center">
              {t("home.samples_heading")}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {sampleButtons.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setText(sample.text)}
                  className="glass-hover glass-card text-left p-4 rounded-2xl border border-white/80 shadow-glass flex items-start gap-3 group focus:outline-none focus-visible:ring-3 focus-visible:ring-primary"
                >
                  <span className="text-2xl shrink-0 p-1.5 rounded-xl bg-white/70 shadow-xs group-hover:scale-110 transition-transform">
                    {sample.avatar}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-primary block text-sm sm:text-base leading-snug group-hover:underline">
                      {sample.label}
                    </span>
                    <span className="text-xs text-ink-secondary line-clamp-2 mt-0.5 leading-relaxed">
                      {sample.text}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Text Area Card with Send inside */}
          <div className="glass-card shadow-glass p-5 sm:p-6 space-y-4 rounded-3xl border border-white/80">
            <div className="relative">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={t("home.textarea_placeholder")}
                rows={3}
                className="w-full rounded-2xl border border-black/10 bg-white/90 p-4 text-base sm:text-lg text-ink placeholder:text-neutral/70 focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary/20 shadow-inner resize-none"
              />
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-ink-secondary">
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-primary" fill="none" stroke="currentColor" strokeWidth={2}>
                  <rect x="5" y="11" width="14" height="10" rx="2" />
                  <path strokeLinecap="round" d="M8 11V7a4 4 0 018 0v4" />
                </svg>
                <span>{t("home.no_aadhaar")}</span>
              </div>
              <button
                type="button"
                onClick={() => void runExtract(text)}
                disabled={text.trim() === ""}
                className="btn-press min-h-[56px] w-full sm:w-auto sm:min-w-[160px] rounded-2xl bg-gradient-to-r from-primary to-emerald-700 px-6 py-3.5 text-base sm:text-lg font-bold text-white shadow-md shadow-primary/30 hover:opacity-95 disabled:opacity-50"
              >
                {t("home.proceed")}
              </button>
            </div>
          </div>

          <KeypadSim />

          {/* 3-Step Strip: How Sahayak Works */}
          <div className="space-y-4 pt-4 border-t border-black/5">
            <h2 className="text-center text-lg sm:text-xl font-bold text-ink">
              {t("home.how_it_works")}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="glass-card text-center p-5 rounded-2xl border border-white/70 shadow-sm flex flex-col items-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary font-extrabold text-xl mb-3 shadow-xs">
                  1
                </span>
                <p className="font-bold text-ink text-base">{t("home.step1_title")}</p>
                <p className="text-xs sm:text-sm text-ink-secondary mt-1">{t("home.step1_desc")}</p>
              </div>

              <div className="glass-card text-center p-5 rounded-2xl border border-white/70 shadow-sm flex flex-col items-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary font-extrabold text-xl mb-3 shadow-xs">
                  2
                </span>
                <p className="font-bold text-ink text-base">{t("home.step2_title")}</p>
                <p className="text-xs sm:text-sm text-ink-secondary mt-1">{t("home.step2_desc")}</p>
              </div>

              <div className="glass-card text-center p-5 rounded-2xl border border-white/70 shadow-sm flex flex-col items-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary font-extrabold text-xl mb-3 shadow-xs">
                  3
                </span>
                <p className="font-bold text-ink text-base">{t("home.step3_title")}</p>
                <p className="text-xs sm:text-sm text-ink-secondary mt-1">{t("home.step3_desc")}</p>
              </div>
            </div>

            {/* Trust Badges Row */}
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 pt-2">
              <span className="glass-pill px-4 py-2 text-xs sm:text-sm font-semibold text-ink-secondary flex items-center gap-1.5 shadow-xs">
                <span className="text-success font-bold">✓</span>
                {t("home.trust_free")}
              </span>
              <span className="glass-pill px-4 py-2 text-xs sm:text-sm font-semibold text-ink-secondary flex items-center gap-1.5 shadow-xs">
                <span className="text-success font-bold">✓</span>
                {t("home.trust_no_aadhaar")}
              </span>
              <span className="glass-pill px-4 py-2 text-xs sm:text-sm font-semibold text-ink-secondary flex items-center gap-1.5 shadow-xs">
                <span className="text-success font-bold">✓</span>
                {t("home.trust_offline")}
              </span>
              <span className="glass-pill px-4 py-2 text-xs sm:text-sm font-semibold text-ink-secondary flex items-center gap-1.5 shadow-xs">
                <span className="text-success font-bold">✓</span>
                {t("home.trust_fast")}
              </span>
            </div>
          </div>
        </div>
      )}

      {failed && (
        <div role="alert" className="space-y-4 rounded-3xl border-2 border-danger/80 bg-red-50/90 backdrop-blur-md p-6 shadow-sm">
          <p className="font-bold text-danger text-lg">{t("error.something_went_wrong")}</p>
          <button
            type="button"
            onClick={() => retryRef.current?.()}
            className="btn-press min-h-[56px] w-full rounded-2xl bg-danger px-6 py-3.5 font-bold text-white shadow-md shadow-danger/25"
          >
            {t("error.retry")}
          </button>
        </div>
      )}

      {(stage === "extracting" || stage === "matching") && (
        <div aria-busy="true" aria-live="polite" className="glass-card rounded-3xl p-8 space-y-5 text-center shadow-glass">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
            <span className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
          <p className="text-xl font-bold text-primary">
            {stage === "extracting"
              ? t("home.extracting")
              : t("home.matching")}
          </p>
          <div className="space-y-3 max-w-md mx-auto pt-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-2xl bg-primary/10" />
            ))}
          </div>
        </div>
      )}

      {stage === "confirm" && profile && (
        <div className="space-y-6 animate-fade-in">
          <div className="space-y-1.5 text-center sm:text-left">
            <h2 className="heading-2">
              {t("confirm.title")}
            </h2>
            <p className="text-base sm:text-lg text-ink-secondary">
              {t("confirm.subtitle")}
            </p>
          </div>

          {/* 2-Column Desktop Grid for Profile Chips */}
          <ProfileChips profile={profile} onChange={changeField} />

          <div className="space-y-3 pt-4">
            <button
              type="button"
              onClick={() => void runMatch(profile, askedFields, skippedFields)}
              className="btn-press min-h-[56px] w-full rounded-2xl bg-gradient-to-r from-primary to-emerald-700 px-6 py-4 text-lg font-bold text-white shadow-md shadow-primary/30 hover:opacity-95"
            >
              {t("confirm.proceed")}
            </button>
            <button
              type="button"
              onClick={startOver}
              className="btn-press min-h-[50px] w-full rounded-2xl border border-neutral/30 bg-white/70 px-4 py-2.5 font-bold text-primary hover:bg-white transition"
            >
              {t("confirm.back")}
            </button>
          </div>
        </div>
      )}

      {stage === "followup" && followField && (
        <div className="space-y-6 animate-fade-in">
          {/* Progress Header: Question X of Y */}
          <div className="glass-card rounded-2xl p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-sm font-extrabold text-primary">
                {askedFields.length + 1}
              </span>
              <span className="text-sm sm:text-base font-bold text-ink">
                {t("followup.progress", {
                  current: askedFields.length + 1,
                  total: totalQuestionsTarget,
                })}
              </span>
            </div>
            <button
              type="button"
              onClick={showResults}
              className="text-sm font-bold text-primary underline hover:text-primary-hover"
            >
              {t("followup.skip_show_results")}
            </button>
          </div>

          {/* Follow-up question component */}
          <FollowUp field={followField} onAnswer={answerFollowUp} />

          {/* Skip, show results button */}
          <button
            type="button"
            onClick={showResults}
            className="btn-press min-h-[56px] w-full rounded-2xl border border-primary/30 bg-white/70 px-6 py-3.5 font-bold text-primary hover:bg-white shadow-sm transition"
          >
            {t("followup.skip_show_results")}
          </button>
        </div>
      )}

      {stage === "results" && (
        <div className="space-y-8 animate-fade-in">
          {/* Summary Banner with 3 Stat Pills */}
          <div className="glass-card rounded-3xl p-6 sm:p-8 shadow-glass border border-white/80 space-y-4">
            <h1 className="heading-2 text-center sm:text-left">
              {t("results.title", { count: likely.length })}
            </h1>
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

          {/* Group 1: Likely Eligible */}
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

          {/* Group 2: Need More Info */}
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

          {/* Group 3: Not Eligible */}
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

          {matches.length === 0 && (
            <div className="glass-card text-center p-8 rounded-3xl">
              <p className="text-neutral text-lg">{t("results.no_schemes")}</p>
            </div>
          )}

          <div className="pt-4">
            <button
              type="button"
              onClick={startOver}
              className="btn-press min-h-[56px] w-full rounded-2xl border border-primary/40 bg-white/80 px-6 py-4 text-base sm:text-lg font-bold text-primary hover:bg-white shadow-sm transition"
            >
              {t("results.start_over")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
