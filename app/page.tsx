"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import personas from "../seed/personas.json";
import type { Gender, MaritalStatus, Occupation, Profile, SchemeMatch } from "../lib/types";

type Step = "welcome" | "confirm" | "followup" | "results";
type ChipField =
  | "age"
  | "gender"
  | "marital"
  | "district"
  | "annual_family_income"
  | "land_bigha"
  | "occupation"
  | "disability";

type SpeechResultEvent = { results: ArrayLike<ArrayLike<{ transcript: string }>> };
type SpeechRec = {
  lang: string;
  interimResults: boolean;
  onresult: ((e: SpeechResultEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};
type SpeechCtor = new () => SpeechRec;

type Option = { label: string; value: string | number | null };
type Question = { field: ChipField; text: string; options: Option[] };

const CHIP_FIELDS: ChipField[] = [
  "age",
  "gender",
  "marital",
  "district",
  "annual_family_income",
  "land_bigha",
  "occupation",
  "disability",
];

const FIELD_HI: Record<ChipField, string> = {
  age: "Umar",
  gender: "Ling",
  marital: "Vaivahik sthiti",
  district: "Zila",
  annual_family_income: "Saalana aamdani",
  land_bigha: "Zameen (bigha)",
  occupation: "Kaam",
  disability: "Viklangta",
};

const GENDER_HI: Record<Gender, string> = { F: "Mahila", M: "Purush", Other: "Anya" };
const MARITAL_HI: Record<MaritalStatus, string> = {
  single: "Avivahit",
  married: "Shaadi-shuda",
  widow: "Vidhwa",
  divorced: "Talaaqshuda",
  separated: "Alag rah rahe",
};
const OCCUPATION_HI: Record<Occupation, string> = {
  farmer: "Kisan",
  labour: "Mazdoor",
  other: "Anya kaam",
};

// One short Hindi sentence per persona in seed/personas.json.
const SAMPLE_TEXT: Record<string, string> = {
  P1: "Meri maa 62 saal ki hai, vidhwa hain, 2 bigha khet hai, Jaipur ke paas rehti hain.",
  P2: "Mera naam Ram hai, main 70 saal ka hoon, mazdoori karta hoon, shaadi-shuda hoon, Jaipur mein rehta hoon.",
  P3: "Main Sunita hoon, 35 saal ki vidhwa hoon, mere do bachche hain, Jaipur mein rehti hoon.",
  P4: "Mohan ji, 58 saal ke hain, kisan hain, 1.5 bigha zameen hai, Jaipur mein rehte hain.",
  P5: "Main vidhwa hoon, Jaipur mein rehti hoon, saal ki aamdani 30,000 rupaye hai.",
};

const SAMPLES = personas.map((p) => ({ id: p.id, label: p.label, text: SAMPLE_TEXT[p.id] ?? "" }));

// Asked in this order, only when the field is still empty.
const QUESTIONS: Question[] = [
  {
    field: "annual_family_income",
    text: "Parivar ki saalana aamdani kitni hai?",
    options: [
      { label: "60,000 se kam", value: 60000 },
      { label: "60,000 se zyada", value: 60001 },
      { label: "Pata nahi", value: null },
    ],
  },
  {
    field: "land_bigha",
    text: "Kitni zameen hai (bigha mein)?",
    options: [
      { label: "Zameen nahi", value: 0 },
      { label: "2 bigha tak", value: 2 },
      { label: "2 bigha se zyada", value: 3 },
      { label: "Pata nahi", value: null },
    ],
  },
  {
    field: "occupation",
    text: "Aap kya kaam karte hain?",
    options: [
      { label: "Kisan", value: "farmer" },
      { label: "Mazdoor", value: "labour" },
      { label: "Anya kaam", value: "other" },
      { label: "Pata nahi", value: null },
    ],
  },
  {
    field: "age",
    text: "Aapki umar kitni hai?",
    options: [
      { label: "35 saal se kam", value: 30 },
      { label: "35 se 59 saal", value: 45 },
      { label: "60 saal ya zyada", value: 65 },
      { label: "Pata nahi", value: null },
    ],
  },
  {
    field: "marital",
    text: "Aapki vaivahik sthiti kya hai?",
    options: [
      { label: "Vidhwa", value: "widow" },
      { label: "Shaadi-shuda", value: "married" },
      { label: "Avivahit", value: "single" },
      { label: "Pata nahi", value: null },
    ],
  },
];

const ERROR_EXTRACT =
  "Kuch gadbad ho gayi. Kripya neeche diye namune (sample) mein se koi ek dabayein.";
const ERROR_MATCH = "Yojana dhoondhne mein dikkat aayi. Thodi der baad dobara koshish karein.";
const ERROR_MIC = "Awaaz nahi suni gayi. Dobara bolein ya likhein.";

const BOX = "min-h-12 w-full rounded-lg border-2 border-gray-500 bg-white px-3 text-lg";
const BTN = "min-h-12 rounded-xl px-4 py-3 text-lg font-semibold";

function getSpeechCtor(): SpeechCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: SpeechCtor; webkitSpeechRecognition?: SpeechCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function nextQuestion(p: Profile, asked: string[]): Question | undefined {
  return QUESTIONS.find((q) => p[q.field] == null && !asked.includes(q.field));
}

function formatValue(field: ChipField, value: Profile[ChipField]): string {
  if (value === null || value === undefined || value === "") return "Nahi bataya";
  switch (field) {
    case "gender":
      return GENDER_HI[value as Gender];
    case "marital":
      return MARITAL_HI[value as MaritalStatus];
    case "occupation":
      return OCCUPATION_HI[value as Occupation];
    case "disability":
      return value ? "Haan" : "Nahi";
    case "annual_family_income":
      return `${Number(value).toLocaleString("en-IN")} rupaye`;
    case "land_bigha":
      return `${value} bigha`;
    default:
      return String(value);
  }
}

function isChipField(f: string): f is ChipField {
  return (CHIP_FIELDS as string[]).includes(f);
}

function EnumSelect<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T | null;
  options: Record<T, string>;
  onChange: (v: T | null) => void;
}) {
  return (
    <select
      className={BOX}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value === "" ? null : (e.target.value as T))}
    >
      <option value="">Nahi bataya</option>
      {(Object.keys(options) as T[]).map((k) => (
        <option key={k} value={k}>
          {options[k]}
        </option>
      ))}
    </select>
  );
}

