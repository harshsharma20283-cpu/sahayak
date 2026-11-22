"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useLang } from "@/components/LangProvider";

type ApplicationStatus =
  | "SUBMITTED"
  | "IN_REVIEW"
  | "ACTION_NEEDED"
  | "APPROVED"
  | "REJECTED";

interface Application {
  id: string;
  scheme_id: string;
  scheme_name_hi: string;
  scheme_name_en: string;
  reference_number: string | null;
  status: ApplicationStatus;
  applied_at: string;
  notes: string | null;
}

const STATUS_KEYS: Record<ApplicationStatus, string> = {
  SUBMITTED: "applications.status_submitted",
  IN_REVIEW: "applications.status_in_review",
  ACTION_NEEDED: "applications.status_action_needed",
  APPROVED: "applications.status_approved",
  REJECTED: "applications.status_rejected",
};

const STATUS_THEME: Record<
  ApplicationStatus,
  { dot: string; glow: string; badge: string; text: string }
> = {
  SUBMITTED: {
    dot: "bg-primary",
    glow: "shadow-[0_0_12px_rgba(31,111,74,0.6)]",
    badge: "bg-primary/10 border-primary/20",
    text: "text-primary",
  },
  IN_REVIEW: {
    dot: "bg-warning animate-pulse",
    glow: "shadow-[0_0_12px_rgba(217,119,6,0.6)]",
    badge: "bg-amber-100/80 border-amber-300/40",
    text: "text-amber-900",
  },
  ACTION_NEEDED: {
    dot: "bg-amber-600 animate-ping",
    glow: "shadow-[0_0_12px_rgba(217,119,6,0.8)]",
    badge: "bg-amber-100/90 border-amber-400",
    text: "text-amber-950 font-extrabold",
  },
  APPROVED: {
    dot: "bg-success",
    glow: "shadow-[0_0_12px_rgba(22,163,74,0.8)]",
    badge: "bg-emerald-100/90 border-emerald-300/60",
    text: "text-emerald-950 font-bold",
  },
  REJECTED: {
    dot: "bg-danger",
    glow: "shadow-[0_0_12px_rgba(220,38,38,0.6)]",
    badge: "bg-rose-100/80 border-rose-300/40",
    text: "text-rose-950",
  },
};

const ALL_STATUSES: ApplicationStatus[] = [
  "SUBMITTED",
  "IN_REVIEW",
  "ACTION_NEEDED",
  "APPROVED",
  "REJECTED",
];

