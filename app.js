// Yatra Saathi — main app logic
(() => {
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const store = {
  get(k, d){ try { return JSON.parse(localStorage.getItem("ys-"+k)) ?? d } catch(e){ return d } },
  set(k, v){ try { localStorage.setItem("ys-"+k, JSON.stringify(v)) } catch(e){} }
};
const rupee = n => "₹" + (Math.round(n/10)*10).toLocaleString("en-IN");
const hm = h => { const m = Math.round(h*60); return m < 60 ? m+" min" : Math.floor(m/60)+" h"+(m%60 ? " "+m%60+" min" : "") };
function km(a, b){ const R=6371, r=Math.PI/180, dl=(b.lat-a.lat)*r, dg=(b.lng-a.lng)*r;
  const x=Math.sin(dl/2)**2+Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.sin(dg/2)**2; return 2*R*Math.asin(Math.sqrt(x)) }
const COL = {Monument:"#b3261e",Wildlife:"#8a5a12",Temple:"#c2410c",Island:"#0f8f88",Beach:"#0f8f88",Nature:"#4d5a1e",Heritage:"#1f2a5c","Hill station":"#4d5a1e"};

// ---------- state ----------
let me = store.get("me", {lat:23.03, lng:72.58, name:"Ahmedabad", live:false});
let sel = store.get("sel", null), favs = new Set(store.get("favs", [])), tier = 0, follow = true;
const routeCache = {};

// ---------- map ----------
const map = L.map("map", {zoomControl:true}).setView([me.lat, me.lng], 7);
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);
const meMarker = L.marker([me.lat, me.lng], {icon: L.divIcon({className:"", html:'<div class="me"></div>', iconSize:[18,18]})}).addTo(map);
const accCircle = L.circle([me.lat, me.lng], {radius:0, color:"#1f2a5c", weight:1, fillOpacity:.08}).addTo(map);
let routeLine = null;
const pins = {};
PLACES.forEach(p => {
  pins[p.id] = L.marker([p.lat, p.lng], {icon: pinIcon(false), title: p.n}).addTo(map).on("click", () => openPlace(p.id));
});
function pinIcon(on){ return L.divIcon({className:"", html:`<div class="pin${on?" on":""}"></div>`, iconSize:[28,28], iconAnchor:[14,28]}) }
map.on("dragstart", () => setFollow(false));

function setFollow(v){ follow = v; $("#follow").textContent = v ? "Following you" : "Follow me"; if(v) map.setView([me.lat, me.lng], Math.max(map.getZoom(), 13)) }
$("#follow").onclick = () => setFollow(!follow);

// ---------- live GPS ----------
const status = $("#status");
function onPos(p){
  const first = !me.live;
  me = {lat:p.coords.latitude, lng:p.coords.longitude, name:"your location", live:true};
  store.set("me", me);
  meMarker.setLatLng([me.lat, me.lng]); accCircle.setLatLng([me.lat, me.lng]).setRadius(p.coords.accuracy);
  status.textContent = `Live GPS on · accurate to ${Math.round(p.coords.accuracy)} m`;
  if(follow || first) map.setView([me.lat, me.lng], first ? 13 : map.getZoom());
  if(first){ renderPlaces(); updateRoute() }
}
function onErr(e){
  status.textContent = e.code === 1 ? "Location blocked. Allow location for this site in Chrome settings." : "Waiting for GPS signal…";
}
if("geolocation" in navigator){
  navigator.geolocation.watchPosition(onPos, onErr, {enableHighAccuracy:true, maximumAge:10000, timeout:20000});
} else status.textContent = "This browser has no GPS support.";

// ---------- real road route (OSRM) ----------
async function getRoute(p){
  const key = `${me.lat.toFixed(3)},${me.lng.toFixed(3)}>${p.id}`;
  if(routeCache[key]) return routeCache[key];
  try{
    const r = await fetch(`https://router.project-osrm.org/route/v1/driving/${me.lng},${me.lat};${p.lng},${p.lat}?overview=full&geometries=geojson`);
    const j = await r.json();
    if(j.code !== "Ok") throw 0;
    const rt = j.routes[0];
    return routeCache[key] = {km: rt.distance/1000, hrs: rt.duration/3600, line: rt.geometry.coordinates.map(c => [c[1], c[0]]), live:true};
  }catch(e){
    const d = km(me, p)*1.3;
    return {km:d, hrs:d/55, line:[[me.lat,me.lng],[p.lat,p.lng]], live:false};
  }
}
async function updateRoute(){
  const p = PLACES.find(x => x.id === sel);
  Object.entries(pins).forEach(([id, m]) => m.setIcon(pinIcon(id === sel)));
  if(!p){ $("#routeInfo").textContent = "Tap a red pin to plan a trip."; return }
  $("#routeInfo").textContent = "Finding the road route…";
  const r = await getRoute(p);
  if(routeLine) routeLine.remove();
  routeLine = L.polyline(r.line, {color:"#0f8f88", weight:5, opacity:.85, dashArray: r.live ? null : "8 8"}).addTo(map);
  $("#routeInfo").textContent = `${p.n}: ${Math.round(r.km)} km, about ${hm(r.hrs)} by road${r.live ? "" : " (estimate, offline)"}`;
  if($("#v-routes").classList.contains("on")) renderRoutes();
}

// ---------- places ----------
$("#cat").innerHTML = ["All", ...new Set(PLACES.map(p => p.c))].map(c => `<option>${esc(c)}</option>`).join("");
let favOnly = false;
function renderPlaces(){
  const q = $("#q").value.trim().toLowerCase(), c = $("#cat").value;
  const L2 = PLACES.filter(p => (c==="All" || p.c===c) && (!favOnly || favs.has(p.id)) && (!q || (p.n+" "+p.c+" "+p.d).toLowerCase().includes(q)))
    .sort((a,b) => km(me,a) - km(me,b));
  $("#placeList").innerHTML = L2.length ? L2.map(p => `<div class="card place" data-id="${p.id}" tabindex="0">
    <div class="badge" style="background:${COL[p.c]||"#1f2a5c"}">${esc(p.n[0])}</div>
    <div><h3>${esc(p.n)}</h3><div class="meta">${esc(p.c)} · ${Math.round(km(me,p))} km away</div></div>
    <button class="star" type="button" data-fav="${p.id}" aria-pressed="${favs.has(p.id)}" aria-label="Save">${favs.has(p.id)?"♥":"♡"}</button></div>`).join("")
    : `<div class="empty">No places match.</div>`;
}
$("#q").oninput = renderPlaces; $("#cat").onchange = renderPlaces;
$("#favOnly").onclick = e => { favOnly = !favOnly; e.currentTarget.setAttribute("aria-pressed", favOnly); e.currentTarget.textContent = favOnly ? "Show all" : "Saved only"; renderPlaces() };
$("#placeList").addEventListener("click", e => {
  const f = e.target.closest("[data-fav]");
  if(f){ const id = f.dataset.fav; favs.has(id) ? favs.delete(id) : favs.add(id); store.set("favs", [...favs]); renderPlaces(); return }
  const c = e.target.closest(".place"); if(c) openPlace(c.dataset.id);
});

// ---------- detail sheet ----------
const sheet = $("#sheet");
function selectPlace(id){ sel = id; store.set("sel", id); $("#stayAt").value = id; $("#routeTo").value = id; updateRoute() }
function openPlace(id){
  const p = PLACES.find(x => x.id === id); selectPlace(id);
  $("#sBody").innerHTML = `<h2 style="font-size:28px">${esc(p.n)}</h2>
   <div><span class="tag">${esc(p.c)}</span><span class="tag">Best: ${esc(p.best)}</span><span class="tag">${Math.round(km(me,p))} km away</span></div>
   <p>${esc(p.d)}</p>
   <div class="row">
     <button class="pri" type="button" data-go="routes">Compare transport</button>
     <button class="sec" type="button" data-go="stays">Find stays</button>
     <button class="sec" type="button" data-go="map">Route on map</button>
     <button class="sec" type="button" data-go="close">Close</button></div>`;
  sheet.classList.add("on");
}
sheet.addEventListener("click", e => {
  const b = e.target.closest("[data-go]");
  if(e.target === sheet || b){ sheet.classList.remove("on"); if(b && b.dataset.go !== "close") show(b.dataset.go) }
});

// ---------- stays (live from OpenStreetMap) ----------
const stayCache = {};
function tierOf(t){
  const stars = parseFloat(t.stars) || 0, kind = t.tourism;
  if(kind === "hostel" || kind === "guest_house" || kind === "camp_site" || stars && stars <= 2) return 0;
  if(stars >= 4 || /resort|palace|heritage|luxury/i.test(t.name||"")) return 2;
  return 1;
}
async function loadStays(p){
  if(stayCache[p.id]) return stayCache[p.id];
  const q = `[out:json][timeout:25];nwr(around:8000,${p.lat},${p.lng})[tourism~"^(hotel|guest_house|hostel|motel|resort|camp_site)$"][name];out center 80;`;
  const r = await fetch("https://overpass-api.de/api/interpreter", {method:"POST", body:"data="+encodeURIComponent(q), headers:{"Content-Type":"application/x-www-form-urlencoded"}});
  const j = await r.json();
  return stayCache[p.id] = j.elements.map(e => ({
    name: e.tags.name, t: tierOf(e.tags), kind: e.tags.tourism.replace("_"," "), stars: e.tags.stars,
    phone: e.tags.phone || e.tags["contact:phone"], web: e.tags.website || e.tags["contact:website"],
    lat: e.lat ?? e.center?.lat, lng: e.lon ?? e.center?.lon
  })).filter(s => s.lat).map(s => ({...s, dist: km(p, s)})).sort((a,b) => a.dist - b.dist);
}
async function renderStays(){
  const p = PLACES.find(x => x.id === $("#stayAt").value) || PLACES[0], box = $("#stayList");
  const gmaps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(["budget hotels","hotels","luxury resorts"][tier]+" near "+p.n)}`;
  box.innerHTML = `<div class="empty">Loading stays near ${esc(p.n)}…</div>`;
  try{
    const all = await loadStays(p), list = all.filter(s => s.t === tier);
    if(($("#stayAt").value || PLACES[0].id) !== p.id) return;
    box.innerHTML = (list.length ? list.slice(0, 25).map(s => `<div class="card">
      <h3>${esc(s.name)}</h3>
      <div class="meta">${esc(s.kind)}${s.stars ? " · "+esc(s.stars)+"★" : ""} · ${s.dist.toFixed(1)} km from ${esc(p.n)}</div>
      <div class="row" style="margin:8px 0 0">
        <a class="btn sec" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.name+" "+p.n)}" target="_blank" rel="noopener">Open in Maps</a>
        ${s.phone ? `<a class="btn sec" href="tel:${esc(s.phone.split(";")[0])}">Call</a>` : ""}
        ${s.web && /^https?:/.test(s.web) ? `<a class="btn sec" href="${esc(s.web)}" target="_blank" rel="noopener">Website</a>` : ""}
      </div></div>`).join("")
      : `<div class="empty">No ${["economy","mid-range","premium"][tier]} stays listed near ${esc(p.n)} yet.</div>`)
      + `<div class="row"><a class="btn pri" href="${gmaps}" target="_blank" rel="noopener">See more on Google Maps</a></div>`;
  }catch(e){
    box.innerHTML = `<div class="empty">Couldn't load hotels right now (no internet or server busy).</div><div class="row"><a class="btn pri" href="${gmaps}" target="_blank" rel="noopener">Search on Google Maps</a></div>`;
  }
}
$("#stayAt").onchange = () => { selectPlace($("#stayAt").value); renderStays() };
$$("#tier button").forEach(b => b.onclick = () => { tier = +b.dataset.t; $$("#tier button").forEach(x => x.setAttribute("aria-pressed", x === b)); renderStays() });

