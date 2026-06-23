const BOILERPLATE_WORDS = new Set([
  "basic",
  "stage",
  "evolves",
  "weakness",
  "resistance",
  "retreat",
  "illus",
  "illustrated",
  "pokemon",
  "trainer",
  "energy",
]);

export function normalizeSearchText(value) {
  return String(value || "")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2019]/g, "'")
    .replace(/[^\p{L}\p{N}/'&.\-\s]/gu, " ")
    .replace(/\s*\/\s*/g, "/")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseSearchInput(input) {
  const clean = normalizeSearchText(input);
  const collector = clean.match(/\b(\d{1,4})\/(\d{1,4})\b/);
  let working = clean;
  let collectorNumber = collector ? collector[1] : "";
  const collectorText = collector ? `${collector[1]}/${collector[2]}` : "";

  if (collectorText) {
    working = working.replace(collectorText, " ");
  }

  const tokens = working.split(/\s+/).filter(Boolean);
  const trailingNumber = tokens.length > 1 && /^\d{1,4}$/.test(tokens[tokens.length - 1])
    ? tokens[tokens.length - 1]
    : "";

  if (!collectorNumber && trailingNumber) {
    collectorNumber = trailingNumber;
    tokens.pop();
  }

  const nameTerms = tokens
    .filter((token) => !/^\d{1,4}$/.test(token))
    .slice(0, 5);

  return {
    clean,
    collectorNumber,
    collectorText,
    nameTerms,
    name: nameTerms.join(" "),
  };
}

export function buildSearchPlan(input) {
  const parsed = parseSearchInput(input);
  const plan = [];
  const seen = new Set();

  function add(reason, apiQuery) {
    if (!apiQuery || seen.has(apiQuery)) return;
    seen.add(apiQuery);
    plan.push({ reason, apiQuery });
  }

  if (parsed.name && parsed.collectorNumber) {
    add("name-and-number", `name:"${parsed.name}*" number:${parsed.collectorNumber}`);
  }

  if (parsed.collectorNumber) {
    add("number-only", `number:${parsed.collectorNumber}`);
  }

  if (parsed.name) {
    add("name-only", `name:"${parsed.name}*"`);
  }

  if (!parsed.name && parsed.collectorText) {
    add("raw-collector-text", `name:"${parsed.collectorText}*"`);
  }

  if (!plan.length && parsed.clean) {
    add("raw", `name:"${parsed.clean}*"`);
  }

  return plan;
}

export function getLikelyQueryFromOcr(text) {
  const clean = normalizeSearchText(text);
  const parsed = parseSearchInput(clean);
  const words = clean
    .replace(parsed.collectorText, " ")
    .split(/\s+/)
    .filter(Boolean);

  const meaningful = [];
  for (let index = 0; index < words.length; index++) {
    const word = words[index];
    const lower = word.toLowerCase();
    if (lower === "hp" && /^\d{1,3}$/.test(words[index + 1] || "")) {
      index += 1;
      continue;
    }
    if (BOILERPLATE_WORDS.has(lower)) continue;
    if (/^\d{1,4}$/.test(word)) continue;
    if (word.length <= 1) continue;
    meaningful.push(word);
  }

  const name = meaningful.slice(0, 3).join(" ");
  if (parsed.collectorText) {
    return name ? `${name} ${parsed.collectorText}` : parsed.collectorText;
  }
  return name;
}

export function rankCardsForSearch(cards, input) {
  const parsed = parseSearchInput(input);
  const expectedName = parsed.name.toLowerCase();
  const terms = parsed.nameTerms.map((term) => term.toLowerCase());
  const expectedNumber = parsed.collectorNumber;

  return [...cards].sort((a, b) => scoreCard(b) - scoreCard(a));

  function scoreCard(card) {
    const cardName = String(card.name || "").toLowerCase();
    const cardNumber = String(card.number || "");
    const setName = String(card.set?.name || "").toLowerCase();
    let score = 0;

    if (expectedNumber && cardNumber === expectedNumber) score += 50;
    if (expectedName && cardName === expectedName) score += 35;
    if (expectedName && cardName.startsWith(expectedName)) score += 25;
    for (const term of terms) {
      if (cardName.includes(term)) score += 10;
      if (setName.includes(term)) score += 3;
    }

    return score;
  }
}
