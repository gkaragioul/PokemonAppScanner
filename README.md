# Card Scout

Mobile-first personal Pokemon card scanner and value helper.

## What it does

- Uses camera or image upload to capture the front of a card.
- Runs OCR in the browser with Tesseract.js to guess the card name or collector number.
- Searches the Pokemon TCG API for matching cards, images, rarity, set, and raw market prices.
- Estimates condition with photo heuristics plus manual sliders for corners, edges, surface, and centering.
- Opens the official PSA cert lookup for already graded slabs.

## Data sources

- Card identity, set data, images, TCGplayer and Cardmarket fields: https://docs.pokemontcg.io/
- PSA certification lookup and official API docs: https://www.psacard.com/publicapi/documentation
- Optional graded-value API if you add a paid token later: https://www.pricecharting.com/api-documentation

## Important grading note

The app cannot produce an official PSA grade. PSA grades require physical inspection, authentication, and their grading process. The in-app grade is only a personal estimate from a photo and your manual inspection.

## Run locally

This is a static PWA. Any local web server works:

```powershell
python -m http.server 4173
```

Then open:

```text
http://localhost:4173
```

Camera access usually requires `localhost` or HTTPS.
