# Release Checklist

Use this checklist before each deploy or before merging the production-readiness
milestone into `master`.

---

## 1. Railway Deploy

- [ ] Branch pushed to GitHub.
- [ ] Railway project connected to the GitHub repo.
- [ ] Railway detects `package.json` and runs `npm start`.
- [ ] Railway generated HTTPS URL loads the app without errors.
- [ ] No build step required (static PWA).

## 2. Phone Camera Test

- [ ] Open the Railway URL on an iPhone and Android device.
- [ ] Camera permission prompt appears.
- [ ] Grant permission — camera feed shows in the preview box.
- [ ] Tap Analyze — card is captured, condition estimated, OCR runs.
- [ ] Upload fallback works (camera blocked or unavailable).
- [ ] Retake button returns to live camera.

## 3. Manual QA

- [ ] Search `Charizard` — returns results, first result auto-selected.
- [ ] Search `Pikachu 58/102` — returns matching cards.
- [ ] Search `58/102` — returns results or clear no-results message.
- [ ] Search `zzzzznotacard` — shows "No cards found" with suggestion.
- [ ] Select a different result — value and rating update.
- [ ] Grading sliders adjust — grade and rating update.
- [ ] PSA cert lookup opens the correct PSA URL.

## 4. Offline / PWA Test

- [ ] First visit loads the app shell.
- [ ] Service worker registers (check Application > Service Workers).
- [ ] Go offline, reload — styled shell renders.
- [ ] Red "Offline" badge appears in the scan ribbon.
- [ ] Offline search shows clear offline message.
- [ ] Come back online — status message updates.

## 5. API Failure Test

- [ ] Disconnect network, search — offline message appears.
- [ ] Reconnect, search — results return.
- [ ] If Pokemon TCG API is down, error message appears (not a crash).

## 6. Rollback Plan

- [ ] Previous working commit is tagged or noted.
- [ ] Railway deployment can be rolled back to the previous successful deploy.
- [ ] If custom domain is used, DNS points to Railway and can be switched.
