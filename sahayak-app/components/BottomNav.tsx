"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLang } from "@/components/LangProvider";

function HomeIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 11l9-8 9 8M5 10v10h14V10" />
    </svg>
  );
}

function SchemesIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="11" cy="11" r="7" />
      <path strokeLinecap="round" d="M20 20l-4-4" />
    </svg>
  );
}

function ApplicationsIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 3h9l3 3v15H6zM9 12h6M9 16h6" />
    </svg>
  );
}

function FamilyIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

export default function BottomNav() {
  const { t } = useLang();
  const pathname = usePathname();

  const items = [
    { href: "/", label: t("nav.home"), icon: <HomeIcon /> },
    { href: "/schemes", label: t("nav.schemes"), icon: <SchemesIcon /> },
    { href: "/applications", label: t("nav.applications"), icon: <ApplicationsIcon /> },
    { href: "/family", label: t("nav.family"), icon: <FamilyIcon /> },
  ];

  return (
    <nav
      aria-label="Bottom navigation"
      className="fixed inset-x-3 bottom-3 z-40 sm:hidden"
    >
      <div className="glass-strong rounded-3xl p-1.5 shadow-glass-strong border border-white/80">
        <ul className="flex items-center justify-around">
          {items.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  className={`btn-press flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-2xl text-xs font-bold transition-all duration-200 ${
                    isActive
                      ? "bg-primary text-white shadow-md shadow-primary/25"
                      : "text-ink-secondary hover:text-ink hover:bg-white/40"
                  }`}
                >
                  <span className={isActive ? "text-white" : "text-ink-secondary"}>
                    {item.icon}
                  </span>
                  <span className="truncate max-w-[72px]">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
