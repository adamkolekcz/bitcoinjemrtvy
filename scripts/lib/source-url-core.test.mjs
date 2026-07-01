import { test } from "node:test";
import assert from "node:assert/strict";
import { classifyStatus, decideAction } from "./source-url-core.mjs";

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
