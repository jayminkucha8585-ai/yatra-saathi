// ---------- transport comparison ----------
const modes = YS.modes = (d, drive, n, p) => {
  const M = [], bikes = Math.ceil(n/2), cars = Math.ceil(n/4);
  M.push({t:"Bike", time: drive*1.35, cost: bikes*d*2.4, note:`${bikes} bike${bikes>1?"s":""}, fuel only`});
  M.push({t:"Car (taxi)", time: drive, cost: cars*d*12, note:`${cars} car${cars>1?"s":""} with driver, one way`});
  M.push({t:"State bus", time: drive*1.4+.3, cost: n*d*1.1, note:"GSRTC express seat"});
  if(p.rail) M.push({t:"Train", time: d/50+1.2, cost: n*d*.6, note:"Sleeper / 2S, plus station transfer"});
  if(n >= 10){ const b = Math.ceil(n/50); M.push({t:"Group charter bus", time: drive*1.2, cost: b*Math.max(d,100)*60, note:`${b} bus${b>1?"es":""}, for school & college trips`}) }
  if(p.boat) M.forEach(m => { m.time += .5; m.cost += n*30; m.note += " + Okha ferry" });
  return M;
};
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

// ---------- navigation ----------
const TITLES = {map:"Yatra Saathi", places:"Places to visit", stays:"Stays by budget", routes:"Compare transport", more:"More tools",
  sos:"SOS safety", weather:"Weather", translate:"Translator", guide:"Trip guide & packing", group:"School & college trips",
  creator:"Creator studio", connect:"Traveler connect", licence:"Licence verification"};
const MAIN = ["map","places","stays","routes","more"];
YS.renderers = {places: renderPlaces, stays: renderStays, routes: renderRoutes};
const show = YS.show = v => {
  $$(".view").forEach(s => s.classList.toggle("on", s.id === "v-"+v));
  const tab = MAIN.includes(v) ? v : "more";
  $$("nav button").forEach(b => b.dataset.v === tab ? b.setAttribute("aria-current","page") : b.removeAttribute("aria-current"));
  $("#title").textContent = TITLES[v] || "Yatra Saathi";
  $("#back").classList.toggle("on", !MAIN.includes(v));
  if(v === "map") setTimeout(() => { map.invalidateSize(); if(routeLine) map.fitBounds(routeLine.getBounds(), {padding:[30,30]}) }, 50);
  if(YS.renderers[v]) YS.renderers[v]();
  window.scrollTo(0, 0);
};
$$("nav button").forEach(b => b.onclick = () => show(b.dataset.v));
$("#back").onclick = () => show("more");
document.addEventListener("click", e => { const o = e.target.closest("[data-open]"); if(o) show(o.dataset.open) });

// hub of extra tools
const HUB = [["sos","SOS safety","Emergency calls and share your location"],["weather","Weather","5-day forecast for you or any place"],
  ["translate","Translator","Speak with locals in their language"],["guide","Trip guide & packing","Tips by trip type and a checklist"],
  ["connect","Traveler connect","Meet travelers on your route"],["creator","Creator studio","Shoot spots, scripts and uploads"],
  ["group","School & college trips","Guidance and low-cost group buses"],["licence","Licence verification","Upload your driving licence"]];
$("#hub").innerHTML = HUB.map(h => `<button class="tile${h[0]==="sos"?" sos":""}" type="button" data-open="${h[0]}"><b>${h[1]}</b><span>${h[2]}</span></button>`).join("");

// ---------- install as app ----------
let deferred;
window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); deferred = e; $("#install").style.display = "inline-flex" });
$("#install").onclick = async () => { if(!deferred) return; deferred.prompt(); await deferred.userChoice; deferred = null; $("#install").style.display = "none" };
if("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});

// ---------- start ----------
$("#stayAt").innerHTML = YS.placeOptions(); $("#routeTo").innerHTML = YS.placeOptions();
if(sel){ $("#stayAt").value = sel; $("#routeTo").value = sel; updateRoute() }
renderPlaces();
