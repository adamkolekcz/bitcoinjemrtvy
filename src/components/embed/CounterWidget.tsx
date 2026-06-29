import { EMBED_ORIGIN } from "@/lib/embed-config";

export function CounterWidget({ count }: { count: number }) {
  return (
    <a
      href={EMBED_ORIGIN}
      target="_blank"
      rel="noopener noreferrer"
      className="flex min-h-screen w-full items-center gap-3 border border-[var(--card-border)] bg-[var(--card-bg)] px-4 no-underline"
    >
      <span className="text-2xl font-bold leading-none text-[var(--bitcoin-orange)]">&#8383;</span>
      <span className="leading-tight">
        <span className="block text-xs font-medium uppercase tracking-wider text-neutral-300">
          Bitcoin je mrtvý
        </span>
        <span className="block text-sm font-bold text-white">
          <span className="text-[var(--bitcoin-orange)]">{count.toLocaleString("cs-CZ")}&times;</span>{" "}
          a&nbsp;počítáme
        </span>
      </span>
    </a>
  );
}