export default function Home() {
  const [step, setStep] = useState<Step>("welcome");
  const [text, setText] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [asked, setAsked] = useState<string[]>([]);
  const [editing, setEditing] = useState<ChipField | null>(null);
  const [matches, setMatches] = useState<SchemeMatch[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canListen, setCanListen] = useState(false);
  const [listening, setListening] = useState(false);
  const recRef = useRef<SpeechRec | null>(null);

  useEffect(() => {
    setCanListen(getSpeechCtor() !== null);
  }, []);

  function startListening() {
    const Ctor = getSpeechCtor();
    if (!Ctor) return;
    try {
      const rec = new Ctor();
      rec.lang = "hi-IN";
      rec.interimResults = false;
      rec.onresult = (e) => {
        const t = e.results[0]?.[0]?.transcript ?? "";
        setText((prev) => (prev ? `${prev} ${t}` : t));
      };
      rec.onerror = () => {
        setListening(false);
        setError(ERROR_MIC);
      };
      rec.onend = () => setListening(false);
      recRef.current = rec;
      setError(null);
      setListening(true);
      rec.start();
    } catch {
      setListening(false);
      setError(ERROR_MIC);
    }
  }

  function stopListening() {
    recRef.current?.stop();
    setListening(false);
  }

  async function extract(input: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/profile/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input, lang: "hi" }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { profile: Profile };
      setProfile(data.profile);
      setAsked([]);
      setEditing(null);
      setStep("confirm");
    } catch {
      setError(ERROR_EXTRACT);
    } finally {
      setBusy(false);
    }
  }

  async function findMatches(p: Profile) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: p }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { matches: SchemeMatch[] };
      setMatches(data.matches);
      setStep("results");
    } catch {
      setError(ERROR_MATCH);
    } finally {
      setBusy(false);
    }
  }

  // Ask the next missing question, or run the match when nothing is missing.
  function goNext(p: Profile, askedList: string[]) {
    if (nextQuestion(p, askedList)) {
      setStep("followup");
    } else {
      void findMatches(p);
    }
  }

  function setField(f: ChipField, value: Profile[ChipField]) {
    setProfile((p) => (p ? ({ ...p, [f]: value } as Profile) : p));
  }

  function answer(q: Question, value: string | number | null) {
    if (!profile) return;
    const newProfile = { ...profile, [q.field]: value } as Profile;
    const newAsked = [...asked, q.field];
    setProfile(newProfile);
    setAsked(newAsked);
    goNext(newProfile, newAsked);
  }

  function reset() {
    setStep("welcome");
    setText("");
    setProfile(null);
    setAsked([]);
    setEditing(null);
    setMatches([]);
    setError(null);
  }

  function renderEditor(p: Profile, f: ChipField) {
    switch (f) {
      case "gender":
        return <EnumSelect value={p.gender} options={GENDER_HI} onChange={(v) => setField(f, v)} />;
      case "marital":
        return <EnumSelect value={p.marital} options={MARITAL_HI} onChange={(v) => setField(f, v)} />;
      case "occupation":
        return <EnumSelect value={p.occupation} options={OCCUPATION_HI} onChange={(v) => setField(f, v)} />;
      case "disability":
        return (
          <div className="flex gap-2">
            {[
              { label: "Haan", value: true },
              { label: "Nahi", value: false },
            ].map((o) => (
              <button
                key={o.label}
                type="button"
                aria-pressed={p.disability === o.value}
                onClick={() => setField(f, o.value)}
                className={`${BTN} flex-1 border-2 ${
                  p.disability === o.value ? "border-gray-900 bg-gray-900 text-white" : "border-gray-500 bg-white"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        );
      case "age":
      case "annual_family_income":
      case "land_bigha":
        return (
          <input
            type="number"
            inputMode="decimal"
            className={BOX}
            value={p[f] ?? ""}
            onChange={(e) => setField(f, e.target.value === "" ? null : Number(e.target.value))}
          />
        );
      case "district":
        return (
          <input
            type="text"
            className={BOX}
            value={p.district ?? ""}
            onChange={(e) => setField(f, e.target.value.trim() === "" ? null : e.target.value)}
          />
        );
    }
  }

  const q = profile ? nextQuestion(profile, asked) : undefined;

  const groups = [
    {
      status: "LIKELY_ELIGIBLE",
      title: "Shayad eligible",
      tone: "border-green-600 bg-green-50",
    },
    {
      status: "NEED_MORE_INFO",
      title: "Ek aur jaankari chahiye",
      tone: "border-yellow-500 bg-yellow-50",
    },
    {
      status: "NOT_ELIGIBLE",
      title: "Eligible nahi",
      tone: "border-gray-400 bg-gray-100",
    },
  ] as const;

  return (
    <main className="mx-auto max-w-xl space-y-6 p-4 text-lg leading-relaxed">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-4xl font-bold">सहायक</h1>
        <Link
          href="/applications"
          className="inline-flex min-h-12 items-center rounded-lg border-2 border-gray-700 px-4 font-semibold"
        >
          Mere aavedan
        </Link>
      </header>

      <div className="rounded-lg bg-yellow-300 px-4 py-3 font-semibold">Demo with sample data</div>

      {error && (
        <p role="alert" className="rounded-lg border-2 border-red-600 bg-red-50 p-4">
          {error}
        </p>
      )}

      {step === "welcome" && (
        <section className="space-y-5">
          <p className="text-xl">Apni baat bolein, hum bataenge aapko kaun si yojana mil sakti hai.</p>
          <p className="text-base text-gray-700">Aadhaar number ki zaroorat nahi.</p>

          {canListen ? (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={listening ? stopListening : startListening}
                disabled={busy}
                aria-label={listening ? "Sunna band karein" : "Bolkar likhein"}
                className={`h-32 w-32 rounded-full text-xl font-bold text-white shadow-lg ${
                  listening ? "bg-red-600" : "bg-blue-700"
                }`}
              >
                {listening ? "Sun rahe hain..." : "Bolein"}
              </button>
            </div>
          ) : (
            <p className="rounded-lg border-2 border-gray-300 p-3 text-base">
              Is phone mein bolkar likhne ki suvidha nahi hai. Kripya likhein ya namune chunein.
            </p>
          )}

          <textarea
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Yahan apni baat likhein..."
            className="w-full rounded-xl border-2 border-gray-500 p-4 text-xl"
          />

          <button
            type="button"
            onClick={() => extract(text.trim())}
            disabled={busy || text.trim() === ""}
            className={`${BTN} w-full bg-green-700 text-white disabled:opacity-50`}
          >
            {busy ? "Jaankari samajh rahe hain..." : "Aage badhein"}
          </button>

          <div className="space-y-3">
            <h2 className="text-xl font-semibold">Namune (sample) chunein:</h2>
            {SAMPLES.map((s) => (
              <button
                key={s.id}
                type="button"
                disabled={busy}
                onClick={() => extract(s.text)}
                className="min-h-12 w-full rounded-xl border-2 border-gray-700 bg-white px-4 py-3 text-left text-lg disabled:opacity-50"
              >
                <span className="block font-semibold capitalize">{s.label}</span>
                <span className="block text-base text-gray-700">{s.text}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {step === "confirm" && profile && (
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Kya ye sahi hai?</h2>
          <p className="text-base text-gray-700">Kisi bhi jaankari par dabakar badal sakte hain.</p>
          <ul className="space-y-3">
            {CHIP_FIELDS.map((f) => (
              <li key={f} className="space-y-2">
                <button
                  type="button"
                  onClick={() => setEditing(editing === f ? null : f)}
                  className="flex min-h-12 w-full items-center justify-between gap-3 rounded-xl border-2 border-gray-500 bg-white px-4 py-3 text-left"
                >
                  <span>{FIELD_HI[f]}</span>
                  <span className="font-semibold">{formatValue(f, profile[f])}</span>
                </button>
                {editing === f && renderEditor(profile, f)}
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => {
              setEditing(null);
              goNext(profile, []);
            }}
            disabled={busy}
            className={`${BTN} w-full bg-green-700 text-white disabled:opacity-50`}
          >
            Haan, aage badhein
          </button>
          <button
            type="button"
            onClick={reset}
            className={`${BTN} w-full border-2 border-gray-700 bg-white`}
          >
            Naya shuru karein
          </button>
        </section>
      )}

      {step === "followup" && profile && (
        <section className="space-y-4">
          {q ? (
            <>
              <h2 className="text-2xl font-bold">{q.text}</h2>
              <div className="grid gap-3">
                {q.options.map((o) => (
                  <button
                    key={o.label}
                    type="button"
                    disabled={busy}
                    onClick={() => answer(q, o.value)}
                    className={`${BTN} border-2 border-gray-800 bg-white disabled:opacity-50`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <p className="text-xl">Thoda intezaar karein...</p>
          )}
        </section>
      )}

      {step === "results" && (
        <section className="space-y-6">
          <h2 className="text-2xl font-bold">Aapke liye yojanayein</h2>
          {matches.length === 0 && <p className="text-xl">Abhi koi yojana nahi mili.</p>}
          {groups.map((g) => {
            const items = matches.filter((m) => m.status === g.status);
            if (items.length === 0) return null;
            return (
              <div key={g.status} className="space-y-3">
                <h3 className="text-xl font-bold">{g.title}</h3>
                <ul className="space-y-3">
                  {items.map((m) => (
                    <li key={m.scheme.id}>
                      <Link
                        href={`/scheme/${m.scheme.id}`}
                        className={`block min-h-12 space-y-1 rounded-xl border-2 p-4 ${g.tone}`}
                      >
                        <span className="block text-xl font-semibold">{m.scheme.name_hi}</span>
                        <span className="block text-base">{m.scheme.benefit_text}</span>
                        {g.status === "NEED_MORE_INFO" && m.missing_fields.length > 0 && (
                          <span className="block text-base">
                            Chahiye:{" "}
                            {m.missing_fields.map((f) => (isChipField(f) ? FIELD_HI[f] : f)).join(", ")}
                          </span>
                        )}
                        {g.status === "NOT_ELIGIBLE" && m.reason_rules.length > 0 && (
                          <span className="block text-base">Kaaran: {m.reason_rules.join("; ")}</span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
          <button
            type="button"
            onClick={reset}
            className={`${BTN} w-full border-2 border-gray-700 bg-white`}
          >
            Naya shuru karein
          </button>
        </section>
      )}

      <footer className="border-t pt-4 text-base text-gray-700">
        Final decision is by the government department.
      </footer>
    </main>
  );
}
