import test from "node:test";
import assert from "node:assert/strict";

import {
  formatMoney,
  formatPrices,
  getMarketPrice,
  getValueSummary,
} from "../src/value-providers.js";

test("getMarketPrice chooses the highest available TCGplayer market-like value", () => {
  const card = {
    tcgplayer: {
      prices: {
        normal: { low: 2, mid: 3, market: 4 },
        holofoil: { low: 5, mid: 7 },
      },
    },
  };

  assert.equal(getMarketPrice(card), 7);
});

test("formatPrices includes TCGplayer and Cardmarket values", () => {
  const card = {
    tcgplayer: { prices: { reverseHolofoil: { market: 9.5 } } },
    cardmarket: { prices: { averageSellPrice: 4.25 } },
  };

  assert.equal(
    formatPrices(card),
    "Reverse Holofoil $9.50<br />Cardmarket avg \u20ac4.25",
  );
});

test("formatMoney handles missing values gracefully", () => {
  assert.equal(formatMoney(null), "-");
});

test("getValueSummary reports display value and source", () => {
  const card = {
    tcgplayer: { prices: { normal: { market: 12 } } },
  };

  assert.deepEqual(getValueSummary(card), {
    amount: 12,
    formatted: "$12.00",
    source: "Pokemon TCG API / TCGplayer market fields",
  });
});
