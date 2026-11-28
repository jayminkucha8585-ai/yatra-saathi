// ---------- Places tab: All India mode + live place details ----------
(() => {
const {$, esc, toast} = YS;
const STATES = ["Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala",
"Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura",
"Uttar Pradesh","Uttarakhand","West Bengal","Andaman and Nicobar","Chandigarh","Dadra Nagar Haveli Daman Diu","Delhi","Jammu and Kashmir","Ladakh","Lakshadweep","Puducherry"];
const seen = {};
let lastQ = "", more = 0;
const card = p => `<div class="pc place" data-live="${p.id}" tabindex="0" role="button" aria-label="${esc(p.n)}">
<div class="pc-img"${p.img ? ` data-src="${esc(YS.wsize(p.img, 330))}"` : ""}><b>${esc(p.n[0])}</b></div>
<div class="pc-txt"><h3>${esc(p.n)}</h3><div class="meta">${YS.dist(p)} km away · ${esc(p.d || p.c)}</div><div><span class="tag">${esc(p.c)}</span></div></div></div>`;
const show = (list, add) => {
list.forEach(p => seen[p.id] = p);
const box = $("#iList");
box.innerHTML = (add ? box.innerHTML : "") + (list.length ? list.map(card).join("") : add ? "" : `<div class="empty">No places found. Try another name.</div>`);
$("#iMore").hidden = !more;
// show each photo only after it has loaded
box.querySelectorAll("[data-src]").forEach(n => { const im = new Image(); im.onload = () => { n.style.backgroundImage = `url("${n.dataset.src}")`; n.classList.add("has") }; im.src = n.dataset.src; n.removeAttribute("data-src") });
};
const busy = t => { $("#iList").innerHTML = `<div class="empty">${esc(t)}</div>`; $("#iMore").hidden = true };
const search = async q => {
q = q.trim(); if(!q) return; lastQ = q; busy("Finding places in " + q + "…");
try{ const r = await YS.wikiSearch(q); more = r.more; show(r.list) }catch(e){ busy("Couldn't load places. Check your internet.") }
};
const near = async () => {
const m = YS.me(); busy("Finding places near you…"); lastQ = ""; more = 0;
try{ const a = await YS.wikiNear(m.lat, m.lng, 10000); show(a.sort((x,y) => YS.dist(x) - YS.dist(y))) }catch(e){ busy("Couldn't load places. Check your internet.") }
};
const v = $("#v-places");
v.insertAdjacentHTML("afterbegin", `<div class="seg" id="plMode"><button type="button" data-m="g" aria-pressed="true">Gujarat picks</button><button type="button" data-m="i" aria-pressed="false">All India</button></div>
<div id="india" hidden>
<form class="row" id="iForm"><input id="iq" type="search" placeholder="Search a state, city or place in India" style="flex:1" aria-label="Search India"><button class="pri" type="submit">Search</button></form>
<div class="chips" id="iStates"><button type="button" class="chip on" data-near="1">📍 Near me</button>${STATES.map(s => `<button type="button" class="chip" data-st="${s}">${s}</button>`).join("")}</div>
<div id="iList"></div><div class="row"><button class="sec" id="iMore" type="button" hidden>Load more</button></div>
<p class="note">Places, photos and descriptions come live from Wikipedia. Photos: Wikimedia Commons.</p></div>`);
YS.indiaMode = on => {
v.classList.toggle("india-on", on); $("#india").hidden = !on;
$("#plMode").querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", (b.dataset.m === "i") === on));
if(on && !$("#iList").innerHTML) near();
};
$("#plMode").onclick = e => { const b = e.target.closest("button"); if(b) YS.indiaMode(b.dataset.m === "i") };
$("#iForm").onsubmit = e => { e.preventDefault(); search($("#iq").value) };
$("#iStates").onclick = e => {
const b = e.target.closest(".chip"); if(!b) return;
$("#iStates").querySelectorAll(".chip").forEach(c => c.classList.toggle("on", c === b));
b.dataset.near ? near() : search(b.dataset.st);
};
$("#iMore").onclick = async () => { if(!lastQ || !more) return; try{ const r = await YS.wikiSearch(lastQ, more); more = r.more; show(r.list, true) }catch(e){ toast("Couldn't load more") } };
const openCard = e => { const c = e.target.closest("[data-live]"); if(c && seen[c.dataset.live]) YS.openLive(seen[c.dataset.live]) };
$("#iList").addEventListener("click", openCard);
$("#iList").addEventListener("keydown", e => { if(e.key === "Enter") openCard(e) });

// ---------- live place sheet ----------
YS.openLive = raw => {
const p = YS.addPlace(raw); if(!p.live && typeof openPlace === "function") return openPlace(p.id);
if(typeof selectPlace === "function") selectPlace(p.id);
$("#sBody").innerHTML = `<div class="hero" data-photo="${esc(p.id)}"><b>${esc(p.n[0])}</b></div>
<h2 style="font-size:28px;margin:12px 0 4px">${esc(p.n)}</h2>
<div><span class="tag">${esc(p.c)}</span><span class="tag">Usually best: ${esc(p.best)}</span><span class="tag">${YS.dist(p)} km away</span></div>
<p>${esc(p.d)}</p><p id="lvTxt" class="meta">Loading details…</p>
<div class="row">
<button class="pri" type="button" data-act="lvnav">Directions in the app</button>
<button class="sec" type="button" data-go="routes">Compare transport</button>
<button class="sec" type="button" data-go="stays">Find stays</button>
<button class="sec" type="button" data-go="weather">Weather</button>
<button class="sec" type="button" data-act="photos" data-pid="${p.id}">Photo spots</button>
<button class="sec" type="button" data-act="pano" data-lat="${p.lat}" data-lng="${p.lng}">360° view</button>
<button class="sec" type="button" data-go="creator">Creator spots & script</button>
<button class="sec" type="button" data-go="close">Close</button></div>
<p class="note photo-credit">Text and photo: Wikipedia / Wikimedia Commons</p>`;
$("#sheet").classList.add("on"); YS.paintPhotos($("#sBody"));
$("#sBody").querySelector("[data-act=lvnav]").onclick = () => { $("#sheet").classList.remove("on"); YS.nav ? YS.nav(p.lat, p.lng, p.n) : toast("Directions not available") };
YS.wikiText(p.wiki || p.n).then(t => { const el = $("#lvTxt"); if(el) el.textContent = t.length > 700 ? t.slice(0, 700) + "…" : t });
};
const op = window.openPlace;
window.openPlace = id => {
const p = PLACES.find(x => x.id === id); if(p && p.live) return YS.openLive(p);
op(id);
const row = $("#sBody .row");
if(row && !row.querySelector("[data-act=photos]")) row.insertAdjacentHTML("beforeend", `<button class="sec" type="button" data-act="photos" data-pid="${id}">Photo spots</button>`);
if(row && p && !row.querySelector("[data-act=pano]")) row.insertAdjacentHTML("beforeend", `<button class="sec" type="button" data-act="pano" data-lat="${p.lat}" data-lng="${p.lng}">360° view</button>`);
};

// home tiles: All India + Photo spots
const tiles = $("#v-home .tiles");
if(tiles) tiles.insertAdjacentHTML("beforeend", `<button type="button" data-act="india"><i><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/></svg></i>All India</button>
<button type="button" data-open="photos"><i><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-8 8"/></svg></i>Photo spots</button>`);
document.addEventListener("click", e => {
if(e.target.closest("[data-act=india]")){ YS.show("places"); YS.indiaMode(true) }
// 360° view: opens Google Street View (official free Maps link) at the place; Google picks the nearest 360° photo
const pv = e.target.closest("[data-act=pano]");
if(pv) window.open(`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${encodeURIComponent(pv.dataset.lat + "," + pv.dataset.lng)}`, "_blank", "noopener");
});
})();
