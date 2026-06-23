# Latest Release Notes

Date: 2026-06-23
Branch: `feat/m06-production-readiness`

## Summary

Prepared Card Scout as a private, phone-accessible Railway PWA for scanning
Pokemon cards with camera/upload, OCR-assisted search, raw value estimates, and
PSA lookup.

## Completed

- Documented external research sources and licensing posture.
- Added Railway deployment docs and a dependency-free Node static server.
- Added tested search parsing/ranking helpers.
- Added tested value-source helpers and policy docs.
- Added phone scanning improvements: Retake, upload status, resize/contrast
  preprocessing, and responsive toolbar wrapping.
- Hardened service worker cache for split JavaScript modules.
- Added private security and release checklist docs.

## Verification Run

Passed on the PC repo on 2026-06-23:

```powershell
npm.cmd test
node --check src\app.js
node --check sw.js
node --check tools\static-server.js
git diff --check
```

Static server smoke also passed on `http://127.0.0.1:4174` for:

- `/`
- `/styles.css`
- `/src/app.js`
- `/src/card-search.js`
- `/src/image-processing.js`
- `/src/value-providers.js`
- `/sw.js`
- `/manifest.webmanifest`

Manual checks still required on the real phone/Railway URL:

- Camera permission and live preview.
- OCR with an actual card photo.
- Offline reload after first online visit.
- Install prompt behavior where supported by the phone browser.
