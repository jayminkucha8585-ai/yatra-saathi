// ---------- places ----------
$("#cat").innerHTML = ["All", ...new Set(PLACES.map(p => p.c))].map(c => `<option>${esc(c)}</option>`).join("");
let favOnly = false;
function renderPlaces(){
  const q = $("#q").value.trim().toLowerCase(), c = $("#cat").value;
  const list = PLACES.filter(p => (c==="All" || p.c===c) && (!favOnly || favs.has(p.id)) && (!q || (p.n+" "+p.c+" "+p.d).toLowerCase().includes(q)))
    .sort((a,b) => km(me,a) - km(me,b));
  $("#placeList").innerHTML = list.length ? list.map(p => `<div class="card place" data-id="${p.id}" tabindex="0">
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
YS.selected = () => sel;
function openPlace(id){
  const p = PLACES.find(x => x.id === id); selectPlace(id);
  $("#sBody").innerHTML = `<h2 style="font-size:28px;margin-top:0">${esc(p.n)}</h2>
   <div><span class="tag">${esc(p.c)}</span><span class="tag">Best: ${esc(p.best)}</span><span class="tag">${Math.round(km(me,p))} km away</span></div>
   <p>${esc(p.d)}</p>
   <div class="row">
     <button class="pri" type="button" data-go="routes">Compare transport</button>
     <button class="sec" type="button" data-go="stays">Find stays</button>
     <button class="sec" type="button" data-go="weather">Weather</button>
     <button class="sec" type="button" data-go="guide">Trip guide</button>
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
  const j = await YS.overpass(`[out:json][timeout:25];nwr(around:8000,${p.lat},${p.lng})[tourism~"^(hotel|guest_house|hostel|motel|resort|camp_site)$"][name];out center 80;`);
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
