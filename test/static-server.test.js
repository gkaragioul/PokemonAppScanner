import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

import { resolveRequestPath } from "../tools/static-server.js";

const root = fileURLToPath(new URL("..", import.meta.url));

test("resolveRequestPath returns existing assets", () => {
  const result = resolveRequestPath("/styles.css", root);

  assert.equal(result.statusCode, 200);
  assert.equal(result.filePath.endsWith("styles.css"), true);
});

test("resolveRequestPath reports malformed URLs without throwing", () => {
  const result = resolveRequestPath("/%", root);

  assert.equal(result.statusCode, 400);
});

test("resolveRequestPath reports missing asset files as 404", () => {
  const result = resolveRequestPath("/missing.css", root);

  assert.equal(result.statusCode, 404);
});
