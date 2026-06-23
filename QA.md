# Card Scout — QA checklist

Run from the project root:

```powershell
python -m http.server 4173
```

Open `http://localhost:4173` in Chrome or Edge Dev (supports PWAs).

---

## 1. App loads

- [ ] Page title reads **"Card Scout"**.
- [ ] Pokéball logo, heading, camera preview, and search input are visible.
- [ ] Console has **zero 404s** for local assets (`styles.css`, `src/app.js`, `assets/icon.svg`, `manifest.webmanifest`, `favicon.ico`).
- [ ] Scanner scan-line animation plays in the preview box.

## 2. Manual search

| Query | Expected |
|-------|----------|
| `Charizard` | Returns 12 result cards (or up to 12). First card auto-selected. |
| `Pikachu` | Returns Pikachu cards. |
| `Pikachu 58` | Returns cards matching Pikachu number 58. |
| `Pikachu 58/102` | Returns cards matching Pikachu number 58. |
| `Pikachu 58 58/102` | Same as above; duplicate number does not break query. |

- [ ] All five queries return sensible results.
- [ ] Collector-number-only query `58/102` returns results or a clear no-results message (no crash).
- [ ] Trash query `zzzzznotacard` shows: *"No cards found"* with suggestion text.

## 3. Search edge cases

- [ ] Search button does not leave a stale *"Searching Pokemon TCG API…"* status.
- [ ] Click **Select** on a result card — the card gets a teal border highlight.
- [ ] Grading sliders update the **Likely grade** and **Rating** in the status strip.
- [ ] **PSA cert** button with a number opens `https://www.psacard.com/cert/<number>`.
- [ ] **PSA cert** button empty opens `https://www.psacard.com/cert/`.

## 4. Image fallback

- [ ] If a card image fails to load, a placeholder with the card name and set appears (no broken-image icon, layout does not shift).

## 5. PWA / offline

- [ ] Service worker registered (`Application > Service Workers` in DevTools).
- [ ] **Install button** appears in the top bar (Chrome prompts may also fire on desktop).
- [ ] Disable browser HTTP cache (`Network > Disable cache`), reload — app shell still renders with full CSS and JS.
- [ ] Go offline (DevTools `Network > Offline`), reload — the styled shell loads; a red "Offline" badge appears in the scan ribbon.
- [ ] While offline, search shows *"You are offline"* message.
- [ ] Go back online — status message updates.

## 6. Camera / OCR

- [ ] **Camera** button requests camera permission.
- [ ] **Upload** opens a file picker.
- [ ] **Analyze** with a card photo runs OCR (if online) and condition estimation.
- [ ] If Tesseract CDN is blocked (offline), OCR gracefully reports: *"Tesseract OCR is not available offline."*
- [ ] Condition sliders update after analysis.

## 7. Responsive

- [ ] At 375 px wide: layout is single-column, buttons stack, text is readable.
- [ ] At 1024 px wide: wider shell (max 700px), preview aspect-ratio switches to 16/10, layout is comfortable.

## 8. Grading tab

- [ ] Sliders adjust corners (1–10), edges, surface, centering.
- [ ] Estimated grade text updates in real time.
- [ ] Grade description text changes at thresholds (9+, 7+, below 7).

## 9. Console

- [ ] No uncaught exceptions during normal use.
- [ ] No `favicon.ico` 404 in the Network tab.

---

## Quick smoke (no browser)

If you only need to verify file integrity:

```powershell
# Check required files exist
if (-not (Test-Path "index.html")) { "MISSING index.html" }
if (-not (Test-Path "styles.css")) { "MISSING styles.css" }
if (-not (Test-Path "src/app.js")) { "MISSING src/app.js" }
if (-not (Test-Path "sw.js")) { "MISSING sw.js" }
if (-not (Test-Path "manifest.webmanifest")) { "MISSING manifest.webmanifest" }
if (-not (Test-Path "assets/icon.svg")) { "MISSING assets/icon.svg" }
"All expected files present."

# Verify no ?v=N query strings in index.html
$html = Get-Content "index.html" -Raw
if ($html -match '\?v=\d+') { "WARNING: versioned asset URL found in index.html" } else { "No versioned URLs — OK" }

# Verify SW caches unversioned paths
$sw = Get-Content "sw.js" -Raw
if ($sw -match '\?v=') { "WARNING: versioned path in sw.js" } else { "SW uses clean paths — OK" }

# Verify CACHE_NAME is not v4
if ($sw -match "card-scout-v4") { "WARNING: old CACHE_NAME" } else { "CACHE_NAME updated — OK" }
```

## Automated helper tests

```powershell
npm.cmd test
node --check src\app.js
```

Expected:

- [ ] Search planner prioritizes name + collector number, then number-only, then name-only.
- [ ] `Pikachu 58`, `Pikachu 58/102`, and `58/102` produce useful API queries.
- [ ] OCR cleanup removes card boilerplate without dropping the likely name.
- [ ] Result ranking prefers exact name and collector-number matches.
- [ ] Value formatting handles TCGplayer, Cardmarket, and missing prices.
