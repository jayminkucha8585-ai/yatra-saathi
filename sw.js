// Service worker: opens the app instantly from the phone's storage, then quietly updates in the background.
const CACHE = "yatra-v13";
const SHELL = ["./", "index.html", "style.css", "theme.css", "pro.css", "stays.css", "places.js", "places2.js", "app1.js", "app2.js", "app3.js", "app4.js", "photos.js", "t-sos.js", "t-weather.js", "t-translate.js", "t-guide.js", "t-group.js", "t-lang.js", "t-scripts.js", "t-creator.js", "c-core.js", "auth.js", "me.js", "c-connect.js", "c-posts.js", "c-groupreq.js", "c-licence.js", "stays.js", "stay-detail.js", "nav.js", "home.js", "india.css", "india-data.js", "india.js", "photospots.js", "india2.js", "tools.js", "social.js", "trip.js", "extra.js", "glass.css", "manifest.webmanifest", "icon.svg",
"https://unpkg.com/leaflet@1.9.4/dist/leaflet.css", "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"];
// libraries with fixed versions (Leaflet, Firebase, fonts) never change, so keep them
const LIB = h => h === "unpkg.com" || h === "www.gstatic.com" || h === "fonts.googleapis.com" || h === "fonts.gstatic.com";

self.addEventListener("install", e => {
e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL.map(u => new Request(u, {cache: "reload"})))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE && k !== "yatra-tiles" && k !== "yatra-img").map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// keep at most n items in a cache
const trim = async (name, n) => { const c = await caches.open(name), k = await c.keys(); for(let i = 0; i < k.length - n; i++) await c.delete(k[i]) };
const fromCache = (name, req, limit) => caches.open(name).then(async c => {
const hit = await c.match(req); if(hit) return hit;
const res = await fetch(req); if(res.ok || res.type === "opaque"){ c.put(req, res.clone()); if(limit) trim(name, limit) } return res;
});
self.addEventListener("fetch", e => {
const req = e.request; if(req.method !== "GET") return;
const url = new URL(req.url), h = url.host;
// map tiles and place photos: keep on the phone once seen
if(h.endsWith("tile.openstreetmap.org")){ e.respondWith(fromCache("yatra-tiles", req, 3000)); return }
if(h === "upload.wikimedia.org" || h === "thumb.wikimedia.org"){ e.respondWith(fromCache("yatra-img", req, 400)); return }
if(LIB(h)){ e.respondWith(fromCache(CACHE, req)); return }
// live data (routes, hotels, weather, database) always from the network
if(url.origin !== location.origin) return;
// app files: show the saved copy at once, fetch the newest copy for next time
// (pages are saved under their plain address, so links like ?live=... still update the app)
e.respondWith(caches.open(CACHE).then(async c => {
const nav = req.mode === "navigate", key = nav ? url.origin + url.pathname : req;
const hit = await c.match(key, {ignoreSearch: nav});
const net = fetch(req).then(res => { if(res.ok) c.put(key, res.clone()); return res }).catch(() => hit);
return hit || net;
}));
});
