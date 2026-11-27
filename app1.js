// Yatra Saathi — core: map, GPS, places, stays, routes, navigation
const YS = window.YS = {};
const $ = YS.$ = s => document.querySelector(s), $$ = YS.$$ = s => [...document.querySelectorAll(s)];
const esc = YS.esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const store = YS.store = {
  get(k, d){ try { return JSON.parse(localStorage.getItem("ys-"+k)) ?? d } catch(e){ return d } },
  set(k, v){ try { localStorage.setItem("ys-"+k, JSON.stringify(v)) } catch(e){} }
};
const rupee = YS.rupee = n => "₹" + (Math.round(n/10)*10).toLocaleString("en-IN");
const hm = YS.hm = h => { const m = Math.round(h*60); return m < 60 ? m+" min" : Math.floor(m/60)+" h"+(m%60 ? " "+m%60+" min" : "") };
const km = YS.km = (a, b) => { const R=6371, r=Math.PI/180, dl=(b.lat-a.lat)*r, dg=(b.lng-a.lng)*r;
  const x=Math.sin(dl/2)**2+Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.sin(dg/2)**2; return 2*R*Math.asin(Math.sqrt(x)) };
YS.toast = msg => { const t = $("#toast"); t.textContent = msg; t.classList.add("on"); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove("on"), 3000) };
YS.placeOptions = () => PLACES.map(p => `<option value="${p.id}">${esc(p.n)}</option>`).join("");
const COL = {Monument:"#b3261e",Wildlife:"#8a5a12",Temple:"#c2410c",Island:"#0f8f88",Beach:"#0f8f88",Nature:"#4d5a1e",Heritage:"#1f2a5c","Hill station":"#4d5a1e"};

// OpenStreetMap data with backup servers
const OVERPASS = ["https://overpass-api.de/api/interpreter","https://overpass.kumi.systems/api/interpreter","https://maps.mail.ru/osm/tools/overpass/api/interpreter"];
YS.overpass = async q => {
  for(const u of OVERPASS){
    try{ const r = await fetch(u, {method:"POST", body:"data="+encodeURIComponent(q), headers:{"Content-Type":"application/x-www-form-urlencoded"}});
      if(r.ok) return await r.json() }catch(e){}
  }
  throw new Error("map data unavailable");
};

// ---------- state ----------
let me = store.get("me", {lat:23.03, lng:72.58, name:"Ahmedabad", live:false});
YS.me = () => me;
let sel = store.get("sel", null), favs = new Set(store.get("favs", [])), tier = 0, follow = true;
const routeCache = {};

// ---------- map ----------
const map = YS.map = L.map("map", {zoomControl:true}).setView([me.lat, me.lng], 7);
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);
const meMarker = L.marker([me.lat, me.lng], {icon: L.divIcon({className:"", html:'<div class="me"></div>', iconSize:[18,18]})}).addTo(map);
const accCircle = L.circle([me.lat, me.lng], {radius:0, color:"#1f2a5c", weight:1, fillOpacity:.08}).addTo(map);
let routeLine = null;
const pins = {};
function pinIcon(on){ return L.divIcon({className:"", html:`<div class="pin${on?" on":""}"></div>`, iconSize:[28,28], iconAnchor:[14,28]}) }
PLACES.forEach(p => {
  pins[p.id] = L.marker([p.lat, p.lng], {icon: pinIcon(false), title: p.n}).addTo(map).on("click", () => openPlace(p.id));
});
map.on("dragstart", () => setFollow(false));
function setFollow(v){ follow = v; $("#follow").textContent = v ? "Following you" : "Follow me"; if(v) map.setView([me.lat, me.lng], Math.max(map.getZoom(), 13)) }
$("#follow").onclick = () => setFollow(!follow);

// ---------- petrol pumps ----------
const fuelLayer = L.layerGroup();
$("#fuel").onclick = async e => {
  const b = e.currentTarget, on = b.getAttribute("aria-pressed") !== "true";
  b.setAttribute("aria-pressed", on);
  if(!on){ map.removeLayer(fuelLayer); return }
  fuelLayer.clearLayers().addTo(map);
  const c = map.getCenter();
  b.textContent = "Finding pumps…";
  try{
    const j = await YS.overpass(`[out:json][timeout:25];nwr(around:10000,${c.lat},${c.lng})[amenity=fuel];out center 60;`);
    j.elements.forEach(el => {
      const lat = el.lat ?? el.center?.lat, lng = el.lon ?? el.center?.lon; if(lat == null) return;
      const name = el.tags.name || el.tags.brand || "Petrol pump";
      L.marker([lat, lng], {icon: L.divIcon({className:"", html:'<div class="fuelpin">P</div>', iconSize:[22,22]})})
        .bindPopup(`<b>${esc(name)}</b><br><a href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}" target="_blank" rel="noopener">Directions</a>`).addTo(fuelLayer);
    });
    YS.toast(j.elements.length ? `${j.elements.length} petrol pumps within 10 km of the map centre` : "No petrol pumps found near the map centre");
    if(map.getZoom() < 12) map.setView(c, 12);
  }catch(err){ YS.toast("Couldn't load petrol pumps. Check your internet.") }
  b.textContent = "Petrol pumps";
};
