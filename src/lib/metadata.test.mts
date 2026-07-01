import { test } from "node:test";
import assert from "node:assert/strict";
import { buildSocialMeta } from "./metadata.ts";

test("buildSocialMeta: og:image je vždy přítomen", () => {
  const m = buildSocialMeta({ title: "T", description: "D", url: "https://x/y" });
  const imgs = m.openGraph?.images as { url: string }[];
  assert.equal(imgs[0].url, "/opengraph-image");
});

test("buildSocialMeta: og:url === zadané url", () => {
  const m = buildSocialMeta({ title: "T", description: "D", url: "https://x/y" });
  assert.equal(m.openGraph?.url, "https://x/y");
});

test("buildSocialMeta: default type = website, lze přepsat na article", () => {
  assert.equal(buildSocialMeta({ title: "T", description: "D", url: "u" }).openGraph?.type, "website");
  assert.equal(
    buildSocialMeta({ title: "T", description: "D", url: "u", type: "article" }).openGraph?.type,
    "article",
  );
});

test("buildSocialMeta: twitter má obrázek i titulek", () => {
  const m = buildSocialMeta({ title: "T", description: "D", url: "u" });
  const tw = m.twitter as { title: string; images: string[] };
  assert.equal(tw.title, "T");
  assert.equal(tw.images[0], "/twitter-image");
});
