# Card Scout

Mobile-first personal Pokemon card scanner, value lookup, and PSA helper PWA.

## What it does

- Uses camera or image upload to capture the front of a card.
- Runs OCR in the browser with Tesseract.js to guess the card name or collector number.
- Searches the Pokemon TCG API for matching cards, images, rarity, set, and raw market prices.
- Estimates condition with photo heuristics plus manual sliders for corners, edges, surface, and centering.
- Opens the official PSA cert lookup for already graded slabs.

## Run locally

Any static web server works:

```powershell
python -m http.server 4173
# or
npm.cmd run dev
```

Open `http://localhost:4173`. Camera requires `localhost` or HTTPS.

`npm run dev` starts the small dependency-free server in `tools/static-server.js` on port 4173 (set `PORT` to change it). No `npm install` is needed; there are no runtime dependencies.

## Deploy on Railway

Railway can host the app as a small static Node service:

```powershell
npm.cmd start
```

When connected to GitHub, Railway will install Node dependencies and run
`npm start`. Use the generated HTTPS Railway URL on the phone; camera access
requires HTTPS or localhost. See [docs/deployment/railway.md](./docs/deployment/railway.md).

## What works offline

After the first visit (service worker installs cached assets):

- Full app shell renders: header, scan panel, search, grading, PSA tabs, status strip.
- Styling and all local JavaScript modules execute without a network.
- Grading sliders update grade and rating in real time.
- PSA cert URL builder works (opens in new tab when back online).

## What requires network

- **Card search** (Pokemon TCG API) - fails with an offline message.
- **OCR via Tesseract.js** (CDN-loaded) - fails gracefully with a note to use manual search.
- **Card images** - the API returns image URLs; they only load online.
- **Camera auto-scan** heuristics run offline, but image capture needs no network.

If you go offline, a red "Offline" badge appears in the scan ribbon.

## Data source caveats

- Card identity, set data, images, TCGplayer and Cardmarket prices: [Pokemon TCG API](https://docs.pokemontcg.io/). The free tier has rate limits and does not include graded/PSA values.
- PSA certification lookup: [PSA public API](https://www.psacard.com/publicapi/documentation). Opens the official cert page; no API key is used in this app.
- Paid graded-value API (optional): [PriceCharting API](https://www.pricecharting.com/api-documentation). Not integrated; add a token if needed.
- Image URLs from the API may occasionally return blanks. The app shows a text placeholder when that happens.

See [docs/data/value-sources.md](./docs/data/value-sources.md) for the value-source policy.

## Important grading note

The app cannot produce an official PSA grade. PSA grades require physical inspection and authentication. The in-app grade is only a personal estimate from a photo plus your manual slider input.

## What it touches

- **Camera and photos.** The browser asks for camera permission. Photos and camera frames are processed on your device (OCR and condition heuristics); the app does not upload them.
- **Network.** Card searches send the search text to the [Pokemon TCG API](https://docs.pokemontcg.io/) (`api.pokemontcg.io`), and card images load from its image servers. Tesseract.js is loaded from `cdn.jsdelivr.net` and downloads its OCR engine and English language data from public CDNs. The PSA button opens `psacard.com` in a new tab.
- **Browser storage.** The service worker caches the app files so the shell works offline. Clear the site data in your browser to remove them.
- **Local server.** `tools/static-server.js` listens on all network interfaces (`0.0.0.0`) and serves every file below the folder you start it from. Start it from the project root and only on networks you trust.
- No accounts, API keys, backend, database, or analytics.

## Verification

See [QA.md](./QA.md) for a manual checklist.

```powershell
python -m http.server 4173
# then open http://localhost:4173 and run through QA.md
```

Automated helper tests use Node's built-in test runner:

```powershell
npm.cmd test
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Serve the app with `node tools/static-server.js` |
| `npm start` | Same as `dev` (used by Railway) |
| `npm test` | Run the helper tests with `node --test` |

## Trademarks

Card Scout is an independent fan-made tool. It is not affiliated with or endorsed by Nintendo, The Pokémon Company, Game Freak, Creatures or PSA. Pokémon names and images are trademarks of their owners. Card data, images and prices come from the Pokemon TCG API and remain subject to its terms.

## License

Card Scout is released under the [MIT License](./LICENSE.md).

## Disclaimer

This software is provided "as is", without warranty of any kind, under the MIT License. Use it at your own risk.

- Grades and values are rough estimates from a photo and public price data. They are not appraisals or official PSA grades; do not rely on them when buying or selling cards.
- The app sends your search text to third-party services and loads code from a public CDN; their availability, accuracy and terms are outside this project's control.
- The local server exposes the folder it serves to your network while it runs.
