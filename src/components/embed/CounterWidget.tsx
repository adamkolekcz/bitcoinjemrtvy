import { EMBED_ORIGIN } from "@/lib/embed-config";

export function CounterWidget({ count }: { count: number }) {
  return (
    <a
      href={EMBED_ORIGIN}
      target="_blank"
      rel="noopener noreferrer"
      className="flex min-h-screen w-full flex-col justify-center overflow-hidden rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] px-4 no-underline"
    >
      <span className="text-lg font-bold tracking-tight">
        <span className="text-[var(--bitcoin-orange)]">Bitcoin</span>{" "}
        <span className="text-white">je mrtvý</span>
      </span>
      <span className="mt-0.5 text-sm text-neutral-300">
        <span className="font-bold text-[var(--death-red)]">{count.toLocaleString("cs-CZ")}&times;</span>{" "}
        prohlášen za&nbsp;mrtvý
      </span>
    </a>
  );
}
