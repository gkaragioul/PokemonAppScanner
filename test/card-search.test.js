import test from "node:test";
import assert from "node:assert/strict";

import {
  buildSearchPlan,
  getLikelyQueryFromOcr,
  rankCardsForSearch,
} from "../src/card-search.js";

test("buildSearchPlan prioritizes name plus collector number", () => {
  const plan = buildSearchPlan("Pikachu 58/102");

  assert.deepEqual(plan.map((entry) => entry.reason), [
    "name-and-number",
    "number-only",
    "name-only",
  ]);
  assert.equal(plan[0].apiQuery, 'name:"Pikachu*" number:58');
  assert.equal(plan[1].apiQuery, "number:58");
  assert.equal(plan[2].apiQuery, 'name:"Pikachu*"');
});

test("buildSearchPlan treats a single trailing number as collector number", () => {
  const plan = buildSearchPlan("Pikachu 58");

  assert.equal(plan[0].apiQuery, 'name:"Pikachu*" number:58');
});

test("buildSearchPlan supports collector-number-only searches", () => {
  const plan = buildSearchPlan("58/102");

  assert.deepEqual(plan.map((entry) => entry.apiQuery), [
    "number:58",
    'name:"58/102*"',
  ]);
});

test("getLikelyQueryFromOcr removes card boilerplate and keeps useful text", () => {
  const query = getLikelyQueryFromOcr("BASIC Pikachu HP 60 Thunder Jolt weakness resistance retreat 58 / 102");

  assert.equal(query, "Pikachu Thunder Jolt 58/102");
});

test("rankCardsForSearch prefers exact name and number matches", () => {
  const cards = [
    { name: "Raichu", number: "58", set: { name: "Other" } },
    { name: "Pikachu V", number: "58", set: { name: "Sword & Shield" } },
    { name: "Pikachu", number: "12", set: { name: "Base Set" } },
  ];

  const ranked = rankCardsForSearch(cards, "Pikachu 58/102");

  assert.equal(ranked[0].name, "Pikachu V");
  assert.equal(ranked[0].number, "58");
});
