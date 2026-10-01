import { test } from "node:test";
import assert from "node:assert/strict";
import { buildSocialMeta, serializeJsonLd } from "./metadata.ts";

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
  const ogType = (type?: "website" | "article") =>
    (buildSocialMeta({ title: "T", description: "D", url: "u", type }).openGraph as { type: string }).type;
  assert.equal(ogType(), "website");
  assert.equal(ogType("article"), "article");
});

test("serializeJsonLd: escapuje </script> (XSS), zůstává validní JSON", () => {
  const data = { name: '</script><script>alert(1)</script>' };
  const out = serializeJsonLd(data);
  assert.ok(!out.includes("<"));
  assert.deepEqual(JSON.parse(out), data);
});

test("buildSocialMeta: twitter má obrázek i titulek", () => {
  const m = buildSocialMeta({ title: "T", description: "D", url: "u" });
  const tw = m.twitter as { title: string; images: string[] };
  assert.equal(tw.title, "T");
  assert.equal(tw.images[0], "/twitter-image");
});
