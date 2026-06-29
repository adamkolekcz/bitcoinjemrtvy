import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)]">
      <Header />

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
        <div className="mb-8">
          <span className="text-8xl font-bold text-[var(--bitcoin-orange)]">404</span>
        </div>

        <h1 className="mb-4 text-2xl font-bold text-white sm:text-3xl">
          Tato stránka je mrtvá
        </h1>

        <p className="mb-8 text-neutral-300">
          Na rozdíl od&nbsp;Bitcoinu, tato stránka skutečně neexistuje.
        </p>

        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--bitcoin-orange)] px-6 py-3 font-semibold text-black transition-colors hover:bg-[var(--bitcoin-orange)]/80"
        >
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 12L6 8L10 4" />
          </svg>
          Zpět na hlavní stránku
        </Link>
      </main>

      <Footer />
    </div>
  );
}
