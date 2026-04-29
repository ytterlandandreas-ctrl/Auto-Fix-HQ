// Auto Fix HQ — Service Worker
// Caches the app shell + last 50 ROs for offline access; queues writes via IndexedDB.

const CACHE_VERSION = "afhq-v1";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;
const API_CACHE = `${CACHE_VERSION}-api`;

const STATIC_ASSETS = [
  "/",
  "/shop/dashboard",
  "/manifest.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => !key.startsWith(CACHE_VERSION)).map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Don't cache non-GET requests
  if (request.method !== "GET") {
    // For POST/PATCH/DELETE while offline: respond 503 so the app can queue locally
    event.respondWith(
      fetch(request).catch(() =>
        new Response(JSON.stringify({ offline: true, queued: true }), {
          status: 503,
          headers: { "Content-Type": "application/json" },
        })
      )
    );
    return;
  }

  // API requests: network-first, fall back to cache
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(API_CACHE).then((cache) => cache.put(request, clone));
          }
          return res;
        })
        .catch(() => caches.match(request).then((cached) => cached ?? new Response(JSON.stringify({ offline: true }), {
          status: 503,
          headers: { "Content-Type": "application/json" },
        })))
    );
    return;
  }

  // Pages: network-first, fall back to cache
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const clone = res.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, clone));
          return res;
        })
        .catch(() => caches.match(request).then((cached) => cached ?? caches.match("/shop/dashboard")))
    );
    return;
  }

  // Static assets: cache-first
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((res) => {
        if (res.ok && (request.url.includes("/_next/static/") || request.url.endsWith(".js") || request.url.endsWith(".css"))) {
          const clone = res.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
        }
        return res;
      });
    })
  );
});

// Background sync trigger from the app — flushes the offline queue
self.addEventListener("sync", (event) => {
  if (event.tag === "afhq-flush-queue") {
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => client.postMessage({ type: "SYNC_QUEUE" }));
      })
    );
  }
});

// Push notifications (for inbound SMS, RO updates)
self.addEventListener("push", (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || "Auto Fix HQ", {
      body: data.body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: data.url ? { url: data.url } : undefined,
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/shop/dashboard";
  event.waitUntil(self.clients.openWindow(url));
});
