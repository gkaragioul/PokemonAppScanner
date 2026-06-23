# Current Architecture

Card Scout is a static browser PWA. It has no backend and no database.

## Runtime Flow

1. The user opens the Railway HTTPS URL on a phone.
2. The app loads `index.html`, `styles.css`, `src/app.js`, and `sw.js`.
3. The user starts the camera or uploads a card photo.
4. The app shows either the live camera or captured preview.
5. Analyze captures/resizes the image, estimates visible condition, and tries OCR
   with Tesseract.js from the CDN.
6. OCR text is cleaned into a likely card query.
7. The app searches `https://api.pokemontcg.io/v2/cards`.
8. Results render with card image, set, number, rarity, and live raw price fields
   where the API provides them.
9. Selecting a result updates raw value and a personal rating score.
10. PSA lookup opens the official PSA cert page in a new tab.

## Offline Behavior

The service worker caches the app shell after the first load. Offline mode keeps
the UI available, grading sliders usable, and PSA URL creation available. Live
card search, card images, and CDN OCR still require network.

## Boundaries

- No secrets in client code.
- No paid API calls from the browser.
- No GPL code copied into this repo.
- No large card image/model datasets committed to Git.
