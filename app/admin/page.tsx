"use client";

import { useState, type FormEvent } from "react";
import type { Scheme } from "../../lib/types";

interface Report {
  id?: string;
  scheme_id: string;
  district: string;
  note: string;
  created_at: string;
}

interface EditForm {
  name_en: string;
  name_hi: string;
  official_url: string;
  last_verified: string;
  active: boolean;
  rules: string;
  documents: string;
  apply_steps: string;
}

const inputCls =
  "w-full min-h-[48px] rounded-lg border-2 border-slate-400 bg-white px-3 py-2 text-lg";
const labelCls = "block text-lg font-semibold text-slate-800";
const btnCls =
  "min-h-[48px] rounded-lg px-5 py-2 text-lg font-semibold disabled:opacity-50";

function toForm(s: Scheme): EditForm {
  return {
    name_en: s.name_en,
    name_hi: s.name_hi,
    official_url: s.official_url,
    last_verified: s.last_verified,
    active: s.active,
    rules: JSON.stringify(s.rules, null, 2),
    documents: JSON.stringify(s.documents, null, 2),
    apply_steps: JSON.stringify(s.apply_steps, null, 2),
  };
}

export default function AdminPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<EditForm | null>(null);
  const [saveErrors, setSaveErrors] = useState<string[]>([]);
  const [saveOk, setSaveOk] = useState(false);

  const [reports, setReports] = useState<Report[]>([]);

  function sessionExpired() {
    setLoggedIn(false);
    setLoginError("Session khatam ho gaya, dobara login karein. (Session expired, please log in again.)");
  }

  async function loadData() {
    setPageError(null);
    try {
      const [sRes, rRes] = await Promise.all([
        fetch("/api/admin/schemes"),
        fetch("/api/admin/reports"),
      ]);
      if (sRes.status === 401 || rRes.status === 401) {
        sessionExpired();
        return;
      }
      if (!sRes.ok || !rRes.ok) {
        setPageError("Data load nahi hua. (Could not load data.)");
        return;
      }
      const sData = await sRes.json();
      const rData = await rRes.json();
      setSchemes(sData.schemes ?? []);
      setReports(rData.reports ?? []);
    } catch {
      setPageError("Network error. (Network error.)");
    }
  }

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setLoginError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (res.status === 401) {
        setLoginError("Email ya password galat hai. (Wrong email or password.)");
        return;
      }
      if (!res.ok) {
        setLoginError("Login nahi ho paya. (Login failed.)");
        return;
      }
      setPassword("");
      setLoggedIn(true);
      await loadData();
    } catch {
      setLoginError("Network error. (Network error.)");
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" }).catch(() => undefined);
    setLoggedIn(false);
    setSchemes([]);
    setReports([]);
    setSelectedId(null);
    setForm(null);
    setSaveErrors([]);
    setSaveOk(false);
  }

  function selectScheme(s: Scheme) {
    setSelectedId(s.id);
    setForm(toForm(s));
    setSaveErrors([]);
    setSaveOk(false);
  }

  function setField<K extends keyof EditForm>(key: K, value: EditForm[K]) {
    setForm((f) => (f ? { ...f, [key]: value } : f));
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!form || !selectedId) return;
    setSaveErrors([]);
    setSaveOk(false);

    let rules: unknown;
    let documents: unknown;
    let apply_steps: unknown;
    try {
      rules = JSON.parse(form.rules);
    } catch {
      setSaveErrors(["Rules JSON galat hai. (Rules JSON is invalid.)"]);
      return;
    }
    try {
      documents = JSON.parse(form.documents);
    } catch {
      setSaveErrors(["Documents JSON galat hai. (Documents JSON is invalid.)"]);
      return;
    }
    try {
      apply_steps = JSON.parse(form.apply_steps);
    } catch {
      setSaveErrors(["Apply steps JSON galat hai. (Apply steps JSON is invalid.)"]);
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/admin/schemes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedId,
          name_en: form.name_en,
          name_hi: form.name_hi,
          official_url: form.official_url,
          last_verified: form.last_verified,
          active: form.active,
          rules,
          documents,
          apply_steps,
        }),
      });
      if (res.status === 401) {
        sessionExpired();
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSaveErrors(
          Array.isArray(data.errors) && data.errors.length
            ? data.errors
            : ["Save nahi hua. (Save failed.)"],
        );
        return;
      }
      const updated: Scheme = data.scheme;
      setSchemes((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      setForm(toForm(updated));
      setSaveOk(true);
    } catch {
      setSaveErrors(["Network error. (Network error.)"]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-4 text-lg">
      <div className="rounded-lg bg-amber-100 px-4 py-3 text-lg font-semibold text-amber-900">
        Demo with sample data (नमूना डेटा के साथ डेमो)
      </div>

      <h1 className="text-3xl font-bold">Admin (एडमिन)</h1>

      {!loggedIn ? (
        <form onSubmit={handleLogin} className="space-y-4 rounded-xl bg-white p-5 shadow">
          <div>
            <label htmlFor="email" className={labelCls}>
              Email (ईमेल)
            </label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="password" className={labelCls}>
              Password (पासवर्ड)
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputCls}
            />
          </div>
          {loginError && (
            <p role="alert" className="rounded-lg bg-red-100 p-3 text-red-800">
              {loginError}
            </p>
          )}
          <button
            type="submit"
            disabled={busy}
            className={`${btnCls} w-full bg-blue-700 text-white`}
          >
            Login (लॉगिन)
          </button>
        </form>
      ) : (
        <>
          <div className="flex items-center justify-between gap-3">
            <p className="font-semibold">Logged in (लॉगिन हो गया)</p>
            <button
              type="button"
              onClick={handleLogout}
              disabled={busy}
              className={`${btnCls} bg-slate-700 text-white`}
            >
              Logout (लॉगआउट)
            </button>
          </div>

          {pageError && (
            <p role="alert" className="rounded-lg bg-red-100 p-3 text-red-800">
              {pageError}
            </p>
          )}

          <section className="space-y-3 rounded-xl bg-white p-5 shadow">
            <h2 className="text-2xl font-bold">Schemes (योजनाएँ)</h2>
            {schemes.length === 0 && <p>Koi scheme nahi mili. (No schemes found.)</p>}
            <ul className="space-y-2">
              {schemes.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => selectScheme(s)}
                    className={`${btnCls} w-full text-left ${
                      s.id === selectedId ? "bg-blue-700 text-white" : "bg-slate-100 text-slate-900"
                    }`}
                  >
                    {s.name_en} / {s.name_hi}
                    {!s.active && " (inactive)"}
                  </button>
                </li>
              ))}
            </ul>
          </section>

          {form && selectedId && (
            <form onSubmit={handleSave} className="space-y-4 rounded-xl bg-white p-5 shadow">
              <h2 className="text-2xl font-bold">Edit scheme (योजना बदलें)</h2>
              <p className="text-base text-slate-600">ID: {selectedId}</p>

              <div>
                <label htmlFor="name_en" className={labelCls}>
                  Name (English)
                </label>
                <input
                  id="name_en"
                  value={form.name_en}
                  onChange={(e) => setField("name_en", e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="name_hi" className={labelCls}>
                  Name (हिन्दी)
                </label>
                <input
                  id="name_hi"
                  value={form.name_hi}
                  onChange={(e) => setField("name_hi", e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="official_url" className={labelCls}>
                  Official URL (आधिकारिक लिंक)
                </label>
                <input
                  id="official_url"
                  type="url"
                  value={form.official_url}
                  onChange={(e) => setField("official_url", e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="last_verified" className={labelCls}>
                  Last verified (अंतिम जाँच, YYYY-MM-DD)
                </label>
                <input
                  id="last_verified"
                  type="date"
                  value={form.last_verified}
                  onChange={(e) => setField("last_verified", e.target.value)}
                  className={inputCls}
                />
              </div>
              <label className="flex min-h-[48px] items-center gap-3 text-lg font-semibold">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setField("active", e.target.checked)}
                  className="h-6 w-6"
                />
                Active (सक्रिय)
              </label>

              <div>
                <label htmlFor="rules" className={labelCls}>
                  Rules JSON (नियम)
                </label>
                <textarea
                  id="rules"
                  rows={8}
                  value={form.rules}
                  onChange={(e) => setField("rules", e.target.value)}
                  className={`${inputCls} font-mono text-base`}
                />
              </div>
              <div>
                <label htmlFor="documents" className={labelCls}>
                  Documents JSON (दस्तावेज़)
                </label>
                <textarea
                  id="documents"
                  rows={6}
                  value={form.documents}
                  onChange={(e) => setField("documents", e.target.value)}
                  className={`${inputCls} font-mono text-base`}
                />
              </div>
              <div>
                <label htmlFor="apply_steps" className={labelCls}>
                  Apply steps JSON (आवेदन के चरण)
                </label>
                <textarea
                  id="apply_steps"
                  rows={6}
                  value={form.apply_steps}
                  onChange={(e) => setField("apply_steps", e.target.value)}
                  className={`${inputCls} font-mono text-base`}
                />
              </div>

              {saveErrors.length > 0 && (
                <div role="alert" className="rounded-lg bg-red-100 p-3 text-red-800">
                  <p className="font-semibold">Save nahi hua (Save failed):</p>
                  <ul className="list-inside list-disc">
                    {saveErrors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
              {saveOk && (
                <p className="rounded-lg bg-green-100 p-3 text-green-800">
                  Save ho gaya (Saved).
                </p>
              )}

              <button
                type="submit"
                disabled={busy}
                className={`${btnCls} w-full bg-green-700 text-white`}
              >
                Save (सेव करें)
              </button>
            </form>
          )}

          <section className="space-y-3 rounded-xl bg-white p-5 shadow">
            <h2 className="text-2xl font-bold">Reports (रिपोर्ट)</h2>
            {reports.length === 0 && <p>Koi report nahi. (No reports.)</p>}
            <ul className="space-y-3">
              {reports.map((r, i) => (
                <li key={r.id ?? i} className="rounded-lg border-2 border-slate-200 p-3">
                  <p className="font-semibold">Scheme: {r.scheme_id}</p>
                  <p>District (जिला): {r.district}</p>
                  <p>Note (नोट): {r.note}</p>
                  <p className="text-base text-slate-600">
                    Created (बनाया गया): {r.created_at}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </main>
  );
}
