"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLang } from "@/components/LangProvider";

export default function Header() {
  const { lang, setLang, t } = useLang();
  const pathname = usePathname();

  const tabs = [
    { href: "/schemes", label: t("nav.schemes") },
    { href: "/applications", label: t("nav.applications") },
    { href: "/family", label: t("nav.family") },
  ];

  const nextLang = lang === "hi" ? "en" : "hi";
  const toggleBtnText = lang === "hi" ? t("header.toggle_lang_to_en") : t("header.toggle_lang_to_hi");
  const toggleAria = lang === "hi" ? t("header.switch_to_en") : t("header.switch_to_hi");

  return (
    <header className="sticky top-0 z-40 w-full px-4 sm:px-6 py-3 transition-all">
      <div className="mx-auto flex max-w-[1080px] items-center justify-between gap-4 rounded-3xl glass-strong px-4 sm:px-6 py-2.5">
        {/* Brand Logo */}
        <Link
          href="/"
          className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl p-1"
        >
          <span
            aria-hidden="true"
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-emerald-700 text-xl font-bold text-white shadow-md shadow-primary/20 transition-transform group-hover:scale-105"
          >
            {t("header.logo_letter")}
          </span>
          <div className="flex flex-col">
            <span className="text-xl font-extrabold tracking-tight text-ink group-hover:text-primary transition-colors">
              {t("app.name")}
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Tabs (Hidden on mobile <640px) */}
        <nav className="hidden sm:flex items-center gap-1.5 p-1 rounded-full bg-black/5 border border-white/50" aria-label="Main">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`min-h-[44px] px-4 py-2 rounded-full text-base font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-primary text-white shadow-sm shadow-primary/30"
                    : "text-ink-secondary hover:text-ink hover:bg-white/60"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>

        {/* Language Toggle Pill */}
        <button
          type="button"
          onClick={() => setLang(nextLang)}
          aria-label={toggleAria}
          className="btn-press min-h-[46px] min-w-[90px] rounded-full border border-primary/40 bg-white/70 px-4 py-2 text-base font-bold text-primary shadow-sm hover:bg-primary hover:text-white transition-all duration-200 focus:outline-none focus-visible:ring-3 focus-visible:ring-primary"
        >
          {toggleBtnText}
        </button>
      </div>
    </header>
  );
}
