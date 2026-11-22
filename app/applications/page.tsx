"use client";

import { useEffect, useState } from "react";

type AppStatus =
  | "saved"
  | "documents_ready"
  | "applied"
  | "under_review"
  | "approved"
  | "rejected";

interface Application {
  id: string;
  scheme_id: string;
  status: AppStatus;
  next_reminder_date?: string | null;
}

const STATUS_OPTIONS: { value: AppStatus; label: string }[] = [
  { value: "saved", label: "Saved (सेव किया)" },
  { value: "documents_ready", label: "Documents ready (दस्तावेज़ तैयार)" },
  { value: "applied", label: "Applied (आवेदन किया)" },
  { value: "under_review", label: "Under review (जाँच में)" },
  { value: "approved", label: "Approved (स्वीकृत)" },
  { value: "rejected", label: "Rejected (अस्वीकृत)" },
];

// Timeline stages in order. The last stage covers both final outcomes.
const TIMELINE: { key: string; label: string; statuses: AppStatus[] }[] = [
  { key: "saved", label: "Saved (सेव किया)", statuses: ["saved"] },
  { key: "docs", label: "Documents ready (दस्तावेज़ तैयार)", statuses: ["documents_ready"] },
  { key: "applied", label: "Applied (आवेदन किया)", statuses: ["applied"] },
  { key: "review", label: "Under review (जाँच में)", statuses: ["under_review"] },
  {
    key: "outcome",
    label: "Approved / Rejected (स्वीकृत / अस्वीकृत)",
    statuses: ["approved", "rejected"],
  },
];

function currentStageIndex(status: AppStatus): number {
  return TIMELINE.findIndex((t) => t.statuses.includes(status));
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/applications");
        if (!res.ok) {
          if (!cancelled) setError("Applications load nahi hue. (Could not load applications.)");
          return;
        }
        const data = await res.json();
        if (!cancelled) setApplications(data.applications ?? []);
      } catch {
        if (!cancelled) setError("Network error. (Network error.)");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleStatusChange(id: string, status: AppStatus) {
    setError(null);
    setSavingId(id);
    try {
      const res = await fetch("/api/applications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError("Status update nahi hua. (Status update failed.)");
        return;
      }
      const updated: Application = data.application;
      setApplications((prev) => prev.map((a) => (a.id === id ? { ...a, ...updated } : a)));
    } catch {
      setError("Network error. (Network error.)");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-4 text-lg">
      <div className="rounded-lg bg-amber-100 px-4 py-3 text-lg font-semibold text-amber-900">
        Demo with sample data (नमूना डेटा के साथ डेमो)
      </div>

      <h1 className="text-3xl font-bold">My applications (मेरे आवेदन)</h1>

      {error && (
        <p role="alert" className="rounded-lg bg-red-100 p-3 text-red-800">
          {error}
        </p>
      )}

      {loading && <p>Loading... (लोड हो रहा है...)</p>}

      {!loading && applications.length === 0 && !error && (
        <p>Abhi koi application nahi hai. (No applications yet.)</p>
      )}

      <ul className="space-y-5">
        {applications.map((app) => {
          const idx = currentStageIndex(app.status);
          const isFinal = app.status === "approved" || app.status === "rejected";
          return (
            <li key={app.id} className="space-y-4 rounded-xl bg-white p-5 shadow">
              <p className="text-xl font-bold">Scheme (योजना): {app.scheme_id}</p>
              <p>
                Status (स्थिति): <span className="font-semibold">{app.status}</span>
              </p>

              <ol className="space-y-2">
                {TIMELINE.map((stage, i) => {
                  const isCurrent = i === idx;
                  const isDone = idx >= 0 && i < idx;
                  const stageLabel =
                    stage.key === "outcome" && isCurrent
                      ? app.status === "approved"
                        ? "Approved (स्वीकृत)"
                        : "Rejected (अस्वीकृत)"
                      : stage.label;
                  return (
                    <li
                      key={stage.key}
                      aria-current={isCurrent ? "step" : undefined}
                      className={`flex min-h-[48px] items-center gap-3 rounded-lg px-3 py-2 ${
                        isCurrent
                          ? "bg-blue-700 font-bold text-white"
                          : isDone
                            ? "bg-green-100 text-green-900"
                            : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <span aria-hidden="true">{isCurrent ? "●" : isDone ? "✓" : "○"}</span>
                      <span>
                        {stageLabel}
                        {isCurrent && " — current (अभी)"}
                      </span>
                    </li>
                  );
                })}
              </ol>
              {idx < 0 && (
                <p className="text-base text-slate-600">
                  Unknown status (अज्ञात स्थिति): {app.status}
                </p>
              )}
              {isFinal && (
                <p className="text-base text-slate-600">Final outcome (अंतिम परिणाम) reached.</p>
              )}

              <div>
                <label htmlFor={`status-${app.id}`} className="block text-lg font-semibold">
                  Change status (स्थिति बदलें)
                </label>
                <select
                  id={`status-${app.id}`}
                  value={app.status}
                  disabled={savingId === app.id}
                  onChange={(e) => handleStatusChange(app.id, e.target.value as AppStatus)}
                  className="mt-1 w-full min-h-[48px] rounded-lg border-2 border-slate-400 bg-white px-3 py-2 text-lg"
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              {app.next_reminder_date && (
                <div className="rounded-lg border-2 border-orange-400 bg-orange-50 p-4">
                  <p className="text-lg font-bold text-orange-900">
                    Reminder (याद दिलाना): Documents due in 3 days (दस्तावेज़ 3 दिन में देने हैं)
                  </p>
                  <p className="text-base text-orange-800">
                    Next reminder date (अगली तारीख): {app.next_reminder_date}
                  </p>
                  <p className="text-sm text-orange-800">
                    Demo only — no message is sent. (सिर्फ डेमो, कोई संदेश नहीं भेजा जाता।)
                  </p>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </main>
  );
}
