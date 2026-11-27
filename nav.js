// ---------- In-app turn-by-turn directions (replaces Google Maps links) ----------
(() => {
const {$, $$, esc, km, hm, toast} = YS;
const v = document.createElement("section"); v.className = "view"; v.id = "v-nav"; $("main").appendChild(v);
TITLES.nav = "Directions";
v.innerHTML = `<div class="nav-next" id="nvNext">Finding the road route…</div>
<div id="nvMap"></div>
<div class="meta" id="nvSum"></div>
<div class="row"><button class="pri" id="nvGo" type="button">Start</button><button class="sec" id="nvFit" type="button">Whole route</button></div>
<ol class="steps" id="nvSteps"></ol>
<p class="note">Road route from OpenStreetMap (OSRM). Always follow road signs; the route may not know about closures or one-way changes.</p>`;
let m, line, meM, dstM, steps = [], dest = null, live = false, timer = null, cur = 1, busy = false;
const AR = {left:"↰", right:"↱", "sharp left":"↰", "sharp right":"↱", "slight left":"↖", "slight right":"↗", straight:"↑", uturn:"↶"};
const dist = d => d >= 1000 ? (d/1000).toFixed(1)+" km" : Math.max(10, Math.round(d/10)*10)+" m";
function say(s){
const o = s.maneuver, t = o.type, mod = o.modifier || "", road = s.name ? " onto "+s.name : "";
let x;
if(t === "depart") x = "Start" + (s.name ? " on "+s.name : "");
else if(t === "arrive") x = "Arrive at " + dest.name;
else if(t === "roundabout" || t === "rotary") x = `At the roundabout, take exit ${o.exit || 1}${road}`;
else if(t === "fork") x = `Keep ${mod.includes("left") ? "left" : "right"} at the fork${road}`;
else if(t === "merge") x = "Merge" + road;
else if(t === "on ramp") x = "Take the ramp" + road;
else if(t === "off ramp") x = "Take the exit" + road;
else if(mod === "uturn") x = "Make a U-turn" + road;
else if(mod === "straight" || t === "continue" || t === "new name") x = "Continue straight" + road;
else x = `Turn ${mod}${road}`;
return {x, i: t === "arrive" ? "◉" : AR[mod] || "↑", d: s.distance, at: {lat: o.location[1], lng: o.location[0]}};
}
function fit(){ const me = YS.me(); if(line.getLatLngs().length) m.fitBounds(line.getBounds().extend([me.lat, me.lng]), {padding:[30,30]}) }
async function load(){
const me = YS.me(); cur = 1; steps = [];
$("#nvNext").textContent = "Finding the road route…"; $("#nvSteps").innerHTML = "";
try{
const r = await fetch(`https://router.project-osrm.org/route/v1/driving/${me.lng},${me.lat};${dest.lng},${dest.lat}?overview=full&geometries=geojson&steps=true`);
const j = await r.json(); if(j.code !== "Ok") throw 0;
const rt = j.routes[0];
steps = rt.legs[0].steps.map(say);
line.setLatLngs(rt.geometry.coordinates.map(c => [c[1], c[0]]));
$("#nvSum").textContent = `${(rt.distance/1000).toFixed(1)} km · about ${hm(rt.duration/3600)} by road to ${dest.name}`;
$("#nvSteps").innerHTML = steps.map((s, i) => `<li data-i="${i}"><b>${s.i}</b><span>${esc(s.x)}</span><small>${s.d ? dist(s.d) : ""}</small></li>`).join("");
}catch(e){
line.setLatLngs([[me.lat, me.lng], [dest.lat, dest.lng]]);
$("#nvSum").textContent = `About ${km(me, dest).toFixed(1)} km away in a straight line (no road route, check your internet)`;
$("#nvNext").textContent = "Head towards " + dest.name;
}
fit(); tick();
}
function tick(){
if(!v.classList.contains("on")){ stop(); return }
const me = YS.me(); meM.setLatLng([me.lat, me.lng]);
if(!steps.length) return;
while(cur < steps.length - 1 && km(me, steps[cur].at) < .03) cur++;
const s = steps[cur] || steps[steps.length-1];
$("#nvNext").innerHTML = `<b>${s.i}</b><span>${esc(s.x)}<small>in ${dist(km(me, s.at)*1000)}</small></span>`;
$$("#nvSteps li").forEach(li => li.classList.toggle("now", +li.dataset.i === cur));
if(!live) return;
m.setView([me.lat, me.lng], Math.max(m.getZoom(), 16));
if(km(me, dest) < .06){ toast("You have arrived at " + dest.name); stop(); return }
const pts = line.getLatLngs(); let near = 1e9;
for(let k = 0; k < pts.length; k += 2) near = Math.min(near, km(me, pts[k]));
if(near > .2 && !busy){ busy = true; toast("You left the route. Finding a new one…"); load().finally(() => busy = false) }
}
let lock = null;
function stop(){ live = false; clearInterval(timer); timer = null; $("#nvGo").textContent = "Start"; if(lock){ lock.release().catch(() => {}); lock = null } }
$("#nvGo").onclick = async () => {
if(live){ stop(); fit(); return }
if(!YS.me().live) toast("Turn on location so the app can follow you");
live = true; $("#nvGo").textContent = "Stop"; timer = setInterval(tick, 2500); tick();
try{ lock = await navigator.wakeLock?.request("screen") }catch(e){}
};
$("#nvFit").onclick = fit;
$("#nvSteps").onclick = e => { const li = e.target.closest("li"); if(li) m.setView(steps[+li.dataset.i].at, 17) };
YS.renderers.nav = () => {
if(!dest) return;
if(!m){
m = L.map("nvMap");
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {maxZoom:19, attribution:'&copy; OpenStreetMap'}).addTo(m);
line = L.polyline([], {color:"#1e6b63", weight:6, opacity:.9}).addTo(m);
meM = L.marker([0, 0], {icon: L.divIcon({className:"", html:'<div class="mepin"></div>', iconSize:[18,18]})}).addTo(m);
dstM = L.marker([0, 0]).addTo(m);
}
stop(); dstM.setLatLng([dest.lat, dest.lng]).bindPopup(esc(dest.name));
m.setView([dest.lat, dest.lng], 12); setTimeout(() => { m.invalidateSize(); load() }, 60);
};
YS.nav = (lat, lng, name) => { dest = {lat: +lat, lng: +lng, name: name || "your destination"}; document.getElementById("sheet").classList.remove("on"); YS.show("nav") };

// any old Google Maps directions link (petrol pump popups) opens in-app directions instead
document.addEventListener("click", e => {
const a = e.target.closest('a[href*="google.com/maps/dir"]'); if(!a) return;
e.preventDefault();
const q = new URL(a.href).searchParams.get("destination").split(","), pop = a.closest(".leaflet-popup-content");
YS.nav(q[0], q[1], pop && pop.querySelector("b") ? pop.querySelector("b").textContent : "Petrol pump");
}, true);
// Trips page: swap the Google Maps buttons for in-app directions
const dl = $("#dirLinks");
new MutationObserver(() => {
if(!dl.querySelector('a[href*="google"]')) return;
dl.innerHTML = `<button class="pri" type="button" id="navGo">Directions in the app</button>`;
$("#navGo").onclick = () => { const p = PLACES.find(x => x.id === $("#routeTo").value) || PLACES[0]; YS.nav(p.lat, p.lng, p.n) };
}).observe(dl, {childList:true});
})();
