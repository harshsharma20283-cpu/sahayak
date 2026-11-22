"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useLang } from "@/components/LangProvider";
import type { Scheme, RuleOp, Document, Step, Source } from "../../lib/types";

// ---------- constants ----------

const FIELDS = [
  "state",
  "age",
  "gender",
  "marital",
  "district",
  "annual_family_income",
  "land_bigha",
  "occupation",
  "disability",
  "children_count",
] as const;

const NUMERIC_FIELDS: string[] = ["age", "annual_family_income", "land_bigha", "children_count"];
const BOOL_FIELDS: string[] = ["disability"];
const OPS: RuleOp[] = ["==", "!=", "<", "<=", ">", ">=", "in", "not_in"];

const inputCls =
  "w-full min-h-[48px] rounded-2xl border border-black/10 bg-white/90 px-4 py-2.5 text-base text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-inner";
const btnCls = "btn-press min-h-[48px] rounded-2xl px-5 py-2.5 font-bold transition shadow-xs";
const primaryBtn = `${btnCls} bg-primary text-white hover:bg-primary-hover shadow-md shadow-primary/25 disabled:opacity-60`;
const secondaryBtn = `${btnCls} border border-neutral/30 bg-white/80 text-ink hover:bg-white`;
const dangerBtn = `${btnCls} border border-danger/40 bg-white/80 text-danger hover:bg-red-50`;

// ---------- types local to this page ----------

interface ErrBody {
  error_hi?: string;
  error_en?: string;
  details?: unknown;
}

interface RuleRow {
  field: string;
  op: RuleOp;
  valueText: string;
  label_en: string;
  label_hi: string;
}

interface Report {
  scheme_id: string;
  district: string | null;
  note: string | null;
  created_at: string;
}

// ---------- helpers ----------

function setRow<T>(list: T[], i: number, patch: Partial<T>): T[] {
  return list.map((x, j) => (j === i ? { ...x, ...patch } : x));
}

function removeRow<T>(list: T[], i: number): T[] {
  return list.filter((_, j) => j !== i);
}

function rowsFromScheme(s: Scheme): RuleRow[] {
  return s.rules.map((r) => ({
    field: r.field,
    op: r.op,
    valueText:
      r.value === null || r.value === undefined
        ? ""
        : Array.isArray(r.value)
          ? r.value.join(", ")
          : String(r.value),
    label_en: r.label_en ?? "",
    label_hi: r.label_hi ?? "",
  }));
}

function parseValue(
  field: string,
  op: RuleOp,
  raw: string,
): { ok: true; value: unknown } | { ok: false } {
  const trimmed = raw.trim();
  if (op === "in" || op === "not_in") {
    const parts = trimmed
      .split(",")
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
    if (parts.length === 0) return { ok: false };
    if (NUMERIC_FIELDS.includes(field)) {
      const nums = parts.map(Number);
      if (nums.some((n) => Number.isNaN(n))) return { ok: false };
      return { ok: true, value: nums };
    }
    return { ok: true, value: parts };
  }

  if (NUMERIC_FIELDS.includes(field)) {
    if (trimmed === "") return { ok: false };
    const n = Number(trimmed);
    if (Number.isNaN(n)) return { ok: false };
    return { ok: true, value: n };
  }

  if (BOOL_FIELDS.includes(field)) {
    const lower = trimmed.toLowerCase();
    if (lower === "true" || lower === "1" || lower === "हाँ" || lower === "yes") {
      return { ok: true, value: true };
    }
    if (lower === "false" || lower === "0" || lower === "नहीं" || lower === "no") {
      return { ok: true, value: false };
    }
    return { ok: false };
  }

  if (trimmed === "") return { ok: false };
  return { ok: true, value: trimmed };
}

function errText(body: ErrBody | undefined, fallback: { hi: string; en: string }) {
  return {
    hi: body?.error_hi ?? fallback.hi,
    en: body?.error_en ?? fallback.en,
  };
}

function detailsText(d: unknown): string | null {
  if (!d) return null;
  if (typeof d === "string") return d;
  try {
    return JSON.stringify(d, null, 2);
  } catch {
    return String(d);
  }
}

// ---------- component ----------

