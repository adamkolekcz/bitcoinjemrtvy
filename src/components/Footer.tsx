export function Footer() {
  return (
    <footer className="py-8 text-sm text-neutral-400">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="flex items-center gap-1 flex-wrap justify-center text-center">
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
