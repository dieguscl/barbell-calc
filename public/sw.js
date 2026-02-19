const CACHE_NAME = "barbell-calc-v2";

// Install: pre-cache the app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Only pre-cache the root — other pages share the same JS bundle
      return cache.addAll(["/"]);
    })
  );
  self.skipWaiting();
});

// Activate: clean up old caches and take control immediately
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch handler
self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;
  if (!request.url.startsWith("http")) return;

  const url = new URL(request.url);

  // Next.js static assets (/_next/static/) are immutable (hashed filenames).
  // Use cache-first — no need to hit the network once cached.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Page navigations: network-first, but cache by pathname (ignore query string)
  if (request.mode === "navigate") {
    // Cache key is just the pathname so /results?units=KG&... matches cached /results
    const cacheKey = new Request(url.origin + url.pathname);

    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(cacheKey, clone));
          }
          return response;
        })
        .catch(() => {
          return caches.match(cacheKey).then((cached) => {
            // Fall back to cached page, or root shell as last resort
            return cached || caches.match("/");
          });
        })
    );
    return;
  }

  // All other requests (JS, CSS, fonts, images): network-first with cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => {
        return caches.match(request).then((cached) => {
          return cached || new Response("Offline", { status: 503 });
        });
      })
  );
});
