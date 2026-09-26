# Research Sources

This project is a small open-source app. Keep source use boring and clean:
document what we read, avoid copying GPL code, never commit secrets, and do not
vendor large datasets unless there is a clear reason.

| Source | URL | License / status | Repo use | Notes |
| --- | --- | --- | --- | --- |
| Pokemon TCG API docs | https://docs.pokemontcg.io/ | Public API documentation | Safe reference | Current app uses the v2 cards endpoint for live search and pricing fields. |
| PokemonTCG data | https://github.com/PokemonTCG/pokemon-tcg-data | License not verified in the repository page checked | Reference only unless license is verified | Raw JSON backing the Pokemon TCG API. Good for schema examples and small fixtures if terms are confirmed. |
| TCGdex cards database | https://github.com/tcgdex/cards-database | MIT license shown in repository navigation | Safe reference; small vendored fixtures only if needed | Multilingual Pokemon TCG card data and pictures. Prefer API/reference use over vendoring the full database. |
| TCGdex API | https://tcgdex.dev/ | Public API/documentation | Safe reference | Useful future fallback for multilingual card metadata. |
| pokemon-card-recognizer | https://github.com/prateekt/pokemon-card-recognizer | GPL-3.0 | Reference only | Useful ideas around visual references. Do not copy code or prebuilt references into this app without accepting GPL obligations. |
| Pokemon-Card-Scanning-Webapp | https://github.com/ShreyShingala/Pokemon-Card-Scanning-Webapp | License not verified | Architecture reference only | Uses YOLOv8, OCR, CLIP, and FAISS. Good inspiration for a future server-side recognition service, not for copying code. |
| Railway static hosting | https://docs.railway.com/guides/static-hosting | Documentation | Safe reference | Railway can host static apps with HTTPS and custom domains. HTTPS is required for phone camera access. |
| PriceCharting API | https://www.pricecharting.com/api-documentation | Paid/commercial API docs | Future backend only | Never expose a token in the browser. Add a server/proxy first if this is used. |

## Decision

For the current app, use live Pokemon TCG API data first. Keep heavyweight
recognition models and full datasets out of Git. If recognition accuracy needs a
major jump later, add a backend milestone with explicit licensing and hosting
cost review.
