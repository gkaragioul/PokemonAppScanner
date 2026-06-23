# Card Scout — Current Scanner Capabilities

> Document date: 2026-06-23
> Based on commit: `43e42e6` "Bump PWA cache for hidden scanner media fix"
> Written on the `audit/current-scanner-capabilities` branch, since merged into `main`

---

## What the Scanner Does Today

### 1. Camera Capture

**Module:** `app.js` → `startCamera()` / `getCameraStream()`

- Requests rear camera first (`facingMode: { ideal: "environment" }`) at up to 1280x720.
- Falls back to any camera, then to generic video.
- Camera stream is stored in `state.cameraStream` and attached to the `<video>` element.

**Behavior:**
- Camera stream starts when user taps Camera button.
- Stream remains live while user taps Analyze.
- After capture, `showLiveCamera()` resumes stream if `keepCameraLive` is true (auto-scan case).
- If stream is lost or permission denied, user gets a status message to use Upload instead.

### 2. Card Candidate Detection

**Module:** `app.js` → `detectCardCandidate()`

Uses rough edge detection on a 180×120 canvas sample:

1. Convert video frame to grayscale.
2. Compute average brightness.
3. For every other pixel, compute horizontal + vertical edge gradient.
4. Count pixels above edge threshold (>54) as "edge pixels".
5. Find bounding box of all edge pixels.
6. Compute: fill ratio, aspect ratio, edge density.

Decision: `found = fill > 0.18 && fill < 0.82 && aspect > 1.15 && aspect < 2.15 && edgeDensity > 0.045`

**What this detects:** A rectangular card-like region covering roughly 18-82% of the frame with moderate edges. It is NOT specific to Pokemon cards — any rectangular object with enough contrast edges will pass.

**Stability check:** `checkForCardInCamera()` runs every 850ms. Requires 2 consecutive stable frames (movement < 18 units) before auto-triggering analyze. `lastAutoScanAt` prevents re-trigger within 8 seconds.

**Failure modes:**
- Glare or dark lighting → edge density drops → no detection
- Card too small → fill ratio too low → no detection
- Non-card rectangular object → might pass as false positive
- Rapid movement → stability fails → no auto-analyze (manual tap still works)

### 3. Image Preprocessing

**Module:** `app.js` → `preprocessImage()`

1. `fitWithinBox()` resizes to max 1400px on longest side.
2. Draw to canvas with `filter: "contrast(1.08) brightness(1.04)"`.
3. Export as JPEG at 0.86 quality.

**Limitation:** No region detection — the entire card image goes to OCR. No deskewing, no crop-to-card-bounds, no orientation normalization.

### 4. OCR

**Module:** `app.js` → `analyzeImage()` + `card-search.js` → `getLikelyQueryFromOcr()`

- Uses Tesseract.js v5 loaded from `cdn.jsdelivr.net`.
- Runs on the full preprocessed image (no region targeting).
- Raw OCR text is shown in the UI as-is.
- `getLikelyQueryFromOcr()` cleans the text:
  - Removes Unicode smart quotes, apostrophes
  - Keeps letters, numbers, slashes, some punctuation
  - Filters out boilerplate terms: `basic`, `stage`, `evolves`, `weakness`, `resistance`, `retreat`, `illus`, `illustrated`, `pokemon`, `trainer`, `energy`
  - Skips `HP` followed by a number (skip the number too)
  - Takes first 3 meaningful words as the name
  - Extracts collector number pattern `\d+/\d+`
  - Returns combined query like `"Pikachu 58/102"` or just `"58/102"`

**Failure modes:**
- Dark/unreadable image → Tesseract returns blank text
- Glare over text → garbled text
- Card not in English → English OCR fails
- Very blurry text → wrong characters
- Card rotated 90° → OCR reads wrong fields
- White-border card → border text mixed in

### 5. Query Strategy

**Module:** `card-search.js` → `buildSearchPlan()`

Fallback sequence:
1. `name:"<name>*" number:<number>` (if both extracted)
2. `number:<number>` (number only)
3. `name:"<name>*"` (name only)
4. `name:"<collector text>*"` (raw collector text like "58/102") as last resort

**Limitation:** Name matching uses `*` wildcard suffix, which is broad. No fuzzy matching at query time — relies on Pokemon TCG API's backend matching. Collector number is a single integer (not the full `NN/MM` format), so "58/102" extracts `58` as the number. If two cards share the same number prefix (e.g., Pikachu 58 from different sets), both may appear.

### 6. Result Ranking

**Module:** `card-search.js` → `rankCardsForSearch()`

Scoring:
- Exact collector number match: +50
- Exact name match: +35
- Name prefix match: +25
- Name substring per term: +10
- Set name substring per term: +3

First card (highest score) is auto-selected. User can tap a different result to re-select.

**Limitation:** No confidence score is exposed in the UI. A card with score 50 from an exact match and a card with score 13 from a partial match both look the same to the user — the only difference is auto-selection order.

### 7. Real Data

**Source:** `https://api.pokemontcg.io/v2/cards` (Pokemon TCG API v2, no auth)