function ApplicationsContent() {
  const { lang, t } = useLang();
  const searchParams = useSearchParams();
  const startSchemeId = searchParams.get("start");

  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setLoadError(false);
    try {
      const res = await fetch("/api/applications");
      if (!res.ok) throw new Error("bad status");
      const data = (await res.json()) as { applications: Application[] };
      setApps(data.applications);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (!startSchemeId) return;
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/applications", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ scheme_id: startSchemeId }),
        });
        if (!res.ok) return;
        if (active) void load();
      } catch {
        // silent start error
      }
    })();
    return () => {
      active = false;
    };
  }, [startSchemeId]);

  async function handleStatusChange(id: string, newStatus: ApplicationStatus) {
    setActionError(null);
    try {
      const res = await fetch("/api/applications", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (!res.ok) throw new Error("patch failed");
      const data = (await res.json()) as { application: Application };
      setApps((prev) => prev.map((a) => (a.id === id ? data.application : a)));
    } catch {
      setActionError(t("error.something_went_wrong"));
    }
  }

  return (
    <section className="mx-auto w-full max-w-3xl space-y-8 py-4 animate-fade-in">
      <div className="space-y-1">
        <h1 className="heading-1">{t("applications.title")}</h1>
      </div>

      {loadError && (
        <div className="space-y-3 rounded-3xl border-2 border-danger/80 bg-red-50/90 backdrop-blur-md p-6 shadow-sm">
          <p className="font-bold text-danger">
            {t("applications.load_error")}
          </p>
          <button
            type="button"
            onClick={load}
            className="btn-press min-h-[48px] rounded-2xl bg-primary px-6 font-bold text-white shadow-sm"
          >
            {t("applications.retry")}
          </button>
        </div>
      )}

      {actionError && (
        <p role="alert" className="text-sm font-semibold text-danger bg-red-50 p-3 rounded-2xl border border-danger/30">
          {actionError}
        </p>
      )}

      {loading && (
        <div className="space-y-4">
          {[0, 1].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-3xl glass-card" />
          ))}
        </div>
      )}

      {!loading && apps.length === 0 && !loadError && (
        <div className="glass-card rounded-3xl p-8 sm:p-12 shadow-glass border border-white/80 space-y-5 text-center flex flex-col items-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 text-primary shadow-inner">
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 3h9l3 3v15H6zM9 12h6M9 16h6" />
            </svg>
          </div>
          <div className="space-y-1.5">
            <p className="heading-2">{t("applications.empty_title")}</p>
            <p className="text-base sm:text-lg text-ink-secondary max-w-md mx-auto">{t("applications.empty_subtitle")}</p>
          </div>
          <div className="pt-2">
            <Link
              href="/schemes"
              className="btn-press inline-flex min-h-[56px] items-center justify-center rounded-2xl bg-gradient-to-r from-primary to-emerald-700 px-8 py-3.5 text-base sm:text-lg font-bold text-white shadow-md shadow-primary/30"
            >
              {t("applications.start_new")}
            </Link>
          </div>
        </div>
      )}

      {!loading && apps.length > 0 && (
        <ul className="space-y-5">
          {apps.map((app) => {
            const schemeName = lang === "hi" ? app.scheme_name_hi : app.scheme_name_en;
            const theme = STATUS_THEME[app.status] ?? STATUS_THEME.SUBMITTED;

            return (
              <li key={app.id} className="glass-hover glass-card rounded-3xl p-6 sm:p-7 shadow-glass border border-white/80 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <h2 className="text-xl sm:text-2xl font-extrabold text-ink">{schemeName}</h2>
                    {app.reference_number && (
                      <p className="text-sm font-semibold text-ink-secondary">
                        {t("applications.ref_number")}: <span className="font-mono text-ink">{app.reference_number}</span>
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs sm:text-sm font-bold border shadow-xs ${theme.badge} ${theme.text}`}
                    >
                      <span className={`h-2.5 w-2.5 rounded-full ${theme.dot} ${theme.glow}`} />
                      {t(STATUS_KEYS[app.status])}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end border-t border-black/5 pt-4">
                  <div className="space-y-1.5">
                    <label htmlFor={`status-${app.id}`} className="block text-xs font-extrabold uppercase tracking-wider text-ink-secondary">
                      {t("applications.update_status")}
                    </label>
                    <select
                      id={`status-${app.id}`}
                      value={app.status}
                      onChange={(e) => void handleStatusChange(app.id, e.target.value as ApplicationStatus)}
                      className="min-h-[48px] w-full rounded-2xl border border-black/10 bg-white/90 px-4 text-sm sm:text-base font-semibold text-ink focus:border-primary focus:outline-none shadow-sm cursor-pointer"
                    >
                      {ALL_STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {t(STATUS_KEYS[st])}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex justify-end">
                    <Link
                      href={`/scheme/${app.scheme_id}`}
                      className="btn-press inline-flex min-h-[48px] items-center gap-1.5 rounded-2xl border border-primary/30 bg-white/80 px-5 py-2.5 text-sm sm:text-base font-bold text-primary hover:bg-white shadow-xs"
                    >
                      <span>{t("results.view_details")}</span>
                      <span>→</span>
                    </Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div>
        <Link
          href="/"
          className="btn-press inline-flex min-h-[46px] items-center gap-2 rounded-full border border-primary/30 bg-white/70 px-5 py-2 text-base font-bold text-primary hover:bg-white shadow-sm"
        >
          ← {t("scheme.back")}
        </Link>
      </div>
    </section>
  );
}

export default function ApplicationsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <ApplicationsContent />
    </Suspense>
  );
}
