// ---------- All-India places: live from Wikipedia + OpenStreetMap search ----------
(() => {
const {$, esc, store, km} = YS;
const W = "https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&prop=coordinates|pageimages|description&piprop=thumbnail&pithumbsize=500&pilimit=50&colimit=50";
const NOT = /^(village|census town|town|city|municipality|metropolis|capital|railway station|metro station|bus station|airport|school|college|university|hospital|neighbourhood|suburb|area|locality|assembly constituency|lok sabha constituency|constituency|district|tehsil|taluka?|mandal|company|road|highway|street|festival|annual|state of|union territory|river|human settlement|ward|panchayat)/i;
const KIND = [[/temple|mandir|shrine|gurudwara|church|mosque|masjid|dargah|monastery|gompa|basilica|cathedral|jyotirlinga|ashram|math\b/i,"Temple","pilgrimage"],
[/fort|palace|qila|mahal|tomb|monument|stepwell|vav\b|ruins|caves?\b|heritage|museum|haveli|archaeolog|memorial|minar|gate/i,"Heritage","heritage"],
[/beach|island|coast|bay\b/i,"Beach","beach"],[/national park|sanctuary|wildlife|zoo|tiger|reserve|bird/i,"Wildlife","wildlife"],
[/desert|dune|rann/i,"Desert","desert"],[/waterfall|falls|lake|dam|valley|hill|peak|mountain|forest|garden|park|glacier|pass\b|trek/i,"Nature","hill"]];
const SHOOT = {pilgrimage:["Main gate and spire at sunrise","Evening aarti or prayer lights","Wide shot with the crowd for scale"],
heritage:["Front facade in soft morning light","Arches and windows as frames","Details: carvings, doors, textures"],
beach:["Sunset silhouettes at the waterline","Low angle with waves in front","Drone-free wide shot from a high point"],
wildlife:["Early safari for golden light","Long lens, stay quiet and patient","Waterholes in the afternoon"],
desert:["Sunrise and sunset over the sand","Footprints and dune lines","Night sky away from lights"],
hill:["Viewpoint at sunrise above the clouds","Waterfall with slow shutter","Winding road from above"]};
const BEST = {pilgrimage:"Oct to Mar", heritage:"Oct to Mar", beach:"Nov to Mar", wildlife:"Oct to Apr", desert:"Nov to Feb", hill:"Mar to Jun, Sep to Nov"};
const kind = s => (KIND.find(k => k[0].test(s)) || [0,"Attraction","heritage"]).slice(1);
YS.toPlace = pg => {
const c = pg.coordinates && pg.coordinates[0]; if(!c) return null;
if(NOT.test(pg.description || "") || /^(List of|Tourism in|Culture of|History of)/.test(pg.title)) return null;
const [cat, type] = kind(pg.title + " " + (pg.description || ""));
return {id:"w" + pg.pageid, n:pg.title.replace(/\s*\([^)]*\)$/, ""), c:cat, type, lat:c.lat, lng:c.lon, d:pg.description || "",
img:pg.thumbnail && pg.thumbnail.source, wiki:pg.title, live:1, rail:0, best:(c.lat > 29 && type === "hill") ? "Apr to Jun, Sep to Oct" : BEST[type], shoot:SHOOT[type]};
};
const pages = j => Object.values((j.query && j.query.pages) || {}).sort((a,b) => (a.index||0) - (b.index||0)).map(YS.toPlace).filter(Boolean)
.sort((a,b) => !!b.img - !!a.img);
YS.wikiNear = async (lat, lng, r = 10000) => {
const j = await (await fetch(`${W}&generator=geosearch&ggscoord=${lat}|${lng}&ggsradius=${r}&ggslimit=50`)).json();
return pages(j);
};
YS.wikiSearch = async (q, offset = 0) => {
const s = `${q} tourist attraction temple OR fort OR beach OR waterfall OR palace OR lake OR park OR hill`;
const j = await (await fetch(`${W}&generator=search&gsrlimit=50&gsroffset=${offset}&gsrsearch=${encodeURIComponent(s)}`)).json();
return {list: pages(j), more: j.continue ? j.continue.gsroffset : 0};
};
YS.wikiText = async title => {
try{ const j = await (await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, "_"))}`)).json(); return j.extract || "" }catch(e){ return "" }
};
YS.geocode = async q => {
const j = await (await fetch(`https://nominatim.openstreetmap.org/search?format=json&countrycodes=in&limit=1&q=${encodeURIComponent(q)}`)).json();
return j[0] ? {lat:+j[0].lat, lng:+j[0].lon, name:j[0].display_name.split(",")[0]} : null;
};

// photos from any Wikimedia host (also fixes photos for older places)
const okImg = u => typeof u === "string" && /^https:\/\/(upload|thumb)\.wikimedia\.org\//.test(u);
YS.okImg = okImg;
const ph = YS.photo;
YS.photo = id => { const p = PLACES.find(x => x.id === id); return p && p.img && okImg(p.img) ? Promise.resolve(p.img) : ph(id) };

// add a live place everywhere (lists, map, stays, routes, creator) and remember it
let saved = store.get("livePlaces", []);
const pin = () => L.divIcon({className:"", html:`<div class="pin live"></div>`, iconSize:[28,28], iconAnchor:[14,28]});
YS.addPlace = (p, keep = true) => {
if(p.img) p.img = YS.wsize ? YS.wsize(p.img, 330) : p.img;
// same place already in the list (e.g. Statue of Unity): use that one, don't add a copy
const same = PLACES.find(x => x.id !== p.id && x.n.toLowerCase() === p.n.toLowerCase() && km(x, p) < 5);
if(same){ if(keep === false){ saved = saved.filter(x => x.id !== p.id); store.set("livePlaces", saved) } return same }
if(!PLACES.some(x => x.id === p.id)){
PLACES.push(p);
["#stayAt","#routeTo","#hTo","#crAt"].forEach(s => { const el = $(s); if(el && !el.querySelector(`option[value="${p.id}"]`)) el.insertAdjacentHTML("beforeend", `<option value="${p.id}">${esc(p.n)}</option>`) });
if(YS.map) L.marker([p.lat, p.lng], {icon: pin(), title: p.n}).addTo(YS.map).on("click", () => YS.openLive(p));
}
if(keep){ saved = [p, ...saved.filter(x => x.id !== p.id)].slice(0, 40); store.set("livePlaces", saved) }
return PLACES.find(x => x.id === p.id);
};
saved.slice().reverse().forEach(p => YS.addPlace(p, false));
YS.dist = p => Math.round(km(YS.me(), p));
})();
