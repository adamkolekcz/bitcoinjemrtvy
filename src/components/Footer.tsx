import Link from "next/link";

export function Footer({ hideEmbedLink = false }: { hideEmbedLink?: boolean }) {
  return (
    <footer className="py-8 text-sm text-neutral-400">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {!hideEmbedLink && (
          <p className="mb-6 text-center">
            <Link
              href="/embed"
              className="font-medium text-neutral-300 underline-offset-4 transition-colors hover:text-[var(--bitcoin-orange)] hover:underline"
            >
              Vložte si widget na svůj web →
            </Link>
          </p>
        )}
        <p className="flex items-center gap-1 flex-wrap justify-center text-center text-neutral-300">
          Původní{" "}
          <a href="https://bitcoindeaths.com" target="_blank" rel="noopener noreferrer" aria-label="Bitcoinisdead (otevře se v novém okně)">
            Bitcoinisdead
          </a>{" "}
          přeložil{" "}
          <a href="https://www.linkedin.com/in/adamkolek/" target="_blank" rel="noopener noreferrer" aria-label="Adam Kolek na LinkedIn (otevře se v novém okně)">
            Adam Kolek
          </a>
        </p>
      </div>
    </footer>
  );
}
