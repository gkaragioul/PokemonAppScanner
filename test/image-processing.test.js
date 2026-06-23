import test from "node:test";
import assert from "node:assert/strict";

import { fitWithinBox } from "../src/image-processing.js";

test("fitWithinBox scales landscape images without upscaling", () => {
  assert.deepEqual(fitWithinBox(2400, 1200, 1200), {
    width: 1200,
    height: 600,
  });
});

test("fitWithinBox scales portrait images by the longest side", () => {
  assert.deepEqual(fitWithinBox(900, 1800, 1200), {
    width: 600,
    height: 1200,
  });
});

test("fitWithinBox leaves small images at their original size", () => {
  assert.deepEqual(fitWithinBox(600, 800, 1200), {
    width: 600,
    height: 800,
  });
});
