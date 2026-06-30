"use client";

import { useEffect, useState } from "react";

/** Aktuální cena BTC v Kč pro patičku — načítá se na klientu z /api/btc-price. */
export function FooterBtcPrice() {
  const [priceCzk, setPriceCzk] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/btc-price")
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && typeof d?.priceCzk === "number") setPriceCzk(d.priceCzk);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <p className="text-neutral-500">
      1&nbsp;BTC ={" "}
      <span className="font-medium tabular-nums text-green-500">
        {priceCzk === null ? "…" : `${Math.round(priceCzk).toLocaleString("cs-CZ")} Kč`}
      </span>
    </p>
  );
}