// ---------- transport comparison ----------
function modes(d, drive, n, p){
  const M = [], bikes = Math.ceil(n/2), cars = Math.ceil(n/4);
  M.push({t:"Bike", time: drive*1.35, cost: bikes*d*2.4, note:`${bikes} bike${bikes>1?"s":""}, fuel only`});
  M.push({t:"Car (taxi)", time: drive, cost: cars*d*12, note:`${cars} car${cars>1?"s":""} with driver, one way`});
  M.push({t:"State bus", time: drive*1.4+.3, cost: n*d*1.1, note:"GSRTC express seat"});
  if(p.rail) M.push({t:"Train", time: d/50+1.2, cost: n*d*.6, note:"Sleeper / 2S, plus station transfer"});
  if(n >= 10){ const b = Math.ceil(n/50); M.push({t:"Group charter bus", time: drive*1.2, cost: b*Math.max(d,100)*60, note:`${b} bus${b>1?"es":""}, for school & college trips`}) }
  if(p.boat) M.forEach(m => { m.time += .5; m.cost += n*30; m.note += " + Okha ferry" });
  return M;
}
async function renderRoutes(){
  const p = PLACES.find(x => x.id === $("#routeTo").value) || PLACES[0];
  const n = Math.max(1, Math.min(200, +$("#ppl").value || 1));
  $("#dist").textContent = "Getting road distance…";
  const r = await getRoute(p);
  $("#dist").textContent = `${Math.round(r.km)} km by road from ${me.name}${r.live ? "" : " (estimate)"}`;
  const M = modes(r.km, r.hrs, n, p);
  const cheap = M.reduce((a,b) => b.cost < a.cost ? b : a), fast = M.reduce((a,b) => b.time < a.time ? b : a), mx = Math.max(...M.map(m => m.time));
  $("#modeList").innerHTML = M.map(m => `<div class="card mode ${m===cheap||m===fast?"best":""}">
    <div><h3>${m.t}${m===cheap?'<span class="pill">Cheapest</span>':""}${m===fast?'<span class="pill">Fastest</span>':""}</h3>
    <div class="meta">${m.note}</div><div class="bar"><i style="width:${(m.time/mx*100).toFixed(0)}%"></i></div></div>
    <div class="price">${hm(m.time)}<div class="meta">${rupee(m.cost)} total</div>${n>1?`<div class="meta">${rupee(m.cost/n)} each</div>`:""}</div></div>`).join("")
    + (p.rail ? "" : `<p class="note">No direct train to ${esc(p.n)}. Take a train to the nearest city, then bus or taxi.</p>`);
  const dir = mode => `https://www.google.com/maps/dir/?api=1&origin=${me.lat},${me.lng}&destination=${p.lat},${p.lng}&travelmode=${mode}`;
  $("#dirLinks").innerHTML = `<a class="btn pri" href="${dir("driving")}" target="_blank" rel="noopener">Navigate (car/bike)</a>
    <a class="btn sec" href="${dir("transit")}" target="_blank" rel="noopener">Bus & train times</a>`;
}
$("#routeTo").onchange = () => { selectPlace($("#routeTo").value); renderRoutes() };
$("#ppl").oninput = renderRoutes;

