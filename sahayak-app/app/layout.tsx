import type { Metadata } from "next";
import { Inter, Noto_Sans_Devanagari } from "next/font/google";
import "./globals.css";
import { LangProvider } from "@/components/LangProvider";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const notoDevanagari = Noto_Sans_Devanagari({
  subsets: ["latin", "devanagari"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-noto-devanagari",
});

export const metadata: Metadata = {
  title: "Sahayak - अपना हक",
  description: "Direct government scheme discovery in simple voice & text.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hi" className={`${inter.variable} ${notoDevanagari.variable}`}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="font-sans antialiased text-ink relative min-h-screen selection:bg-primary/20 selection:text-primary">
        {/* Fixed Ambient Liquid Glass Blobs */}
        <div
          aria-hidden="true"
          className="fixed inset-0 overflow-hidden pointer-events-none z-[-1]"
        >
          {/* Green Blob (Top-Left) */}
          <div
            className="absolute -top-24 -left-24 h-[520px] w-[520px] rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(31, 111, 74, 0.22) 0%, rgba(31, 111, 74, 0) 70%)",
              filter: "blur(80px)",
            }}
          />
          {/* Saffron Blob (Top-Right) */}
          <div
            className="absolute top-48 -right-28 h-[480px] w-[480px] rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(245, 158, 11, 0.20) 0%, rgba(245, 158, 11, 0) 70%)",
              filter: "blur(85px)",
            }}
          />
          {/* Soft Blue Blob (Center-Bottom) */}
          <div
            className="absolute bottom-12 left-1/4 h-[560px] w-[560px] rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(96, 165, 250, 0.16) 0%, rgba(96, 165, 250, 0) 70%)",
              filter: "blur(90px)",
            }}
          />
        </div>

        <LangProvider>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1 w-full max-w-[1080px] mx-auto px-4 sm:px-6 py-6 pb-28 sm:pb-12">
              {children}
            </main>
            <Footer />
            <BottomNav />
          </div>
        </LangProvider>
      </body>
    </html>
  );
}