- Card identity, images, set, number, rarity: real from API
- Prices: `tcgplayer.prices.*.{market|mid|low}` — raw market fields, real where available
- Cardmarket: `cardmarket.prices.averageSellPrice` — EUR, real where available
- Missing prices: clearly shown as "No live price on Pokemon TCG API"

**What is NOT real:**
- No PSA graded values (PSA lookup requires physical cert, not price data)
- No PriceCharting integration (would need paid API + server proxy)
- The `ratingValue` score is a computed personal estimate, not a market valuation

### 8. Condition Estimation

**Module:** `app.js` → `estimateCondition()` / `scoreEdges()` / `scoreCentering()`

- Corners + Edges: Uses `scoreEdges()` — samples pixels near the image edges, counts bright (whitened) pixels as wear indicators. Returns score 4-10.
- Surface: Average of edge + centering scores, clamped 4-9.
- Centering: Scans horizontal midline brightness, finds left/right border transitions, computes left/right ratio. Returns 5-10.

**Limitation:** This is heuristic-only. It cannot distinguish whitening from ambient lighting, print lines from scratches, or centering errors from photographed skew.

### 9. Grading UI

**Module:** `app.js` → `updateGradeFromSliders()` / `getGradeFromSliders()`

User can adjust 4 sliders (corners, edges, surface, centering). Grade is the average, rounded to nearest integer 1-10.

**What it is:** A personal photo-based estimate. NOT an official PSA grade. The grade note text changes at thresholds (9+, 7+, below 7) with appropriate warnings.

### 10. PSA Lookup

**Module:** `app.js` → PSA button click

Opens `https://www.psacard.com/cert/<certNumber>` in new tab. Empty cert input opens the base cert page. No API key required — public PSA web lookup.

---

## What Works

- Manual card search by name or collector number works reliably via Pokemon TCG API
- Camera upload path works on iOS/Android via file input
- PWA installs on iPhone Home Screen with Pokeball icon
- Service worker caches app shell for offline UI
- Grading sliders update live
- No play-button overlay on hidden scanner elements (v10 cache fix)
- All 17 automated tests pass

---

## What Fails

| Failure | Cause | Workaround |
|---------|-------|------------|
| OCR returns nothing on blurry/dark photo | Tesseract.js quality threshold | Use manual search |
| Auto-scan does not trigger in low light | Edge density < threshold | Tap Analyze manually |
| Camera permission denied on iOS | Browser security | Use Upload instead |
| No match found for uncommon card | API has limited set coverage | Search by name only |
| Price shows "-" | API doesn't have price for that card | Expected for many older commons |
| Play-button overlay appears (old session) | Old cached CSS (pre-v10) | Clear browser/site data |

---

## What Needs iPhone Physical Testing

- [ ] Camera permission prompt flow on iOS Safari
- [ ] Add to Home Screen icon rendering on iOS
- [ ] Camera resume after app switch to background and back
- [ ] Orientation handling (portrait/landscape)
- [ ] Service worker update prompt behavior on iOS
- [ ] Auto-scan stability in real indoor lighting
- [ ] Tesseract.js CDN load time on mobile network
- [ ] Large photo upload handling on iPhone Photos app

---

## External APIs and CDNs Used

| Source | Purpose | URL |
|--------|---------|-----|
| Tesseract.js v5 | In-browser OCR | `cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js` |
| Pokemon TCG API v2 | Card data, images, prices | `api.pokemontcg.io/v2/cards` |
| PSA cert lookup | Open cert page | `psacard.com/cert/<number>` |
| Railway hosting | Live PWA deployment | `<your-app>.up.railway.app` |

---

## Offline Behavior

- App shell: **works offline** (service worker caches index.html, styles.css, all src/*.js, manifest, assets)
- Card search: **requires network** (Pokemon TCG API)
- Tesseract.js OCR: **requires network** (CDN-loaded, not cached by service worker)
- Grading sliders: **work offline** (local JS)
- PSA cert lookup: **opens in new tab** when online, fails gracefully offline

---

## Files and Modules

```
src/app.js                  — UI orchestration, camera, analyze, state
src/card-search.js          — query planning, OCR cleanup, result ranking
src/image-processing.js     — fitWithinBox resize helper
src/value-providers.js      — price formatting, market price, rating score
sw.js                       — service worker, cache v10, asset list
tools/static-server.js      — Node static server for local dev / Railway
```

No server-side code. No database. No authentication.

---

## Accuracy Statement

The scanner can reliably identify a Pokemon card when:
1. The card is well-lit, flat, and facing the camera directly.
2. The card name and collector number are clearly printed and visible in the photo.
3. The Pokemon TCG API has an exact match for the name+number combination.
4. The card is from a set the API has indexed.

The scanner cannot reliably identify a card when:
- The photo is blurry, dark, or has glare covering text.
- The card name is partially obscured.
- The collector number is worn/damaged.
- The card is from a set or variant the API doesn't index.
- The card art is the only distinguishing feature (two similar-looking cards).

When uncertain, the app shows the OCR text and lets the user manually search or select from results. It does NOT pretend to be certain when it isn't.