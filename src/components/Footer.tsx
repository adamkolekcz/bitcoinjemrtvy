export function Footer() {
  return (
    <footer className="border-t border-[var(--card-border)] py-8 text-sm text-neutral-400">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 flex-wrap">
        <p className="flex items-center gap-1 flex-wrap">
          Původní verzi{" "}
          <a href="https://bitcoindeaths.com" target="_blank" rel="noopener noreferrer" aria-label="Bitcoinisdead (otevře se v novém okně)">
            Bitcoinisdead
          </a>{" "}
          přeložil a upravil{" "}
          <a href="https://x.com/adkolek" target="_blank" rel="noopener noreferrer" aria-label="Adam Kolek na X (otevře se v novém okně)">
            Adam Kolek
          </a>
        </p>
        <a
          href="https://peaksite.cz"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 hover:opacity-75 transition-opacity"
          aria-label="Vytvořil PeakSite"
        >
          <span className="text-xs text-neutral-400">Vytvořil</span>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 40" fill="none" width="80" height="20" aria-hidden="true">
            <g transform="translate(4, 4) scale(1)">
              <polygon points="16,4 27,24 5,24" fill="none" stroke="#6C63FF" strokeWidth="1.5" strokeLinejoin="round"/>
              <polygon points="16,4 22,15 10,15" fill="#6C63FF" opacity="0.4"/>
              <line x1="8" y1="24" x2="24" y2="24" stroke="#A78BFA" strokeWidth="1.5" strokeLinecap="round"/>
            </g>
            <text x="46" y="27" fontFamily="'Plus Jakarta Sans', 'Inter', ui-sans-serif, system-ui, sans-serif" fontWeight="700" fontSize="22" fill="#a3a3a3" letterSpacing="-0.3">PeakSite</text>
          </svg>
        </a>
      </div>
    </footer>
  );
}
