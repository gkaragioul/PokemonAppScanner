# Security Policy

Card Scout is a static PWA with no backend, database, or user accounts.

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

## Reporting a Vulnerability

The app has no attack surface beyond the static files served by its host (for
example Railway) and the local development server in `tools/static-server.js`.
If you discover a vulnerability in the app or its dependencies:

- Report it privately through GitHub's private vulnerability reporting
  (the repository's **Security** tab, then **Report a vulnerability**) when that
  option is available.
- Otherwise open a GitHub issue that describes the problem in general terms,
  without exploit details, and ask for a private follow-up.

## Fixes

Security patches follow the normal branch-and-review workflow. Critical fixes
may skip milestone review with explicit approval.
