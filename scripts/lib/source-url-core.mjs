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

/**
 * Co znamená finální URL vůči původní (po follow redirects):
 *   - "none"     — beze změny (žádný redirect)
 *   - "safe"     — legitimní přesun na reálný obsah (jiná doména/cesta) → přepsat
 *   - "consent"  — GDPR/consent/cookie brána (consent.yahoo.com, guce.*) → obsah je
 *                  platný, jen gated; přepsat NELZE (ephemeral sessionId) → nech originál
 *   - "softdead" — redirect na holou homepage, zatímco originál měl cestu → článek pryč
 */
export function analyzeRedirect(originalUrl, finalUrl) {
  if (!finalUrl || finalUrl === originalUrl) return "none";
  let o, f;
  try { o = new URL(originalUrl); f = new URL(finalUrl); } catch { return "none"; }
  if (/(^|\.)(consent|guce)\./i.test(f.hostname) || /consent|gdpr|cookie/i.test(f.pathname)) return "consent";
  const fPath = f.pathname.replace(/\/+$/, "");
  const oPath = o.pathname.replace(/\/+$/, "");
  // Redirect končící na holé homepage → článek pryč: buď originál měl cestu (article→home),
  // nebo se změnila doména (root→root jiné domény = expirovaná doména / takeover na spam).
  if (fPath === "" && (oPath !== "" || f.hostname !== o.hostname)) return "softdead";
  return "safe";
}

export function decideAction({ status, originalUrl, finalUrl, waybackUrl }) {
  const kind = classifyStatus(status);
  if (kind === "ok") {
    const redir = analyzeRedirect(originalUrl, finalUrl);
    if (redir === "safe") return { action: "rewrite", url: finalUrl };
    if (redir === "softdead") {
      // Článek pryč (redirect na homepage / expirovaná doména) → Wayback; jinak skrýt
      // (NE keep — originál by vedl na homepage nebo na spam z převzaté domény).
      if (waybackUrl) return { action: "wayback", url: waybackUrl };
      return { action: "remove", url: null };
    }
    // "none" (beze změny) nebo "consent" (gated) → nech originál
    return { action: "keep", url: originalUrl };
  }
  if (kind === "dead") {
    if (waybackUrl) return { action: "wayback", url: waybackUrl };
    return { action: "remove", url: null };
  }
  // blocked / error → ponechat původní odkaz (funguje pro člověka / přechodné)
  return { action: "keep", url: originalUrl };
}
