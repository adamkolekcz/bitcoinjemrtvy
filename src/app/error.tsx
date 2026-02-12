"use client";

import Link from "next/link";
import { Header } from "@/components/Header";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header />

      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 text-center">
        <div className="mb-8">
          <span className="text-8xl font-bold text-[var(--bitcoin-orange)]">500</span>
        </div>

        <h2 className="mb-4 text-2xl font-bold text-white sm:text-3xl">
          Něco se pokazilo
        </h2>

        <p className="mb-8 text-neutral-300">
          Bitcoin je v pořádku, ale tato stránka má problém.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] px-6 py-3 font-semibold text-white transition-colors hover:border-[var(--bitcoin-orange)]/40"
          >
            Zkusit znovu
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--bitcoin-orange)] px-6 py-3 font-semibold text-black transition-colors hover:bg-[var(--bitcoin-orange)]/80"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 12L6 8L10 4" />
            </svg>
            Zpět na hlavní stránku
          </Link>
        </div>
      </main>
    </div>
  );
}
