# Security Policy

Card Scout is a private family PWA with no backend, database, or user accounts.

## No Secrets In Client Code

The app runs entirely in the browser. No API keys, tokens, or passwords are stored
in `index.html`, `src/app.js`, `sw.js`, `manifest.webmanifest`, or any other
static asset. The Pokemon TCG API v2 is used without authentication.

Any future paid data source (e.g., PriceCharting API) **must** be proxied through
a server-side endpoint so the token is never exposed to the browser.

## Dependency and Source Policy

- The app uses one CDN-loaded runtime dependency: Tesseract.js (MIT license) for
  in-browser OCR. It is loaded from `cdn.jsdelivr.net`.
- No build step, no npm production dependencies, no bundler.
- All source code is hand-written for this project. No GPL code is copied in.
- External data sources (Pokemon TCG API, PSA public cert lookup, TCGdex) are
  used as read-only APIs over HTTPS. No data is vendored from GPL sources.

## Responsible Disclosure

This is a private project with no public attack surface beyond the static files
served by Railway. If you discover a vulnerability in the app or its dependencies:

- Contact: George Karangioules (in-progress: add email or GitHub handle)
- Do not file public issues for security bugs.

## Reporting

Security patches follow the normal branch-and-review workflow. Critical fixes
may skip milestone review with explicit approval.
