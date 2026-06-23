import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const sw = readFileSync(new URL("../sw.js", import.meta.url), "utf8");

test("service worker caches every local app module needed by index.html", () => {
  for (const path of [
    "./src/app.js",
    "./src/card-search.js",
    "./src/image-processing.js",
    "./src/value-providers.js",
  ]) {
    assert.match(sw, new RegExp(path.replace(/[./-]/g, "\\$&")));
  }
});

test("service worker keeps asset URLs unversioned", () => {
  assert.doesNotMatch(sw, /\?v=/);
});
