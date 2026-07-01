/**
 * Čistá logika klasifikace zdrojových URL (WS3). Bez sítě → testovatelné.
 *
 * KRITICKÉ: „dead" = VÝHRADNĚ 404/410. Kódy 401/402/403/406/425/429 znamenají
 * „blokuje boty / paywall" (CNBC, MarketWatch, FT, WSJ), NE „mrtvé" — ponechat.
 */
export function classifyStatus(status) {
  if (status >= 200 && status < 300) return "ok";
  if (status === 404 || status === 410) return "dead";
  if (status >= 500) return "error";
  return "blocked"; // ostatní 4xx (401/402/403/406/425/429/…) → konzervativně ponechat
}

export function decideAction({ status, originalUrl, finalUrl, waybackUrl }) {
  const kind = classifyStatus(status);
  if (kind === "ok") {
    if (finalUrl && finalUrl !== originalUrl) return { action: "rewrite", url: finalUrl };
    return { action: "keep", url: originalUrl };
  }
  if (kind === "dead") {
    if (waybackUrl) return { action: "wayback", url: waybackUrl };
    return { action: "remove", url: null };
  }
  // blocked / error → ponechat původní odkaz (funguje pro člověka / přechodné)
  return { action: "keep", url: originalUrl };
}
