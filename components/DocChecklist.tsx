"use client";

import { useEffect, useState } from "react";

type Doc = { name: string; tip: string };

export default function DocChecklist({
  schemeId,
  documents,
}: {
  schemeId: string;
  documents: Doc[];
}) {
  const storageKey = "sahayak_docs_" + schemeId;
  const [checked, setChecked] = useState<boolean[]>(() => documents.map(() => false));

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setChecked(documents.map((_, i) => parsed[i] === true));
        }
      }
    } catch {
      // ignore corrupt or unavailable storage
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  function toggle(index: number) {
    const next = checked.map((value, i) => (i === index ? !value : value));
    setChecked(next);
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      // ignore storage errors
    }
  }

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4">
      <h2 className="mb-3 text-lg font-semibold">Zaruri documents</h2>
      <ul className="space-y-3">
        {documents.map((doc, i) => (
          <li key={doc.name + i}>
            <label className="flex min-h-[48px] cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                className="mt-1 h-6 w-6 shrink-0"
                checked={checked[i] ?? false}
                onChange={() => toggle(i)}
              />
              <span>
                <span className="block font-medium">{doc.name}</span>
                <span className="block text-sm text-gray-600">{doc.tip}</span>
              </span>
            </label>
          </li>
        ))}
      </ul>
    </section>
  );
}
