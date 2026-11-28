// ---------- Real place photos (Wikipedia) + richer place list and detail ----------
(() => {
const {$, esc, store, km} = YS;
const WIKI = {sou:"Statue_of_Unity", gir:"Gir_National_Park", som:"Somnath_temple", dwk:"Dwarkadhish_Temple", bet:"Bet_Dwarka",
shv:"Shivrajpur_Beach", rann:"Great_Rann_of_Kutch", rkv:"Rani_ki_vav", mod:"Sun_Temple,_Modhera", sab:"Sabarmati_Ashram",
sap:"Saputara", pav:"Champaner-Pavagadh_Archaeological_Park", polo:"Polo_Forest", pal:"Palitana_temples", diu:"Diu,_India",
kalo:"Kalo_Dungar", kot:"Koteshwar,_Kutch", nars:"Narayan_Sarovar", madh:"Mata_no_Madh", lakh:"Lakhpat", dhol:"Dholavira",
tul:"Tulsishyam", kank:"Kankai", navl:"Navlakha_temple", vela:"Blackbuck_National_Park,_Velavadar", zar:"Zarwani",
don:"Don,_Dang", wil:"Wilson_Hills,_Gujarat", girn:"Girnar", gop:"Gopnath"};
const cache = store.get("photos2", {}), wait = {};
const ok = u => typeof u === "string" && /^https:\/\/(upload|thumb)\.wikimedia\.org\//.test(u);
YS.photo = id => {
if(id in cache) return Promise.resolve(cache[id]);
if(!WIKI[id]) return Promise.resolve(null);
return wait[id] = wait[id] || fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(WIKI[id])}`)
.then(r => r.ok ? r.json() : null)
.then(j => { const u = j && j.thumbnail && j.thumbnail.source; cache[id] = ok(u) ? u : null; store.set("photos2", cache); return cache[id] })
.catch(() => null);
};
const big = u => u.replace(/\/(\d+)px-/, "/640px-");
// fill every element that has data-photo="placeId"
YS.paintPhotos = root => (root || document).querySelectorAll("[data-photo]").forEach(async n => {
const u = await YS.photo(n.dataset.photo);
if(u){ n.style.backgroundImage = `url("${big(u)}")`; n.classList.add("has") }
});
const tags = p => `${p.rem ? `<span class="tag gem">Hidden gem</span>` : ""}<span class="tag">${esc(p.c)}</span>`;

// place list with photos
window.renderPlaces = function(){
const q = $("#q").value.trim().toLowerCase(), c = $("#cat").value, fo = $("#favOnly").getAttribute("aria-pressed") === "true", favs = new Set(store.get("favs", []));
const me = YS.me();
const list = PLACES.filter(p => (c === "All" || p.c === c || (c === "Hidden gems" && p.rem)) && (!fo || favs.has(p.id)) && (!q || (p.n+" "+p.c+" "+p.d).toLowerCase().includes(q)))
.sort((a,b) => km(me,a) - km(me,b));
$("#placeList").innerHTML = list.length ? list.map(p => `<div class="pc place" data-id="${p.id}" tabindex="0" role="button" aria-label="${esc(p.n)}">
<div class="pc-img" data-photo="${p.id}"><b>${esc(p.n[0])}</b></div>
<div class="pc-txt"><h3>${esc(p.n)}</h3><div class="meta">${Math.round(km(me,p))} km away · Best ${esc(p.best)}</div><div>${tags(p)}</div></div>
<button class="star" type="button" data-fav="${p.id}" aria-pressed="${favs.has(p.id)}" aria-label="Save ${esc(p.n)}">${favs.has(p.id) ? "♥" : "♡"}</button></div>`).join("")
: `<div class="empty">No places match.</div>`;
YS.paintPhotos($("#placeList"));
};
if(![...$("#cat").options].some(o => o.value === "Hidden gems")) $("#cat").insertAdjacentHTML("beforeend", `<option>Hidden gems</option>`);
$("#q").oninput = renderPlaces; $("#cat").onchange = renderPlaces; YS.renderers.places = renderPlaces;
$("#placeList").addEventListener("keydown", e => { const c = e.target.closest(".place"); if(c && e.key === "Enter") openPlace(c.dataset.id) });

// detail sheet with a hero photo
window.openPlace = function(id){
const p = PLACES.find(x => x.id === id); if(!p) return; selectPlace(id);
$("#sBody").innerHTML = `<div class="hero" data-photo="${p.id}"><b>${esc(p.n[0])}</b></div>
<h2 style="font-size:28px;margin:12px 0 4px">${esc(p.n)}</h2>
<div>${tags(p)}<span class="tag">Best: ${esc(p.best)}</span><span class="tag">${Math.round(km(YS.me(),p))} km away</span></div>
<p>${esc(p.d)}</p>${p.ap ? `<p class="note">Map pin is approximate. Check the exact spot in Google Maps before you go.</p>` : ""}
<div class="row">
<button class="pri" type="button" data-go="routes">Compare transport</button>
<button class="sec" type="button" data-go="stays">Find stays</button>
<button class="sec" type="button" data-go="weather">Weather</button>
<button class="sec" type="button" data-go="creator">Shoot spots & script</button>
<button class="sec" type="button" data-go="map">Route on map</button>
<button class="sec" type="button" data-go="close">Close</button></div>
<p class="note photo-credit">Photo: Wikipedia / Wikimedia Commons</p>`;
$("#sheet").classList.add("on"); YS.paintPhotos($("#sBody"));
};
renderPlaces();
})();