// ---------- tabs ----------
function show(v){
  $$(".view").forEach(s => s.classList.toggle("on", s.id === "v-"+v));
  $$("nav button").forEach(b => b.dataset.v === v ? b.setAttribute("aria-current","page") : b.removeAttribute("aria-current"));
  if(v === "map") setTimeout(() => { map.invalidateSize(); if(routeLine) map.fitBounds(routeLine.getBounds(), {padding:[30,30]}) }, 50);
  if(v === "places") renderPlaces();
  if(v === "stays") renderStays();
  if(v === "routes") renderRoutes();
  window.scrollTo(0, 0);
}
$$("nav button").forEach(b => b.onclick = () => show(b.dataset.v));

// ---------- install as app ----------
let deferred;
window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); deferred = e; $("#install").style.display = "inline-flex" });
$("#install").onclick = async () => { if(!deferred) return; deferred.prompt(); await deferred.userChoice; deferred = null; $("#install").style.display = "none" };
if("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});

// ---------- start ----------
const opts = PLACES.map(p => `<option value="${p.id}">${esc(p.n)}</option>`).join("");
$("#stayAt").innerHTML = opts; $("#routeTo").innerHTML = opts;
if(sel){ $("#stayAt").value = sel; $("#routeTo").value = sel; updateRoute() }
renderPlaces();
})();
