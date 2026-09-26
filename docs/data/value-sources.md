# Value Sources

Card Scout shows informational raw value estimates for a personal collection
helper. It is not an appraisal tool and does not produce official PSA grades.

## Current Source

The app uses the Pokemon TCG API card response fields:

- `tcgplayer.prices.*.market`
- fallback to `mid`
- fallback to `low`
- `cardmarket.prices.averageSellPrice` for display when available

The status strip uses the highest available TCGplayer market-like value as the
single raw value estimate. Result cards can still display multiple variants.

## Caveats

- Pokemon TCG API values are raw market fields, not graded values.
- Some cards have no live price in the API response.
- Card images and values require network access.
- The in-app PSA-style grade is a personal photo estimate only.

## Future Paid Provider

PriceCharting can be added later for graded/value history, but only through a
server-side proxy. Never put a PriceCharting token or paid API key in browser
JavaScript, `index.html`, `manifest.webmanifest`, service worker cache entries,
or any committed static asset.
