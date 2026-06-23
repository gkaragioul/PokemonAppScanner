import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const manifest = JSON.parse(readFileSync(new URL("../manifest.webmanifest", import.meta.url), "utf8"));
const css = readFileSync(new URL("../styles.css", import.meta.url), "utf8");

test("iOS home screen metadata points at a PNG touch icon", () => {
  assert.match(html, /apple-mobile-web-app-capable" content="yes"/);
  assert.equal(html.includes('rel="apple-touch-icon" sizes="180x180" href="./assets/apple-touch-icon.png"'), true);
});

test("manifest includes PNG install icons alongside the SVG", () => {
  const sources = manifest.icons.map((icon) => icon.src);
  assert.equal(sources.includes("./assets/icon-192.png"), true);
  assert.equal(sources.includes("./assets/icon-512.png"), true);
  assert.equal(sources.includes("./assets/icon.svg"), true);
});

test("hidden scanner media stays hidden even with preview media styles", () => {
  assert.equal(css.includes("[hidden] {\n  display: none !important;\n}"), true);
});
