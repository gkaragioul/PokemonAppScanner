const CACHE_NAME = "card-scout-v6";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./src/app.js",
  "./manifest.webmanifest",
  "./assets/icon.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (url.pathname === "/favicon.ico") {
    event.respondWith(
      caches.match("./assets/icon.svg").then((cached) => {
        if (cached) return cached;
        return fetch("./assets/icon.svg");
      })
    );
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).catch(() => {
          if (request.mode === "navigate") {
            return caches.match("./index.html");
          }
          return new Response("", { status: 503 });
        });
      })
    );
    return;
  }

  event.respondWith(
    fetch(request).catch(() => {
      if (url.href.includes("api.pokemontcg.io")) {
        return new Response(
          JSON.stringify({ error: "offline", message: "Search needs an internet connection." }),
          { status: 503, headers: { "Content-Type": "application/json" } }
        );
      }
      return new Response("", { status: 503 });
    })
  );
});
