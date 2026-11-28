// ---------- Photo spots: real photos taken near any place in India, with tips ----------
(() => {
const {$, esc, toast, km} = YS;
const C = "https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrnamespace=6&gsrlimit=40&prop=imageinfo|coordinates&iiprop=url|extmetadata&iiurlwidth=500&iiextmetadatafilter=Artist|LicenseShortName|ObjectName";
const strip = h => String(h || "").replace(/<[^>]*>/g, "").trim();
// best photos first (Quality images), then Valued images, then any photo
YS.photoSpots = async (lat, lng, r = 12) => {
const tries = [`incategory:Quality_images`, `incategory:Valued_images`, `filetype:bitmap`];
for(const t of tries){
const j = await (await fetch(`${C}&gsrsearch=${encodeURIComponent(`nearcoord:${r}km,${lat},${lng} ${t}`)}`)).json();
const list = Object.values((j.query && j.query.pages) || {}).map(pg => {
const i = pg.imageinfo && pg.imageinfo[0], c = pg.coordinates && pg.coordinates[0]; if(!i || !c || !YS.okImg(i.thumburl)) return null;
const m = i.extmetadata || {};
return {id: pg.pageid, lat: c.lat, lng: c.lon, img: i.thumburl, page: i.descriptionurl,
name: strip(m.ObjectName && m.ObjectName.value) || pg.title.replace(/^File:|\.\w+$/g, ""),
by: strip(m.Artist && m.Artist.value).slice(0, 60), lic: strip(m.LicenseShortName && m.LicenseShortName.value)};
}).filter(Boolean);
if(list.length >= 6 || t === tries[2]) return list.sort((a,b) => km({lat,lng}, a) - km({lat,lng}, b));
}
return [];
};
const TIPS = ["Shoot in the golden hour: the first and last hour of sunlight.","Keep the horizon straight and use the rule of thirds grid on your phone.",
"Put something in front (a branch, arch or person) to add depth.","For waterfalls, hold steady and use night or long-exposure mode for silky water.",
"Temples and old forts look best from a slight low angle in soft morning light.","Shoot vertical (9:16) for Reels and Shorts, and horizontal for YouTube.",
"Ask before photographing people, and follow photo rules at temples and monuments.","Drones need permission in many places in India. Check before you fly."];
let at = null, list = [], want = null;
const grid = () => {
$("#psGrid").innerHTML = list.length ? list.map((s, i) => `<button type="button" class="ps" data-i="${i}" style="background-image:url('${esc(s.img)}')">
<span>${esc(s.name)}<small>${at ? Math.round(km(at, s) * 10) / 10 + " km" : ""}</small></span></button>`).join("")
: `<div class="empty">No photos found here yet. Try a nearby famous place.</div>`;
};
const load = async (lat, lng, name) => {
at = {lat, lng, name}; $("#psAt").textContent = name; $("#psGrid").innerHTML = `<div class="empty">Finding the best photo spots…</div>`;
try{ list = await YS.photoSpots(lat, lng); grid() }catch(e){ $("#psGrid").innerHTML = `<div class="empty">Couldn't load photos. Check your internet.</div>` }
};
YS.openPhotoSpots = p => { want = p; YS.show("photos") };
YS.renderers.photos = () => {
const el = $("#v-photos");
if(!el.dataset.ready){
el.dataset.ready = 1;
el.innerHTML = `<p class="meta">Real photos taken by photographers near any place in India. Tap a photo to see where it was shot and get directions to that exact spot.</p>
<form class="row" id="psForm"><input id="psQ" type="search" placeholder="Any place in India, e.g. Hampi" style="flex:1" aria-label="Search place"><button class="pri" type="submit">Search</button></form>
<div class="row"><button class="sec" type="button" id="psMe">📍 Near me</button></div>
<h2>Photos near <span id="psAt"></span></h2><div class="psgrid" id="psGrid"></div>
<div class="card"><h3>Photo tips</h3><ul class="tips">${TIPS.map(t => `<li>${t}</li>`).join("")}</ul></div>
<p class="note">Photos: Wikimedia Commons, by the photographers named on each photo.</p>`;
$("#psForm").onsubmit = async e => { e.preventDefault(); const q = $("#psQ").value.trim(); if(!q) return;
try{ const g = await YS.geocode(q); g ? load(g.lat, g.lng, g.name) : toast("Place not found in India") }catch(err){ toast("Couldn't search. Check your internet.") } };
$("#psMe").onclick = () => { const m = YS.me(); load(m.lat, m.lng, "you") };
$("#psGrid").onclick = e => { const b = e.target.closest(".ps"); if(b) big(list[+b.dataset.i]) };
}
if(want || !at){ const p = want || PLACES.find(x => x.id === YS.selected()) || YS.me(); want = null; load(p.lat, p.lng, p.n || "you") }
};
const big = s => {
$("#sBody").innerHTML = `<img class="psbig" src="${esc(s.img.replace(/\/\d+px-/, "/960px-"))}" alt="${esc(s.name)}">
<h2 style="margin:10px 0 4px">${esc(s.name)}</h2>
<p class="meta">Photo shot here · ${Math.round(km(YS.me(), s))} km from you${s.by ? ` · by ${esc(s.by)}` : ""}${s.lic ? ` (${esc(s.lic)})` : ""}</p>
<div class="row"><button class="pri" type="button" id="psGo">Go to this photo spot</button><button class="sec" type="button" data-go="close">Close</button></div>`;
$("#sheet").classList.add("on");
$("#psGo").onclick = () => { $("#sheet").classList.remove("on"); YS.nav ? YS.nav(s.lat, s.lng, s.name) : toast("Directions not available") };
};
document.addEventListener("click", e => {
const b = e.target.closest("[data-act=photos]"); if(!b) return;
$("#sheet").classList.remove("on");
const p = PLACES.find(x => x.id === b.dataset.pid) || PLACES.find(x => x.id === YS.selected());
p ? YS.openPhotoSpots(p) : YS.show("photos");
});
if(typeof TITLES !== "undefined") TITLES.photos = "Photo spots";
const hub = $("#hub"); if(hub) hub.insertAdjacentHTML("beforeend", `<button class="tile" type="button" data-open="photos"><b>Photo spots</b><span>Best photo points in all of India</span></button>`);
})();
