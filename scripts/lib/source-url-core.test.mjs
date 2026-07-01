import { test } from "node:test";
import assert from "node:assert/strict";
import { classifyStatus, decideAction, analyzeRedirect } from "./source-url-core.mjs";

test("classifyStatus: jen 404/410 je dead", () => {
  assert.equal(classifyStatus(404), "dead");
  assert.equal(classifyStatus(410), "dead");
  assert.equal(classifyStatus(403), "blocked");
  assert.equal(classifyStatus(401), "blocked");
  assert.equal(classifyStatus(429), "blocked");
  assert.equal(classifyStatus(200), "ok");
  assert.equal(classifyStatus(503), "error");
});

test("decideAction: ok + jiná finální URL → rewrite", () => {
  assert.deepEqual(
    decideAction({ status: 200, originalUrl: "https://twitter.com/a", finalUrl: "https://x.com/a", waybackUrl: null }),
    { action: "rewrite", url: "https://x.com/a" },
  );
});

test("decideAction: ok + stejná URL → keep", () => {
  assert.deepEqual(
    decideAction({ status: 200, originalUrl: "https://a/b", finalUrl: "https://a/b", waybackUrl: null }),
    { action: "keep", url: "https://a/b" },
  );
});

test("decideAction: dead + wayback → wayback", () => {
  assert.deepEqual(
    decideAction({ status: 404, originalUrl: "https://a/b", finalUrl: "https://a/b", waybackUrl: "https://web.archive.org/web/1/https://a/b" }),
    { action: "wayback", url: "https://web.archive.org/web/1/https://a/b" },
  );
});

test("decideAction: dead bez waybacku → remove (null)", () => {
  assert.deepEqual(
    decideAction({ status: 410, originalUrl: "https://a/b", finalUrl: "https://a/b", waybackUrl: null }),
    { action: "remove", url: null },
  );
});

test("decideAction: blocked → keep original", () => {
  assert.deepEqual(
    decideAction({ status: 403, originalUrl: "https://cnbc.com/x", finalUrl: "https://cnbc.com/x", waybackUrl: null }),
    { action: "keep", url: "https://cnbc.com/x" },
  );
});

test("analyzeRedirect: stejná URL → none", () => {
  assert.equal(analyzeRedirect("https://a.com/x", "https://a.com/x"), "none");
});

test("analyzeRedirect: reálná migrace na článek → safe", () => {
  assert.equal(analyzeRedirect("https://www.spectator.co.uk/2019/03/x", "https://spectator.com/article/crypto-is-dead/"), "safe");
  assert.equal(analyzeRedirect("https://twitter.com/a/status/1", "https://x.com/a/status/1"), "safe");
});

test("analyzeRedirect: GDPR consent zeď → consent", () => {
  assert.equal(analyzeRedirect("https://finance.yahoo.com/news/x-123.html", "https://consent.yahoo.com/v2/collectConsent?sessionId=abc"), "consent");
});

test("analyzeRedirect: redirect na holou homepage → softdead", () => {
  assert.equal(analyzeRedirect("https://mail.whalewire.org/p/bitcoin-scam", "https://mail.whalewire.org/"), "softdead");
});

test("analyzeRedirect: cross-domain root→root (expirovaná doména/takeover) → softdead", () => {
  assert.equal(analyzeRedirect("https://concerned.tech/", "https://90phutcc.tv/"), "softdead");
});

test("analyzeRedirect: same-host http→https homepage → safe (legit upgrade)", () => {
  assert.equal(analyzeRedirect("http://site.com/", "https://site.com/"), "safe");
});

test("decideAction: ok + consent zeď → keep original (ne consent URL!)", () => {
  assert.deepEqual(
    decideAction({ status: 200, originalUrl: "https://finance.yahoo.com/news/x.html", finalUrl: "https://consent.yahoo.com/v2/collectConsent?sessionId=abc", waybackUrl: null }),
    { action: "keep", url: "https://finance.yahoo.com/news/x.html" },
  );
});

test("decideAction: ok + softdead + wayback → wayback", () => {
  assert.deepEqual(
    decideAction({ status: 200, originalUrl: "https://site.org/p/gone", finalUrl: "https://site.org/", waybackUrl: "https://web.archive.org/web/1/https://site.org/p/gone" }),
    { action: "wayback", url: "https://web.archive.org/web/1/https://site.org/p/gone" },
  );
});

test("decideAction: ok + softdead bez waybacku → remove (skrýt, ne homepage/spam)", () => {
  assert.deepEqual(
    decideAction({ status: 200, originalUrl: "https://site.org/p/gone", finalUrl: "https://site.org/", waybackUrl: null }),
    { action: "remove", url: null },
  );
});
