"use client";

import { useState } from "react";

export function CopyEmbedCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="mt-4 overflow-hidden rounded-lg border border-[var(--card-border)] bg-[var(--background)]">
      <div className="flex items-center justify-between border-b border-[var(--card-border)] px-4 py-2">
        <span className="text-xs font-medium uppercase tracking-wider text-neutral-400">
          Vložit na web
        </span>
        <button
          type="button"
          onClick={copy}
          className="rounded px-3 py-1 text-xs font-medium text-white transition-colors hover:text-[var(--bitcoin-orange)]"
        >
          {copied ? "Zkopírováno ✓" : "Kopírovat kód"}
        </button>
      </div>
      <pre className="overflow-x-auto px-4 py-3 text-xs leading-relaxed text-neutral-300">
        <code>{code}</code>
      </pre>
    </div>
  );
}
