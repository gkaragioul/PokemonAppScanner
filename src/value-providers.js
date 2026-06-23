export function getMarketPrice(card) {
  const prices = card?.tcgplayer?.prices || {};
  const variants = Object.values(prices);
  const market = variants
    .map((variant) => variant.market || variant.mid || variant.low)
    .filter((value) => typeof value === "number" && Number.isFinite(value));
  return market.length ? Math.max(...market) : null;
}

export function formatPrices(card) {
  const parts = [];
  const prices = card?.tcgplayer?.prices || {};
  Object.entries(prices).forEach(([variant, values]) => {
    const market = values.market || values.mid || values.low;
    if (market) parts.push(`${labelVariant(variant)} ${formatMoney(market)}`);
  });
  if (card?.cardmarket?.prices?.averageSellPrice) {
    parts.push(`Cardmarket avg ${formatMoney(card.cardmarket.prices.averageSellPrice, "EUR")}`);
  }
  return parts.length ? parts.join("<br />") : "No live price on Pokemon TCG API";
}

export function labelVariant(value) {
  return String(value || "")
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (letter) => letter.toUpperCase());
}

export function formatMoney(value, currency = "USD") {
  if (!value) return "-";
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(value);
}

export function getRatingScore(card, grade) {
  if (!card) return null;
  const price = getMarketPrice(card) || 0;
  const rarity = card.rarity || "";
  let score = Math.min(50, Math.round(price / 3));
  score += grade * 4;
  if (/rare|secret|illustration|hyper|ultra/i.test(rarity)) score += 10;
  return Math.min(100, score);
}