export default function AdminPage() {
  const { lang, t } = useLang();
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [loginErr, setLoginErr] = useState<{ hi: string; en: string } | null>(null);
  const [loginBusy, setLoginBusy] = useState(false);

  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [listErr, setListErr] = useState<string | null>(null);

  const [draft, setDraft] = useState<Scheme | null>(null);
  const [ruleRows, setRuleRows] = useState<RuleRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string; details?: string | null } | null>(null);
  const [validationErr, setValidationErr] = useState<string | null>(null);

  const [reports, setReports] = useState<Report[]>([]);
  const [reportsErr, setReportsErr] = useState<string | null>(null);

  function resetAll() {
    setAuthed(false);
    setSchemes([]);
    setDraft(null);
    setRuleRows([]);
    setSaveMsg(null);
    setValidationErr(null);
    setReports([]);
    setListErr(null);
    setReportsErr(null);
  }

  async function loadSchemes() {
    setListErr(null);
    try {
      const res = await fetch("/api/admin/schemes", { method: "GET" });
      if (res.status === 401 || res.status === 403) {
        resetAll();
        return;
      }
      const body = (await res.json().catch(() => ({}))) as ErrBody & { schemes?: Scheme[] };
      if (!res.ok || !Array.isArray(body.schemes)) {
        setListErr(t("admin.schemes_load_failed"));
        return;
      }
      setSchemes(body.schemes);
    } catch {
      setListErr(t("admin.network_error"));
    }
  }

  async function loadReports() {
    setReportsErr(null);
    try {
      const res = await fetch("/api/reports", { method: "GET" });
      if (res.status === 401 || res.status === 403) {
        resetAll();
        return;
      }
      const body = (await res.json().catch(() => ({}))) as ErrBody & { reports?: Report[] };
      if (!res.ok || !Array.isArray(body.reports)) {
        setReportsErr(t("admin.reports_load_failed"));
        return;
      }
      setReports(body.reports);
    } catch {
      setReportsErr(t("admin.network_error"));
    }
  }

  async function onLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoginErr(null);
    setLoginBusy(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const body = (await res.json().catch(() => ({}))) as ErrBody & { ok?: boolean };
      if (res.ok && body.ok) {
        setPassword("");
        setAuthed(true);
        await Promise.all([loadSchemes(), loadReports()]);
      } else {
        setLoginErr({ hi: t("admin.login_failed"), en: t("admin.login_failed") });
      }
    } catch {
      setLoginErr({ hi: t("admin.network_error"), en: t("admin.network_error") });
    } finally {
      setPassword("");
      setLoginBusy(false);
    }
  }

  async function onLogout() {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch {
      // ignore
    }
    resetAll();
  }

  function openScheme(s: Scheme) {
    const copy = JSON.parse(JSON.stringify(s)) as Scheme;
    setDraft(copy);
    setRuleRows(rowsFromScheme(copy));
    setSaveMsg(null);
    setValidationErr(null);
  }

  function closeEditor() {
    setDraft(null);
    setRuleRows([]);
    setSaveMsg(null);
    setValidationErr(null);
  }

  function update(patch: Partial<Scheme>) {
    setDraft((d) => (d ? { ...d, ...patch } : d));
  }

  function updateRule(i: number, patch: Partial<RuleRow>) {
    setRuleRows((rows) => setRow(rows, i, patch));
  }

  function addRule() {
    setRuleRows((rows) => [
      ...rows,
      { field: "state", op: "==", valueText: "", label_en: "", label_hi: "" },
    ]);
  }

  function removeRule(i: number) {
    setRuleRows((rows) => removeRow(rows, i));
  }

  async function onSave() {
    if (!draft) return;
    setSaveMsg(null);
    setValidationErr(null);

    const errors: string[] = [];
    const rules = ruleRows.map((r, i) => {
      const p = parseValue(r.field, r.op, r.valueText);
      if (!p.ok) {
        errors.push(t("admin.rule_invalid_value", { index: i + 1 }));
      }
      return {
        field: r.field,
        op: r.op,
        value: p.ok ? p.value : null,
        label_en: r.label_en,
        label_hi: r.label_hi,
      };
    });
    if (errors.length > 0) {
      setValidationErr(errors.join("\n"));
      return;
    }

    const body: Scheme = { ...draft, rules };
    setSaving(true);
    try {
      const res = await fetch("/api/admin/schemes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as ErrBody & { scheme?: Scheme };
      if (res.status === 401 || res.status === 403) {
        resetAll();
        return;
      }
      if (res.ok && data.scheme) {
        const saved = data.scheme;
        setSchemes((list) => list.map((s) => (s.id === saved.id ? saved : s)));
        setDraft(JSON.parse(JSON.stringify(saved)) as Scheme);
        setRuleRows(rowsFromScheme(saved));
        setSaveMsg({ ok: true, text: t("admin.saved") });
      } else {
        setSaveMsg({
          ok: false,
          text: t("admin.save_failed"),
          details: detailsText(data.details),
        });
      }
    } catch {
      setSaveMsg({ ok: false, text: t("admin.network_error") });
    } finally {
      setSaving(false);
    }
  }

  if (!authed) {
    return (
      <section className="mx-auto w-full max-w-md py-12 animate-fade-in">
        <div className="glass-card rounded-3xl p-8 sm:p-10 shadow-glass border border-white/80 space-y-6">
          <div className="space-y-1">
            <h1 className="heading-1">{t("admin.login_title")}</h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100/90 border border-amber-300/60 px-3 py-0.5 text-xs font-bold text-amber-900 mt-2">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              {t("admin.sample_badge")}
            </span>
          </div>
          <form onSubmit={onLogin} className="space-y-5">
            <label className="block space-y-1.5">
              <span className="text-sm font-bold text-ink-secondary">{t("admin.passphrase")}</span>
              <input
                type="password"
                className={inputCls}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loginBusy}
                autoFocus
              />
            </label>
            {loginErr && (
              <p role="alert" className="text-sm font-bold text-danger bg-red-50 p-3 rounded-2xl border border-danger/30">
                {lang === "hi" ? loginErr.hi : loginErr.en}
              </p>
            )}
            <button type="submit" disabled={loginBusy || !password} className={`${primaryBtn} w-full min-h-[56px] text-lg`}>
              {t("admin.login_btn")}
            </button>
          </form>
        </div>
      </section>
    );
  }

  if (draft) {
    return (
      <section className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="heading-1">{t("admin.edit_scheme")}</h1>
          <div className="flex gap-2">
            <button type="button" onClick={closeEditor} className={secondaryBtn}>
              {t("admin.back")}
            </button>
            <button type="button" onClick={onLogout} className={secondaryBtn}>
              {t("admin.logout")}
            </button>
          </div>
        </div>

        <div className="space-y-3 rounded border border-gray-400 p-4">
          <label className="block space-y-1">
            <span className="font-semibold">ID</span>
            <input className={inputCls} value={draft.id} disabled />
          </label>
          <label className="block space-y-1">
            <span className="font-semibold">{t("admin.name_hi")}</span>
            <input
              className={inputCls}
              value={draft.name_hi}
              onChange={(e) => update({ name_hi: e.target.value })}
            />
          </label>
          <label className="block space-y-1">
            <span className="font-semibold">{t("admin.name_en")}</span>
            <input
              className={inputCls}
              value={draft.name_en}
              onChange={(e) => update({ name_en: e.target.value })}
            />
          </label>
          <label className="block space-y-1">
            <span className="font-semibold">{t("admin.benefit_hi")}</span>
            <textarea
              className={inputCls}
              rows={2}
              value={draft.benefit_text_hi}
              onChange={(e) => update({ benefit_text_hi: e.target.value })}
            />
          </label>
          <label className="block space-y-1">
            <span className="font-semibold">{t("admin.benefit_en")}</span>
            <textarea
              className={inputCls}
              rows={2}
              value={draft.benefit_text_en}
              onChange={(e) => update({ benefit_text_en: e.target.value })}
            />
          </label>
          <label className="block space-y-1">
            <span className="font-semibold">{t("scheme.fee")}</span>
            <input
              className={inputCls}
              value={draft.fee}
              onChange={(e) => update({ fee: e.target.value })}
            />
          </label>
          <label className="block space-y-1">
            <span className="font-semibold">{t("parchi.official_site")}</span>
            <input
              className={inputCls}
              type="url"
              value={draft.official_url}
              onChange={(e) => update({ official_url: e.target.value })}
            />
          </label>
        </div>

        <fieldset className="space-y-3">
          <legend className="heading-2">{t("admin.rules")}</legend>
          {ruleRows.map((r, i) => (
            <div key={i} className="space-y-2 rounded border border-gray-400 p-3">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <label className="block space-y-1">
                  <span>{t("admin.field")}</span>
                  <select
                    className={inputCls}
                    value={r.field}
                    onChange={(e) => updateRule(i, { field: e.target.value })}
                  >
                    {FIELDS.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block space-y-1">
                  <span>{t("admin.operator")}</span>
                  <select
                    className={inputCls}
                    value={r.op}
                    onChange={(e) => updateRule(i, { op: e.target.value as RuleOp })}
                  >
                    {OPS.map((op) => (
                      <option key={op} value={op}>
                        {op}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block space-y-1">
                  <span>{t("admin.value")}</span>
                  <input
                    className={inputCls}
                    value={r.valueText}
                    onChange={(e) => updateRule(i, { valueText: e.target.value })}
                  />
                </label>
              </div>
              <button type="button" className={dangerBtn} onClick={() => removeRule(i)}>
                {t("admin.remove_rule")}
              </button>
            </div>
          ))}
          <button type="button" className={secondaryBtn} onClick={addRule}>
            {t("admin.add_rule")}
          </button>
        </fieldset>

        {validationErr && (
          <div role="alert" className="whitespace-pre-line rounded border border-red-700 p-3 text-red-700">
            {validationErr}
          </div>
        )}
        {saveMsg && (
          <div
            role="status"
            className={`whitespace-pre-line rounded border p-3 ${
              saveMsg.ok ? "border-green-700 text-green-800" : "border-red-700 text-red-700"
            }`}
          >
            <p>{saveMsg.text}</p>
            {saveMsg.details && <pre className="mt-2 overflow-x-auto text-sm">{saveMsg.details}</pre>}
          </div>
        )}

        <div className="sticky bottom-0 flex gap-2 bg-white py-3">
          <button type="button" onClick={onSave} disabled={saving} className={primaryBtn}>
            {saving ? t("admin.saving") : t("admin.save")}
          </button>
          <button type="button" onClick={onLogout} className={secondaryBtn}>
            {t("admin.logout")}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl space-y-8 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="heading-1">{t("admin.title")}</h1>
        <button type="button" onClick={onLogout} className={secondaryBtn}>
          {t("admin.logout")}
        </button>
      </div>

      <div className="space-y-3">
        <h2 className="heading-2">{t("admin.schemes")}</h2>
        {listErr && <p role="alert" className="text-red-700">{listErr}</p>}
        {schemes.length === 0 && !listErr && <p>{t("admin.no_schemes")}</p>}
        <ul className="space-y-2">
          {schemes.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => openScheme(s)}
                className="w-full min-h-[48px] rounded border border-gray-400 bg-white p-3 text-left hover:border-primary transition"
              >
                <span className="block font-semibold">
                  {lang === "hi" ? s.name_hi : s.name_en}
                </span>
                <span className="block text-sm text-neutral">
                  {s.verification_status === "verified"
                    ? t("admin.verified_badge")
                    : t("admin.needs_verification")}
                  {" · "}
                  {t("admin.rules")}: {s.rules.length}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-3">
        <h2 className="heading-2">{t("admin.reports")}</h2>
        {reportsErr && <p role="alert" className="text-red-700">{reportsErr}</p>}
        {reports.length === 0 && !reportsErr && <p>{t("admin.no_reports")}</p>}
        <ul className="space-y-2">
          {reports.map((r, i) => (
            <li key={i} className="rounded border border-gray-400 p-3 text-sm">
              <p><span className="font-semibold">scheme_id:</span> {r.scheme_id}</p>
              <p><span className="font-semibold">district:</span> {r.district ?? ""}</p>
              <p><span className="font-semibold">note:</span> {r.note ?? ""}</p>
              <p><span className="font-semibold">created_at:</span> {r.created_at}</p>
            </li>
          ))}
        </ul>
      </div>

      <Link href="/" className="inline-block min-h-[48px] py-3 font-semibold text-primary underline">
        ← {t("admin.back")}
      </Link>
    </section>
  );
}
