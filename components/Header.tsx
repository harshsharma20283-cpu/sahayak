"use client";

import { useI18n } from "./I18nProvider";
import { useTheme, type Theme } from "./ThemeProvider";

const THEME_OPTIONS: { value: Theme; labelKey: string }[] = [
  { value: "light", labelKey: "theme.light" },
  { value: "dark", labelKey: "theme.dark" },
  { value: "system", labelKey: "theme.system" },
];

function ThemeIcon({ value }: { value: Theme }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  if (value === "light") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    );
  }
  if (value === "dark") {
    return (
      <svg {...common}>
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8M12 16v4" />
    </svg>
  );
}

export default function Header() {
  const { lang, setLang, t } = useI18n();
  const { theme, setTheme } = useTheme();

  const toggleLang = () => setLang(lang === "hi" ? "en" : "hi");

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/95 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-2">
        <span className="text-2xl font-bold text-emerald-800 dark:text-emerald-300">
          {t("app.logo")}
        </span>

        <div className="flex items-center gap-2">
          <div
            role="group"
            aria-label={t("theme.label")}
            className="flex items-center gap-1 rounded-xl border border-stone-300 bg-stone-50 p-1 dark:border-slate-600 dark:bg-slate-800"
          >
            {THEME_OPTIONS.map((opt) => {
              const active = theme === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTheme(opt.value)}
                  aria-pressed={active}
                  aria-label={t(opt.labelKey)}
                  title={t(opt.labelKey)}
                  className={`flex h-12 min-w-[3rem] items-center justify-center rounded-lg px-2 transition focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400 ${
                    active
                      ? "bg-emerald-700 text-white dark:bg-emerald-500 dark:text-slate-950"
                      : "text-stone-700 hover:bg-stone-200 dark:text-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  <ThemeIcon value={opt.value} />
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={toggleLang}
            aria-label={t("lang.label")}
            className="flex h-12 min-w-[3rem] items-center justify-center rounded-xl border border-stone-300 bg-white px-3 text-lg font-semibold text-stone-900 hover:bg-stone-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
          >
            {t("lang.toggle")}
          </button>
        </div>
      </div>
    </header>
  );
}
