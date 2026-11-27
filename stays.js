// ---------- Stays: full details inside the app (no Google Maps) ----------
(() => {
const {$, $$, esc, store, km, toast} = YS;
const TIER = ["Economy","Mid-range","Premium"], COLR = ["#1e6b63","#2e3a6b","#a8481f"];
const PRICE = {hostel:[400,1200], camp_site:[500,2500], guest_house:[800,2200], motel:[1000,2500], apartment:[1500,4000], chalet:[2500,7000]};
const AM = [["wifi","Wi-Fi"],["ac","AC"],["parking","Parking"],["food","Restaurant"],["breakfast","Breakfast"],["pool","Pool"],["wheel","Wheelchair access"],["pets","Pets allowed"]];
const yes = v => v && !/^(no|none)$/i.test(v);
const tierOf = t => { const s = parseFloat(t.stars) || 0, k = t.tourism;
if(/hostel|guest_house|camp_site/.test(k) || s && s <= 2) return 0;
if(s >= 4 || k === "resort" || /resort|palace|heritage|luxury/i.test(t.name || "")) return 2; return 1 };
function price(s){
if(s.t === 0) return PRICE[s.k] || [600, 1500];
if(s.t === 2) return s.stars >= 5 ? [8000, 25000] : [4500, 12000];
return PRICE[s.k] && s.k !== "hostel" ? PRICE[s.k] : s.stars >= 3 ? [2500, 5000] : [1500, 3500];
}
function parse(e){
const t = e.tags, a = [t["addr:housenumber"], t["addr:street"], t["addr:suburb"], t["addr:city"] || t["addr:place"] || t["addr:village"], t["addr:postcode"]].filter(Boolean);
const s = {id: e.type[0]+e.id, name: t.name, k: t.tourism, kind: t.tourism.replace("_"," "), stars: parseFloat(t.stars) || 0, t: tierOf(t),
lat: e.lat ?? e.center?.lat, lng: e.lon ?? e.center?.lon, addr: t["addr:full"] || a.join(", "),
phone: t.phone || t["contact:phone"] || t["contact:mobile"] || "", email: t.email || t["contact:email"] || "", web: t.website || t["contact:website"] || "",
rooms: t.rooms || "", beds: t.beds || "", cin: t.check_in || t.checkin || "", cout: t.check_out || t.checkout || "",
hours: t.opening_hours || "", op: t.operator || t.brand || "", desc: t.description || "", nameGu: t["name:gu"] || "", nameHi: t["name:hi"] || "",
pay: Object.keys(t).filter(k => /^payment:/.test(k) && yes(t[k])).map(k => k.slice(8).replace(/_/g," ")).join(", "),
am: {wifi: yes(t.internet_access) || yes(t.wifi), ac: yes(t.air_conditioning), parking: yes(t.parking), food: yes(t.restaurant) || yes(t.food),
breakfast: yes(t.breakfast), pool: yes(t.swimming_pool) || yes(t.pool), wheel: t.wheelchair === "yes", pets: yes(t.pets) || yes(t.dog)}};
s.price = price(s); return s;
}
const cache = {};
async function load(c){
const key = c.lat.toFixed(2)+","+c.lng.toFixed(2);
if(cache[key]) return cache[key];
const j = await YS.overpass(`[out:json][timeout:25];nwr(around:${c.id === "me" ? 6000 : 9000},${c.lat},${c.lng})[tourism~"^(hotel|guest_house|hostel|motel|resort|camp_site|chalet|apartment)$"][name];out center 120;`);
return cache[key] = j.elements.map(parse).filter(s => s.lat).map(s => ({...s, dist: km(c, s)}));
}
let tier = 0, sort = "near", only = "", saved = false, last = [];
const box = $("#stayList");
box.insertAdjacentHTML("beforebegin", `<div class="stbar" id="stBar">
<select id="stSort" aria-label="Sort stays" style="flex:none;width:auto;min-height:36px"><option value="near">Nearest</option><option value="cheap">Lowest price</option><option value="stars">Most stars</option></select>
<button class="sec" type="button" data-f="wifi" aria-pressed="false">Wi-Fi</button><button class="sec" type="button" data-f="ac" aria-pressed="false">AC</button>
<button class="sec" type="button" data-f="parking" aria-pressed="false">Parking</button><button class="sec" type="button" data-f="food" aria-pressed="false">Food</button>
<button class="sec" type="button" data-f="pool" aria-pressed="false">Pool</button><button class="sec" type="button" id="stSaved" aria-pressed="false">♥ Saved</button></div>`);
$("#stayAt").insertAdjacentHTML("afterbegin", `<option value="me">Near my location</option>`);
YS.stayFav = () => store.get("stayFav", []);
const card = s => `<div class="card stc" data-stay="${esc(s.id)}" tabindex="0">
<div class="av" style="background:${COLR[s.t]}">${esc(s.name[0])}</div>
<div><h3>${esc(s.name)}</h3>
<div class="meta">${esc(s.kind)}${s.stars ? " · "+"★".repeat(Math.min(5, s.stars)) : ""}${s.dist != null ? " · "+s.dist.toFixed(1)+" km" : ""}</div>
<div class="pr">₹${s.price[0].toLocaleString("en-IN")}–${s.price[1].toLocaleString("en-IN")} <small class="meta">per night (est.)</small></div>
<div class="amen">${AM.filter(a => s.am[a[0]]).map(a => a[1]).join(" · ") || (s.phone ? "Phone listed" : "")}</div></div></div>`;
window.renderStays = async function(){
const v = $("#stayAt").value || PLACES[0].id, me = YS.me();
const c = v === "me" ? {id:"me", n:"your location", lat: me.lat, lng: me.lng} : PLACES.find(x => x.id === v) || PLACES[0];
if(saved){
last = YS.stayFav();
box.innerHTML = last.length ? last.map(card).join("") : `<div class="empty">No saved stays yet. Open a stay and tap Save.</div>`; return;
}
box.innerHTML = `<div class="empty">Loading stays near ${esc(c.n)}…</div>`;
try{
const all = await load(c); if(($("#stayAt").value || PLACES[0].id) !== v) return;
let list = all.filter(s => s.t === tier && (!only || s.am[only]));
list.sort(sort === "cheap" ? (a, b) => a.price[0] - b.price[0] : sort === "stars" ? (a, b) => b.stars - a.stars || a.dist - b.dist : (a, b) => a.dist - b.dist);
last = list.slice(0, 40);
box.innerHTML = `<div class="meta">${list.length} ${TIER[tier].toLowerCase()} stays within ${c.id === "me" ? 6 : 9} km of ${esc(c.n)}. Tap one for full details.</div>`
+ (last.length ? last.map(card).join("") : `<div class="empty">No ${TIER[tier].toLowerCase()} stays${only ? " with that facility" : ""} listed here yet. Try another budget.</div>`)
+ `<p class="note">Hotel details come from OpenStreetMap, kept up to date by volunteers. Prices are typical ranges for this type of stay, not live rates. Call the stay to confirm price and rooms.</p>`;
}catch(e){ box.innerHTML = `<div class="empty">Couldn't load hotels right now (no internet or server busy). Your saved stays still work offline: tap ♥ Saved.</div>` }
};
YS.renderers.stays = window.renderStays;
box.addEventListener("click", e => { const c = e.target.closest("[data-stay]"); if(c){ const s = last.find(x => x.id === c.dataset.stay); if(s) YS.openStay(s) } });
box.addEventListener("keydown", e => { if(e.key === "Enter" && e.target.dataset.stay) e.target.click() });
$("#stayAt").onchange = () => { const v = $("#stayAt").value; if(v !== "me") selectPlace(v); renderStays() };
$$("#tier button").forEach(b => b.onclick = () => { tier = +b.dataset.t; $$("#tier button").forEach(x => x.setAttribute("aria-pressed", x === b)); renderStays() });
$("#stSort").onchange = e => { sort = e.target.value; renderStays() };
$$("#stBar [data-f]").forEach(b => b.onclick = () => { only = only === b.dataset.f ? "" : b.dataset.f; $$("#stBar [data-f]").forEach(x => x.setAttribute("aria-pressed", x.dataset.f === only)); renderStays() });
$("#stSaved").onclick = e => { saved = !saved; e.currentTarget.setAttribute("aria-pressed", saved); renderStays() };
YS.stayAM = AM; YS.stayTier = TIER;
})();
