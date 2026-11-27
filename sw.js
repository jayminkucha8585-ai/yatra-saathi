// Service worker: lets the app open offline and be installed.
const CACHE = "yatra-v1";
const SHELL = ["./", "index.html", "app.js", "places.js", "manifest.webmanifest", "icon.svg",
  "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css", "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  if(e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  // Live data (routes, hotels) always from the network
  if(/osrm|overpass/.test(url.host)) return;
  // Map tiles: cache as you browse, so visited areas work offline
  if(url.host.endsWith("tile.openstreetmap.org")){
    e.respondWith(caches.open("yatra-tiles").then(async c => {
      const hit = await c.match(e.request); if(hit) return hit;
      const res = await fetch(e.request); if(res.ok) c.put(e.request, res.clone()); return res;
    }));
    return;
  }
  // App files: network first, fall back to cache
  e.respondWith(fetch(e.request).then(res => {
    if(res.ok && (url.origin === location.origin || url.host === "unpkg.com")) caches.open(CACHE).then(c => c.put(e.request, res.clone()));
    return res;
  }).catch(() => caches.match(e.request)));
});
