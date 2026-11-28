// ---------- Travel tools: nearby essentials, offline places, trip planner, expense split, golden hour, festivals ----------
(() => {
const {$, esc, store, km, toast} = YS;
const I = p => `<svg viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`;
const VIEWS = [
["nearby","Nearby essentials","Nearby",'<circle cx="12" cy="10" r="3"/><path d="M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11z"/><path d="M12 3v2M12 15v2"/>'],
["planner","Trip planner","Trip planner",'<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4M7 13h4M7 17h7"/>'],
["split","Trip budget & split","Split costs",'<circle cx="12" cy="12" r="9"/><path d="M15 8h-4.5a2 2 0 0 0 0 4h3a2 2 0 0 1 0 4H9M12 6v2M12 16v2"/>'],
["offline","Saved for offline","Offline",'<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>'],
["golden","Golden hour","Golden hour",'<circle cx="12" cy="14" r="4"/><path d="M3 18h18M12 4v3M5 8l2 2M19 8l-2 2"/>'],
["fest","Festivals of India","Festivals",'<path d="M4 21V4l8 4-8 4M14 21l3-9 3 9M15 18h4"/>']];
const main = $("main");
VIEWS.forEach(v => { main.insertAdjacentHTML("beforeend", `<section class="view" id="v-${v[0]}"></section>`); TITLES[v[0]] = v[1] });
const tiles = $("#v-home .tiles");
if(tiles) tiles.insertAdjacentHTML("beforeend", VIEWS.map(v => `<button type="button" data-open="${v[0]}"><i>${I(v[3])}</i>${v[2]}</button>`).join(""));
const once = {};
const page = (id, build, refresh) => { YS.renderers[id] = () => { if(!once[id]){ once[id] = 1; build($("#v-" + id)) } refresh && refresh() } };
const dist = p => Math.round(km(YS.me(), p) * 10) / 10;
const navBtn = (lat, lng, n) => `<button class="sec" type="button" data-navto="${lat},${lng}" data-name="${esc(n)}">Directions</button>`;
document.addEventListener("click", e => { const b = e.target.closest("[data-navto]"); if(!b) return; const [a, c] = b.dataset.navto.split(",").map(Number); YS.nav ? YS.nav(a, c, b.dataset.name) : toast("Directions not available") });
const placeById = id => PLACES.find(x => x.id === id);
const share = async text => { try{ if(navigator.share){ await navigator.share({text}); return } }catch(e){ return } window.open("https://wa.me/?text=" + encodeURIComponent(text), "_blank", "noopener") };

// ===== 1. Nearby essentials (OpenStreetMap) =====
const ESS = [["atm","🏧 ATM",'node["amenity"="atm"]'],["hospital","🏥 Hospital",'nwr["amenity"~"^(hospital|clinic|doctors)$"]'],["pharmacy","💊 Pharmacy",'nwr["amenity"="pharmacy"]'],
["police","👮 Police",'nwr["amenity"="police"]'],["toilets","🚻 Toilets",'nwr["amenity"="toilets"]'],["ev","🔌 EV charging",'nwr["amenity"="charging_station"]'],
["fuel","⛽ Petrol",'nwr["amenity"="fuel"]'],["bus","🚌 Bus stand",'nwr["amenity"="bus_station"]'],["rail","🚆 Railway station",'nwr["railway"="station"]["station"!="subway"]']];
let essKind = "atm";
const loadNear = async () => {
const box = $("#nbList"), k = ESS.find(x => x[0] === essKind), m = YS.me();
box.innerHTML = `<div class="empty">Finding ${esc(k[1])} near ${esc(m.name || "you")}…</div>`;
for(const r of [3000, 15000]){
try{
const j = await YS.overpass(`[out:json][timeout:25];(${k[2]}(around:${r},${m.lat},${m.lng}););out center 60;`);
const list = j.elements.map(el => ({lat: el.lat ?? el.center?.lat, lng: el.lon ?? el.center?.lon, t: el.tags || {}})).filter(x => x.lat != null)
.map(x => ({...x, d: dist(x)})).sort((a, b) => a.d - b.d).slice(0, 30);
if(!list.length && r < 15000) continue;
box.innerHTML = list.length ? list.map(x => { const n = x.t.name || x.t.operator || k[1].slice(3);
return `<div class="card"><h3>${esc(n)}</h3><div class="meta">${x.d} km away${x.t.opening_hours ? " · " + esc(x.t.opening_hours) : ""}</div>
<div class="row" style="margin:6px 0 0">${navBtn(x.lat, x.lng, n)}${x.t.phone ? `<a class="btn sec" href="tel:${esc(x.t.phone.replace(/[^\d+]/g, ""))}">Call</a>` : ""}</div></div>` }).join("")
: `<div class="empty">None found within 15 km. Try another type or move the map location.</div>`;
return;
}catch(e){ box.innerHTML = `<div class="empty">Couldn't load. Check your internet and try again.</div>`; return }
}
};
page("nearby", el => {
el.innerHTML = `<p class="meta">Real places from OpenStreetMap around your location, anywhere in India.</p>
<div class="chips" id="nbKinds">${ESS.map(k => `<button type="button" class="chip${k[0] === essKind ? " on" : ""}" data-k="${k[0]}">${k[1]}</button>`).join("")}</div>
<div id="nbList"></div><p class="note">Opening hours and phone numbers come from OpenStreetMap and may be out of date.</p>`;
$("#nbKinds").onclick = e => { const b = e.target.closest(".chip"); if(!b) return; essKind = b.dataset.k;
$("#nbKinds").querySelectorAll(".chip").forEach(c => c.classList.toggle("on", c === b)); loadNear() };
}, loadNear);

// ===== 2. Save places for offline use =====
const OFF = () => store.get("offline", {});
const tile = (lat, lng, z) => { const n = 2 ** z, x = Math.floor((lng + 180) / 360 * n), r = lat * Math.PI / 180;
return [x, Math.floor((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * n)] };
YS.saveOffline = async id => {
const p = placeById(id); if(!p) return;
toast("Saving " + p.n + " for offline…");
const text = p.live ? await YS.wikiText(p.wiki || p.n) : p.d;
const keep = {id: p.id, n: p.n, c: p.c, d: p.d, lat: p.lat, lng: p.lng, best: p.best, live: p.live, img: p.img, wiki: p.wiki, type: p.type, shoot: p.shoot, rail: p.rail};
const all = OFF(); all[id] = {p: keep, text, saved: Date.now()}; store.set("offline", all);
const jobs = [];
try{ const u = await YS.photo(id); if(u) [330, 960].forEach(w => jobs.push(fetch(YS.wsize(u, w), {mode: "no-cors"}))) }catch(e){}
// a small map around the place (zoom 12–14, 3×3 tiles each) so the map still shows without signal
[12, 13, 14].forEach(z => { const [x, y] = tile(p.lat, p.lng, z);
for(let dx = -1; dx <= 1; dx++) for(let dy = -1; dy <= 1; dy++) jobs.push(fetch(`https://tile.openstreetmap.org/${z}/${x + dx}/${y + dy}.png`, {mode: "no-cors"})) });
await Promise.allSettled(jobs);
toast(p.n + " saved. It works without the internet now.");
if($("#v-offline").classList.contains("on")) YS.renderers.offline();
};
const drawOffline = () => {
const all = OFF(), list = Object.values(all).sort((a, b) => b.saved - a.saved), box = $("#offList"); if(!box) return;
box.innerHTML = list.length ? list.map(o => `<div class="card"><h3>${esc(o.p.n)}</h3><div class="meta">${esc(o.p.c || "")} · Best ${esc(o.p.best || "")} · saved ${new Date(o.saved).toLocaleDateString("en-IN")}</div>
<p>${esc((o.text || o.p.d || "").slice(0, 400))}</p>
<div class="row" style="margin:0"><button class="pri" type="button" data-offopen="${esc(o.p.id)}">Open</button>${navBtn(o.p.lat, o.p.lng, o.p.n)}<button class="sec" type="button" data-offdel="${esc(o.p.id)}">Remove</button></div></div>`).join("")
: `<div class="empty">Nothing saved yet. Open any place and tap "Save offline" before you travel to areas with weak signal.</div>`;
};
page("offline", el => {
el.innerHTML = `<p class="meta">Places you saved: details, photo and a small map that work without the internet.</p><div id="offList"></div>`;
el.onclick = e => {
const o = e.target.closest("[data-offopen]"), d = e.target.closest("[data-offdel]");
if(o){ const x = OFF()[o.dataset.offopen]; if(!x) return; x.p.live ? YS.openLive(x.p) : openPlace(x.p.id) }
if(d){ const all = OFF(); delete all[d.dataset.offdel]; store.set("offline", all); drawOffline() }
};
}, drawOffline);

// buttons on every place page: Save offline (+ room for more from other files)
const addBtns = () => { const row = $("#sBody .row"), id = YS.selected && YS.selected(); if(!row || !id || row.querySelector("[data-saveoff]")) return;
row.insertAdjacentHTML("beforeend", `<button class="sec" type="button" data-saveoff="${esc(id)}">${OFF()[id] ? "Saved offline ✓" : "Save offline"}</button>`) };
const op = window.openPlace; window.openPlace = id => { op(id); addBtns() };
const ol = YS.openLive; YS.openLive = raw => { ol(raw); addBtns() };
YS.addPlaceBtns = addBtns;
document.addEventListener("click", e => { const b = e.target.closest("[data-saveoff]"); if(b){ b.textContent = "Saving…"; YS.saveOffline(b.dataset.saveoff).then(() => b.textContent = "Saved offline ✓") } });

// ===== 3. Trip planner =====
let plan = store.get("plan", {ids: [], days: 2});
const legKm = (a, b) => Math.round(km(a, b) * 1.3);
const hrs = k => { const h = k / 45; return h < 1 ? Math.round(h * 60) + " min" : (Math.round(h * 10) / 10) + " h" };
const drawPlan = () => {
const sel = $("#plSel"); if(!sel) return;
sel.innerHTML = plan.ids.length ? plan.ids.map(id => { const p = placeById(id); return p ? `<span class="chip on">${esc(p.n)} <b data-plrm="${esc(id)}" role="button" aria-label="Remove ${esc(p.n)}">✕</b></span>` : "" }).join("") : `<span class="meta">No places yet. Add some below.</span>`;
$("#plAdd").innerHTML = `<option value="">Add a place…</option>` + YS.placeOptions();
$("#plDays").value = plan.days;
const ps = plan.ids.map(placeById).filter(Boolean), out = $("#plOut");
if(!ps.length){ out.innerHTML = ""; return }
// nearest-first route from where you are now
let cur = YS.me(); const left = [...ps], order = [];
while(left.length){ left.sort((a, b) => km(cur, a) - km(cur, b)); cur = left.shift(); order.push(cur) }
const per = Math.ceil(order.length / plan.days); let prev = YS.me(), total = 0, html = "", txt = "My trip plan (Yatra Saathi)\n";
for(let d = 0; d < plan.days; d++){
const day = order.slice(d * per, d * per + per); if(!day.length) break;
html += `<div class="card"><h3>Day ${d + 1}</h3>`; txt += `\nDay ${d + 1}\n`;
day.forEach(p => { const k = legKm(prev, p); total += k;
html += `<div class="row" style="margin:6px 0;align-items:center"><div style="flex:1"><b>${esc(p.n)}</b><div class="meta">${k} km · about ${hrs(k)} by road · best ${esc(p.best)}</div></div>${navBtn(p.lat, p.lng, p.n)}</div>`;
txt += `• ${p.n} (${k} km, ~${hrs(k)})\n`; prev = p });
html += `</div>`;
}
out.innerHTML = html + `<p class="meta">Total about ${total} km by road. Distances are estimates; check routes before you go.</p>
<div class="row"><button class="pri" type="button" id="plShare">Share plan</button><button class="sec" type="button" id="plClear">Clear</button></div>`;
$("#plShare").onclick = () => share(txt + `\nAbout ${total} km in total.`);
$("#plClear").onclick = () => { plan = {ids: [], days: plan.days}; store.set("plan", plan); drawPlan() };
};
page("planner", el => {
el.innerHTML = `<p class="meta">Pick places, choose days, and get a day-by-day plan in the best order from where you are.</p>
<div class="chips" id="plSel" style="flex-wrap:wrap"></div>
<div class="row"><select id="plAdd" style="flex:1" aria-label="Add a place"></select><label style="margin:0">Days <input id="plDays" type="number" min="1" max="30" style="width:70px"></label></div>
<form class="row" id="plFind"><input id="plQ" type="search" placeholder="Add any place in India, e.g. Munnar" style="flex:1" aria-label="Find a place"><button class="sec" type="submit">Find</button></form>
<div id="plOut"></div>`;
const add = id => { if(id && !plan.ids.includes(id)){ plan.ids.push(id); store.set("plan", plan) } drawPlan() };
$("#plAdd").onchange = e => add(e.target.value);
$("#plDays").onchange = e => { plan.days = Math.max(1, Math.min(30, +e.target.value || 1)); store.set("plan", plan); drawPlan() };
$("#plSel").onclick = e => { const b = e.target.closest("[data-plrm]"); if(b){ plan.ids = plan.ids.filter(x => x !== b.dataset.plrm); store.set("plan", plan); drawPlan() } };
$("#plFind").onsubmit = async e => { e.preventDefault(); const q = $("#plQ").value.trim(); if(!q) return; toast("Finding " + q + "…");
try{ const p = (await YS.wikiSearch(q)).list[0]; if(!p) return toast("Place not found"); add(YS.addPlace(p).id); $("#plQ").value = "" }catch(err){ toast("Couldn't search. Check your internet.") } };
}, drawPlan);

// ===== 4. Trip budget & expense split =====
let sp = store.get("split", {budget: 0, people: [], items: []});
const rs = n => "₹" + Math.round(n).toLocaleString("en-IN");
const drawSplit = () => {
if(!$("#spOut")) return; store.set("split", sp);
$("#spBudget").value = sp.budget || "";
$("#spPeople").innerHTML = sp.people.map((n, i) => `<span class="chip on">${esc(n)} <b data-sprm="${i}" role="button" aria-label="Remove ${esc(n)}">✕</b></span>`).join("") || `<span class="meta">Add the people on this trip.</span>`;
$("#spWho").innerHTML = sp.people.map((n, i) => `<option value="${i}">${esc(n)} paid</option>`).join("");
const total = sp.items.reduce((s, x) => s + x.a, 0), each = sp.people.length ? total / sp.people.length : 0;
const bal = sp.people.map((n, i) => ({n, b: sp.items.filter(x => x.w === i).reduce((s, x) => s + x.a, 0) - each}));
const pay = [], cr = bal.filter(x => x.b > 0.5).map(x => ({...x})), dr = bal.filter(x => x.b < -0.5).map(x => ({...x}));
while(cr.length && dr.length){ const a = Math.min(cr[0].b, -dr[0].b); pay.push(`${dr[0].n} pays ${cr[0].n} ${rs(a)}`); cr[0].b -= a; dr[0].b += a; if(cr[0].b < 0.5) cr.shift(); if(dr[0].b > -0.5) dr.shift() }
const over = sp.budget && total > sp.budget;
$("#spOut").innerHTML = `<div class="card"><h3>Spent ${rs(total)}${sp.budget ? ` of ${rs(sp.budget)}` : ""}</h3>
${sp.budget ? `<div class="meta" style="color:${over ? "var(--red)" : "inherit"}">${over ? "Over budget by " + rs(total - sp.budget) : rs(sp.budget - total) + " left"}</div>` : ""}
${sp.people.length ? `<div class="meta">Each person's share: ${rs(each)}</div>` : ""}</div>
${pay.length ? `<div class="card"><h3>Settle up</h3>${pay.map(t => `<div>• ${esc(t)}</div>`).join("")}</div>` : ""}
${sp.items.slice().reverse().map((x, j) => `<div class="card" style="display:flex;justify-content:space-between;align-items:center"><div><b>${esc(x.t || "Expense")}</b><div class="meta">${esc(sp.people[x.w] || "?")} paid ${rs(x.a)}</div></div><button class="sec" type="button" data-spdel="${sp.items.length - 1 - j}" aria-label="Delete">✕</button></div>`).join("")}
${sp.items.length ? `<div class="row"><button class="pri" type="button" id="spShare">Share summary</button><button class="sec" type="button" id="spReset">New trip</button></div>` : ""}`;
if($("#spShare")) $("#spShare").onclick = () => share(`Trip expenses (Yatra Saathi)\nTotal: ${rs(total)}\nEach: ${rs(each)}\n${pay.join("\n") || "All settled!"}`);
if($("#spReset")) $("#spReset").onclick = () => { if(confirm("Clear all expenses and start a new trip?")){ sp = {budget: 0, people: sp.people, items: []}; drawSplit() } };
};
page("split", el => {
el.innerHTML = `<label>Trip budget (₹)<input id="spBudget" type="number" min="0" inputmode="numeric" placeholder="e.g. 20000"></label>
<h2>People</h2><div class="chips" id="spPeople" style="flex-wrap:wrap"></div>
<form class="row" id="spAddP"><input id="spName" placeholder="Name" style="flex:1" aria-label="Name"><button class="sec" type="submit">Add</button></form>
<h2>Add expense</h2>
<form id="spAddE"><div class="row"><select id="spWho" style="flex:1" aria-label="Who paid"></select><input id="spAmt" type="number" min="1" inputmode="numeric" placeholder="₹ amount" style="width:120px" aria-label="Amount"></div>
<div class="row"><input id="spWhat" placeholder="For what? e.g. Hotel, taxi, food" style="flex:1" aria-label="For what"><button class="pri" type="submit">Add</button></div></form>
<div id="spOut"></div><p class="note">Saved only on this phone.</p>`;
$("#spBudget").onchange = e => { sp.budget = Math.max(0, +e.target.value || 0); drawSplit() };
$("#spAddP").onsubmit = e => { e.preventDefault(); const n = $("#spName").value.trim(); if(n && !sp.people.includes(n)){ sp.people.push(n); $("#spName").value = ""; drawSplit() } };
$("#spAddE").onsubmit = e => { e.preventDefault(); const a = +$("#spAmt").value; if(!sp.people.length) return toast("Add people first");
if(!(a > 0)) return toast("Enter an amount"); sp.items.push({w: +$("#spWho").value, a, t: $("#spWhat").value.trim()}); $("#spAmt").value = $("#spWhat").value = ""; drawSplit() };
el.addEventListener("click", e => {
const d = e.target.closest("[data-spdel]"), r = e.target.closest("[data-sprm]");
if(d){ sp.items.splice(+d.dataset.spdel, 1); drawSplit() }
if(r){ const i = +r.dataset.sprm; if(sp.items.some(x => x.w === i)) return toast("This person has expenses. Delete those first.");
sp.people.splice(i, 1); sp.items.forEach(x => { if(x.w > i) x.w-- }); drawSplit() }
});
}, drawSplit);

// ===== 5. Golden hour (sun times calculated on the phone) =====
const rad = Math.PI / 180, J1970 = 2440588, J2000 = 2451545, J0 = 0.0009, ob = rad * 23.4397;
const sun = (date, lat, lng) => {
const lw = rad * -lng, phi = rad * lat, d = date.valueOf() / 864e5 - 0.5 + J1970 - J2000;
const n = Math.round(d - J0 - lw / (2 * Math.PI)), ds = J0 + lw / (2 * Math.PI) + n;
const M = rad * (357.5291 + 0.98560028 * ds), C = rad * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M));
const L = M + C + rad * 102.9372 + Math.PI, dec = Math.asin(Math.sin(ob) * Math.sin(L));
const noon = J2000 + ds + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * L);
const at = h => { const w = Math.acos((Math.sin(h * rad) - Math.sin(phi) * Math.sin(dec)) / (Math.cos(phi) * Math.cos(dec)));
const set = J2000 + (J0 + (w + lw) / (2 * Math.PI) + n) + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * L);
const j = x => new Date((x + 0.5 - J1970) * 864e5); return [j(noon - (set - noon)), j(set)] };
const [rise, set] = at(-0.833), [ge, gs] = at(6), [dawn, dusk] = at(-6);
return {rise, set, ge, gs, dawn, dusk};
};
const tm = d => isNaN(d) ? "—" : d.toLocaleTimeString("en-IN", {hour: "numeric", minute: "2-digit"});
YS.sunTimes = sun;
const drawGolden = () => {
const s = $("#ghAt"); if(!s) return;
const p = placeById(s.value) || YS.me(), dt = new Date(($("#ghDate").value || new Date().toISOString().slice(0, 10)) + "T12:00:00");
const t = sun(dt, p.lat, p.lng);
$("#ghOut").innerHTML = `<div class="card"><h3>🌅 Morning</h3><div>Blue hour: ${tm(t.dawn)} – ${tm(t.rise)}</div><div><b>Golden hour: ${tm(t.rise)} – ${tm(t.ge)}</b></div><div class="meta">Sunrise ${tm(t.rise)}</div></div>
<div class="card"><h3>🌇 Evening</h3><div><b>Golden hour: ${tm(t.gs)} – ${tm(t.set)}</b></div><div>Blue hour: ${tm(t.set)} – ${tm(t.dusk)}</div><div class="meta">Sunset ${tm(t.set)}</div></div>
<p class="note">Calculated for ${esc(p.n || "your location")}. Hills and buildings can hide the sun a few minutes earlier.</p>`;
};
page("golden", el => {
el.innerHTML = `<p class="meta">Soft golden light for photos and videos, for any place and date.</p>
<div class="row"><select id="ghAt" style="flex:1" aria-label="Place"><option value="me">My location</option>${YS.placeOptions()}</select><input id="ghDate" type="date" aria-label="Date"></div>
<div id="ghOut"></div>`;
$("#ghDate").value = new Date().toISOString().slice(0, 10);
if(YS.selected && YS.selected()) $("#ghAt").value = YS.selected();
$("#ghAt").onchange = $("#ghDate").onchange = drawGolden;
}, () => { const s = $("#ghAt"); if(s){ const v = s.value; s.innerHTML = `<option value="me">My location</option>` + YS.placeOptions(); s.value = v } drawGolden() });

// ===== 6. Festivals of India =====
const FEST = [["Uttarayan – International Kite Festival","Ahmedabad, Gujarat",[1],"Kites fill the sky on 14 January.","Sabarmati Riverfront"],
["Jaipur Literature Festival","Jaipur, Rajasthan",[1],"Usually in late January.","Hawa Mahal"],
["Desert Festival","Jaisalmer, Rajasthan",[2],"Usually in February.","Jaisalmer Fort"],
["Goa Carnival","Panaji, Goa",[2,3],"Parades before Lent, February or March.","Basilica of Bom Jesus"],
["Losar","Ladakh and Sikkim",[2,3],"Tibetan New Year with monastery dances.","Rumtek Monastery"],
["Holi in Braj","Mathura and Vrindavan, Uttar Pradesh",[3],"Lathmar Holi in Barsana and colours in Vrindavan.","Banke Bihari Temple"],
["Thrissur Pooram","Thrissur, Kerala",[4,5],"Elephant parade and fireworks.","Vadakkumnathan Temple"],
["Hemis Festival","Ladakh",[6,7],"Masked dances at Hemis Monastery.","Hemis Monastery"],
["Rath Yatra","Puri, Odisha",[6,7],"Chariot festival of Lord Jagannath.","Jagannath Temple, Puri"],
["Nehru Trophy Boat Race","Alappuzha, Kerala",[8],"Snake-boat race, usually in August.","Punnamada Lake"],
["Onam","Kerala",[8,9],"Harvest festival with boat races and feasts.","Alappuzha Beach"],
["Ziro Music Festival","Ziro, Arunachal Pradesh",[9],"Outdoor music in the Ziro valley.","Ziro valley"],
["Navratri Garba","Gujarat",[9,10],"Nine nights of garba dance.","Ambaji Temple"],
["Durga Puja","Kolkata, West Bengal",[9,10],"Art-filled pandals across the city.","Victoria Memorial, Kolkata"],
["Mysuru Dasara","Mysuru, Karnataka",[9,10],"Lit-up palace and royal procession.","Mysore Palace"],
["Pushkar Camel Fair","Pushkar, Rajasthan",[10,11],"Around Kartik Purnima.","Pushkar Lake"],
["Dev Deepawali","Varanasi, Uttar Pradesh",[11],"Lamps on the ghats on Kartik Purnima.","Dashashwamedh Ghat"],
["Rann Utsav","Kutch, Gujarat",[11,12,1,2],"Tent city on the white salt desert.","Great Rann of Kutch"],
["Sangai Festival","Imphal, Manipur",[11],"21–30 November.","Loktak Lake"],
["Hornbill Festival","Kohima, Nagaland",[12],"1–10 December.","Kisama Heritage Village"],
["Konark Dance Festival","Konark, Odisha",[12],"1–5 December.","Konark Sun Temple"]];
const MON = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
page("fest", el => {
const m = new Date().getMonth() + 1, nx = m % 12 + 1;
const soon = FEST.filter(f => f[2].includes(m) || f[2].includes(nx)), rest = FEST.filter(f => !soon.includes(f));
const card = f => `<div class="card"><h3>${esc(f[0])}</h3><div class="meta">${esc(f[1])} · ${f[2].map(x => MON[x - 1]).join(", ")}</div><p>${esc(f[3])}</p>
<button class="sec" type="button" data-festgo="${esc(f[4])}">Open place</button></div>`;
el.innerHTML = `<h2>This month and next</h2>${soon.map(card).join("") || `<div class="empty">No big festivals listed for these months.</div>`}<h2>All year</h2>${rest.map(card).join("")}
<p class="note">Most festival dates follow the Hindu or lunar calendar and change every year. Check the official dates before you book.</p>`;
el.onclick = async e => { const b = e.target.closest("[data-festgo]"); if(!b) return; toast("Opening " + b.dataset.festgo + "…");
try{ const p = (await YS.wikiSearch(b.dataset.festgo)).list[0]; p ? YS.openLive(p) : toast("Place not found") }catch(err){ toast("Couldn't open. Check your internet.") } };
});

// ===== 7. More helplines on the SOS page =====
const sos = YS.renderers.sos;
YS.renderers.sos = () => { sos && sos(); const el = $("#v-sos"); if(!el || $("#sosMore")) return;
el.insertAdjacentHTML("beforeend", `<div id="sosMore"><h2>More helplines</h2>${[["1091","Women police helpline"],["1033","Highway emergency (NHAI)"],["139","Railway help (Rail Madad)"],["1930","Cyber fraud and online money loss"],["102","Ambulance (some states)"]]
.map(n => `<div class="card call"><div><h3>${n[0]}</h3><div class="meta">${n[1]}</div></div><a class="btn pri" href="tel:${n[0]}">Call</a></div>`).join("")}
<p class="note">These numbers work across India. 112 connects police, fire and ambulance in every state.</p></div>`) };
})();
