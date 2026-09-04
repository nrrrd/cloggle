/* Cloggle service worker — offline support for solo play.
   Bump CACHE_VERSION on every deploy: the old cache is deleted on activate,
   and phones pick the new version up on their next online launch. */
const CACHE_VERSION = "v1";
const CACHE = `cloggle-${CACHE_VERSION}`;

/* Every local asset. Anything missing is skipped rather than failing the whole
   install, so adding a file here before it exists can't brick the worker. */
const PRECACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png",
];

/* Hosts that must always go straight to the network — never cached, never
   served stale, never failed over to a cache entry. */
const BYPASS = /(^|\.)(firebaseio\.com|firebaseapp\.com|firebasedatabase\.app|googleapis\.com|gstatic\.com|google-analytics\.com|firebase\.com)$/i;

self.addEventListener("install", e => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await Promise.allSettled(PRECACHE.map(u => cache.add(new Request(u, { cache: "reload" }))));
    self.skipWaiting();
  })());
});

self.addEventListener("activate", e => {
  e.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.map(n => (n.startsWith("cloggle-") && n !== CACHE) ? caches.delete(n) : null));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;   /* cross-origin (Firebase/gstatic included): untouched */
  if (BYPASS.test(url.hostname)) return;

  /* Network first, so an online launch always sees the freshest deploy;
     cache is the fallback when the network is gone or slow to fail. */
  e.respondWith((async () => {
    try {
      const res = await fetch(req);
      if (res && res.ok && res.type === "basic") {
        const cache = await caches.open(CACHE);
        cache.put(req, res.clone());
      }
      return res;
    } catch (err) {
      const hit = await caches.match(req, { ignoreSearch: true });
      if (hit) return hit;
      if (req.mode === "navigate") {
        const shell = await caches.match("./index.html");
        if (shell) return shell;
      }
      throw err;
    }
  })());
});
