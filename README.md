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
- Styling and local JavaScript execute without a network.
- Grading sliders update grade and rating in real time.
- PSA cert URL builder works (opens in new tab when back online).

## What requires network

- **Card search** (Pokemon TCG API) — fails with an offline message.
- **OCR via Tesseract.js** (CDN‑loaded) — fails gracefully with a note to use manual search.
- **Card images** — the API returns image URLs; they only load online.
- **Camera auto‑scan** heuristics run offline, but image capture needs no network.

If you go offline, a red "Offline" badge appears in the scan ribbon.

## Data source caveats

- Card identity, set data, images, TCGplayer and Cardmarket prices: [Pokemon TCG API](https://docs.pokemontcg.io/). The free tier has rate limits and does not include graded/PSA values.
- PSA certification lookup: [PSA public API](https://www.psacard.com/publicapi/documentation). Opens the official cert page; no API key is used in this app.
- Paid graded-value API (optional): [PriceCharting API](https://www.pricecharting.com/api-documentation). Not integrated; add a token if needed.
- Image URLs from the API may occasionally return blanks. The app shows a text placeholder when that happens.

## Important grading note

The app cannot produce an official PSA grade. PSA grades require physical inspection and authentication. The in-app grade is only a personal estimate from a photo plus your manual slider input.

## Verification

See [QA.md](./QA.md) for a manual checklist.

```powershell
python -m http.server 4173
# then open http://localhost:4173 and run through QA.md
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Serve the app with `npx serve .` |
| `npm start` | Same as `dev` |
