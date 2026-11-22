import { loadSchemes } from "@/lib/schemes-store";
import type { Scheme } from "@/lib/types";
import DocChecklist from "@/components/DocChecklist";
import SchemeActions from "@/components/SchemeActions";

export default function SchemePage({ params }: { params: { id: string } }) {
  const schemes: Scheme[] = loadSchemes();
  const scheme = schemes.find((s) => s.id === params.id);

  if (!scheme) {
    return (
      <main className="mx-auto max-w-2xl space-y-4 p-4">
        <h1 className="text-2xl font-bold">Yojana nahi mili</h1>
        <a href="/" className="inline-block min-h-[48px] py-3 text-blue-700 underline">
          Wapas jaayein
        </a>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-4">
      <div
        role="note"
        className="rounded-md border border-yellow-400 bg-yellow-100 p-3 text-sm font-medium text-yellow-900"
      >
        Demo with sample data
      </div>

      <div id="scheme-content" className="space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-bold">{scheme.name_hi}</h1>
          <p className="text-lg text-gray-700">{scheme.name_en}</p>
        </header>

        <section className="rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="mb-2 text-lg font-semibold">Laabh</h2>
          <p>{scheme.benefit_text}</p>
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="mb-2 text-lg font-semibold">Shartein</h2>
          <ul className="list-disc space-y-1 pl-5">
            {scheme.rules.map((rule, i) => (
              <li key={rule.field + i}>{rule.label_hi}</li>
            ))}
          </ul>
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="mb-2 text-lg font-semibold">Apply karne ke steps</h2>
          <ol className="list-decimal space-y-2 pl-5">
            {scheme.apply_steps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </section>

        <p role="alert" className="rounded-md border border-blue-300 bg-blue-50 p-3 font-medium">
          Yeh application FREE hai. Agar koi paise maange, report karein.
        </p>

        <p>
          <a
            href={scheme.official_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block min-h-[48px] py-3 text-blue-700 underline"
          >
            Official website par jaayein
          </a>
        </p>

        <p className="text-sm text-gray-600">Last verified: {scheme.last_verified}</p>
      </div>

      <DocChecklist schemeId={scheme.id} documents={scheme.documents} />

      <SchemeActions schemeId={scheme.id} />

      <footer className="border-t border-gray-200 pt-4 text-sm text-gray-600">
        Final decision is by the government department.
      </footer>
    </main>
  );
}
