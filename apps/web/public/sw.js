const CACHE = "akb-public-v1.1";
const SAFE_PAGES = [
  "/",
  "/projects",
  "/journal",
  "/knowledge",
  "/pravaah",
  "/lab",
  "/offline",
];
const PRIVATE_PREFIXES = [
  "/api/",
  "/admin",
  "/contact",
  "/resume",
  "/privacy",
  "/guardian-consent",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(["/offline", "/app-icon.svg"])),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)),
        ),
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  if (PRIVATE_PREFIXES.some((prefix) => url.pathname.startsWith(prefix)))
    return;

  if (request.mode === "navigate") {
    const safe = SAFE_PAGES.some(
      (path) =>
        url.pathname === path ||
        (path !== "/" && url.pathname.startsWith(`${path}/`)),
    );
    if (!safe) return;
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok)
            caches
              .open(CACHE)
              .then((cache) => cache.put(request, response.clone()));
          return response;
        })
        .catch(
          async () =>
            (await caches.match(request)) || (await caches.match("/offline")),
        ),
    );
    return;
  }

  if (["style", "script", "font", "image"].includes(request.destination)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok)
              caches
                .open(CACHE)
                .then((cache) => cache.put(request, response.clone()));
            return response;
          }),
      ),
    );
  }
});
