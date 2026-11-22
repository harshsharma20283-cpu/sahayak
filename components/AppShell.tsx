"use client";

import type { ReactNode } from "react";
import Header from "./Header";
import { I18nProvider, useI18n } from "./I18nProvider";
import { ThemeProvider } from "./ThemeProvider";

function Footer() {
  const { t } = useI18n();
  return (
    <footer className="border-t border-stone-200 bg-white dark:border-slate-700 dark:bg-slate-900">
      <div className="mx-auto flex max-w-4xl flex-col gap-3 px-4 py-4 text-base text-stone-700 dark:text-slate-300 sm:flex-row sm:items-center sm:justify-between">
        <p>{t("footer.decision")}</p>
        <span className="inline-flex w-fit rounded-full bg-amber-100 px-3 py-1 font-semibold text-amber-900 dark:bg-amber-400/20 dark:text-amber-200">
          {t("badge.demo")}
        </span>
      </div>
    </footer>
  );
}

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <I18nProvider>
      <ThemeProvider>
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </ThemeProvider>
    </I18nProvider>
  );
}
