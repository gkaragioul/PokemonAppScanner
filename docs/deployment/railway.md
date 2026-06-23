# Railway Deployment

Card Scout is a static PWA. It can run on Railway with `npm start`, which starts
the small Node static server in `tools/static-server.js`.

## One-Time Setup

1. Push the reviewed branch to GitHub.
2. In Railway, create a new project from the GitHub repository.
3. Let Railway install Node and run `npm start`.
4. Open the generated Railway HTTPS domain on the phone.
5. Optional: add a custom domain in Railway after the generated domain works.

## Phone Camera Requirements

Phone camera access requires HTTPS or `localhost`. The Railway generated domain
is HTTPS, so camera scanning should work from the phone browser after permission
is granted.

## Environment Variables

No variables are required for the current private app. Do not add paid API tokens
to browser JavaScript. Future paid value sources need a backend/proxy first.

## Verification Checklist

- Railway deployment starts without build errors.
- The Railway URL loads `Card Scout`.
- `manifest.webmanifest`, `styles.css`, `src/app.js`, and `sw.js` return 200.
- Service worker registers after first load.
- Phone camera permission prompt appears.
- Upload fallback works if camera permission is denied.
- Offline reload shows the styled shell after first visit.
