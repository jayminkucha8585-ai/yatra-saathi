// ---------- My Trip: plan-a-trip wizard, trip dashboard widgets, day-by-day timeline ----------
(() => {
const {$, esc, store, km, toast} = YS;
const I = p => `<svg viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`;
const main = $("main");
[["trip","My trip"],["days","Day by day"],["newtrip","Plan a new trip"]].forEach(v => { main.insertAdjacentHTML("beforeend", `<section class="view" id="v-${v[0]}"></section>`); TITLES[v[0]] = v[1] });
const once = {};
const page = (id, build, refresh) => { YS.renderers[id] = () => { if(!once[id]){ once[id] = 1; build($("#v-" + id)) } refresh && refresh() } };
let trip = store.get("trip", null);
const save = () => store.set("trip", trip);
const byId = id => PLACES.find(p => p.id === id);
const rs = n => "₹" + Math.round(n).toLocaleString("en-IN");
const fmt = d => new Date(d + "T00:00Z").toLocaleDateString("en-IN", {day: "numeric", month: "short", timeZone: "UTC"});
const today = () => { const d = new Date(); return new Date(d - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10) };
const addDays = (d, n) => { const x = new Date(d + "T00:00Z"); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10) };
const nDays = t => Math.max(1, Math.round((new Date(t.end) - new Date(t.start)) / 864e5) + 1);
const left = t => Math.round((new Date(t.start + "T00:00Z") - new Date(today() + "T00:00Z")) / 864e5);

// "My trip" button first on the Home screen, plus a glass trip card under the tiles
const tiles = $("#v-home .tiles");
if(tiles) tiles.insertAdjacentHTML("afterbegin", `<button type="button" data-open="trip"><i>${I('<rect x="4" y="7" width="16" height="13" rx="2"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M4 12h16"/>')}</i>My trip</button>`);
const homeCard = () => {
let c = $("#tripHome"); if(!c){ if(!tiles) return; tiles.insertAdjacentHTML("afterend", `<button type="button" class="glass trip-home" id="tripHome" data-open="trip"></button>`); c = $("#tripHome") }
if(!trip){ c.innerHTML = `<div><small>PLAN A NEW TRIP</small><b>Where to next?</b><span>Pick a place, dates and what you love. We build the days.</span></div><i class="go">→</i>`; return }
const l = left(trip);
c.innerHTML = `<div><small>${fmt(trip.start)} – ${fmt(trip.end)}</small><b>${esc(trip.dest.n)}</b><span>${l > 0 ? l + (l === 1 ? " day" : " days") + " to go" : l > -nDays(trip) ? "Trip in progress — enjoy!" : "Trip finished"}</span></div><i class="go">→</i>`;
};
homeCard();

// ===== 1. Plan a new trip (5 steps) =====
const LIKES = [["Top attractions", [["top","✨ Top attractions"],["gems","💎 Hidden gems"],["photo","📸 Photo spots"]]],
["History & heritage", [["temple","🛕 Temples"],["fort","🏰 Forts & palaces"],["museum","🏛️ Museums"],["heritage","🗿 Heritage sites"]]],
["Nature & outdoors", [["beach","🏖️ Beaches"],["water","💧 Waterfalls & lakes"],["hill","⛰️ Hills & viewpoints"],["wild","🐅 Wildlife"],["garden","🌳 Gardens & parks"]]]];
const MATCH = {temple: /temple|mandir|shrine|gurudwara|church|mosque|masjid|monastery|basilica/i, fort: /fort|palace|qila|mahal|haveli/i,
museum: /museum|gallery|memorial/i, heritage: /heritage|tomb|ruins|caves?|stepwell|monument|archaeolog|minar/i, beach: /beach|island|coast|bay/i,
water: /waterfall|falls|lake|dam/i, hill: /hill|peak|mountain|valley|point|pass\b|glacier/i, wild: /national park|sanctuary|wildlife|zoo|reserve|bird/i,
garden: /garden|park|forest/i};
const POPULAR = ["Goa","Manali","Jaipur","Udaipur","Munnar","Rishikesh","Varanasi","Leh","Darjeeling","Andaman","Ooty","Kutch"];
const MODES = [["bus","🚌 Bus"],["train","🚆 Train"],["car","🚗 Car"],["flight","✈️ Flight"],["bike","🏍️ Bike"]];
let w = null, step = 1;
const fresh = () => ({dest: null, q: "", start: addDays(today(), 7), end: addDays(today(), 9), people: 2, budget: 15000, from: "", mode: "train", likes: []});
const drawWiz = () => {
const el = $("#wzBody"); if(!el) return;
$("#wzBar").style.width = step * 20 + "%"; $("#wzStep").textContent = step + "/5";
$("#wzBack").style.visibility = step > 1 ? "visible" : "hidden";
$("#wzNext").textContent = step === 5 ? "Create my trip ✨" : "Next";
if(step === 1) el.innerHTML = `<h2 class="wz-q">Where do you want to go?</h2><p class="meta">Any city, hill station, beach or place in India.</p>
<form id="wzFind" class="row"><input id="wzQ" type="search" placeholder="e.g. Manali" value="${esc(w.q)}" style="flex:1" aria-label="Destination"><button class="sec" type="submit">Find</button></form>
<div id="wzDest">${w.dest ? `<div class="glass picked">📍 <b>${esc(w.dest.n)}</b></div>` : ""}</div>
<h3 class="wz-h">Popular right now</h3><div class="pills">${POPULAR.map(p => `<button type="button" class="pill" data-pop="${p}">${p}</button>`).join("")}</div>`;
if(step === 2) el.innerHTML = `<h2 class="wz-q">When are you going?</h2><p class="meta">Up to 10 days.</p>
<label>Start date<input id="wzS" type="date" value="${w.start}" min="${today()}"></label><label>End date<input id="wzE" type="date" value="${w.end}" min="${w.start}"></label>
<div class="glass picked">🗓️ ${nDays(w)} ${nDays(w) === 1 ? "day" : "days"} in ${esc(w.dest.n)}</div>`;
if(step === 3) el.innerHTML = `<h2 class="wz-q">Who's coming, and how?</h2>
<label>Travellers<input id="wzP" type="number" min="1" max="60" value="${w.people}" inputmode="numeric"></label>
<label>Total budget (₹)<input id="wzB" type="number" min="0" value="${w.budget}" inputmode="numeric"></label>
<label>Travelling from<input id="wzF" placeholder="e.g. Ahmedabad" value="${esc(w.from)}"></label>
<h3 class="wz-h">Getting there</h3><div class="pills">${MODES.map(m => `<button type="button" class="pill${w.mode === m[0] ? " on" : ""}" data-mode="${m[0]}">${m[1]}</button>`).join("")}</div>`;
if(step === 4) el.innerHTML = `<h2 class="wz-q">What excites you?</h2><p class="meta">Select at least one.</p>
<div class="dots">${[0,1,2,3,4].map(i => `<i class="${i < w.likes.length ? "on" : ""}"></i>`).join("")} <span>${w.likes.length} of 5 selected</span></div>
${LIKES.map(g => `<h3 class="wz-h">${g[0]}</h3><div class="pills">${g[1].map(l => `<button type="button" class="pill c-${l[0]}${w.likes.includes(l[0]) ? " on" : ""}" data-like="${l[0]}" aria-pressed="${w.likes.includes(l[0])}">${l[1]}</button>`).join("")}</div>`).join("")}`;
if(step === 5) el.innerHTML = `<h2 class="wz-q">Ready to go?</h2>
<div class="glass review"><div><small>Destination</small><b>${esc(w.dest.n)}</b></div><div><small>Dates</small><b>${fmt(w.start)} – ${fmt(w.end)} · ${nDays(w)} days</b></div>
<div><small>Travellers</small><b>${w.people}</b></div><div><small>Budget</small><b>${rs(w.budget)} · ${rs(w.budget / w.people)} each</b></div>
<div><small>Getting there</small><b>${(MODES.find(m => m[0] === w.mode) || [0, ""])[1]}${w.from ? " from " + esc(w.from) : ""}</b></div>
<div><small>You love</small><b>${w.likes.map(l => LIKES.flatMap(g => g[1]).find(x => x[0] === l)[1]).join(" · ")}</b></div></div>
<p class="meta">We'll find the best places near ${esc(w.dest.n)} and arrange them day by day, nearest first.</p>`;
};
const find = async q => {
q = (q || "").trim(); if(!q) return; w.q = q; $("#wzDest").innerHTML = `<div class="meta">Finding ${esc(q)}…</div>`;
try{ const g = await YS.geocode(q); if(!g) throw 0; w.dest = {n: g.name, lat: g.lat, lng: g.lng}; drawWiz() }
catch(e){ $("#wzDest").innerHTML = `<div class="meta">Couldn't find that place. Check the spelling or your internet.</div>` }
};
// pick places near the destination that match what the person likes, then arrange them day by day
const build = async t => {
let list = [];
try{ list = await YS.wikiNear(t.dest.lat, t.dest.lng, 10000) }catch(e){}
try{ (await YS.wikiSearch(t.dest.n)).list.forEach(p => { if(km(p, t.dest) < 60 && !list.some(x => x.id === p.id)) list.push(p) }) }catch(e){}
if(!list.length) PLACES.filter(p => km(p, t.dest) < 80).forEach(p => list.push(p));
const text = p => p.n + " " + (p.d || "") + " " + (p.type || "") + " " + (p.c || "");
const score = p => t.likes.reduce((s, l) => s + (MATCH[l] && MATCH[l].test(text(p)) ? 2 : 0), 0) + (p.img ? 1 : 0)
+ (t.likes.includes("gems") && km(p, t.dest) > 4 ? 1 : 0) + (t.likes.includes("top") && km(p, t.dest) < 6 ? 1 : 0);
const days = nDays(t);
const pick = list.sort((a, b) => score(b) - score(a)).slice(0, days * 3).map(p => (p.live ? YS.addPlace(p) : p) || p);
let cur = t.dest; const rest = [...pick], order = [];
while(rest.length){ rest.sort((a, b) => km(cur, a) - km(cur, b)); cur = rest.shift(); order.push(cur) }
const per = Math.min(3, Math.max(1, Math.ceil(order.length / days)));
t.days = Array.from({length: days}, (_, d) => order.slice(d * per, d * per + per).map((p, i) => ({id: p.id, t: ["09:00","12:00","16:00"][i]})));
return t;
};
const DEFPACK = ["ID card (Aadhaar)","Phone charger & power bank","Medicines & first aid","Water bottle","Comfortable shoes","Cash & UPI ready"];
const packFor = likes => DEFPACK.concat(likes.includes("beach") ? ["Sunscreen","Swimwear","Sunglasses"] : [], likes.includes("hill") ? ["Warm jacket","Rain cover"] : [],
likes.includes("temple") ? ["Clothes covering shoulders & knees"] : [], likes.includes("photo") ? ["Camera & spare battery"] : []).map(t => ({t, done: 0}));
page("newtrip", el => {
el.innerHTML = `<div class="wz-top"><div class="wz-track"><i id="wzBar"></i></div><span id="wzStep"></span></div><div id="wzBody"></div>
<div class="wz-nav"><button class="sec" type="button" id="wzBack">← Back</button><button class="pri" type="button" id="wzNext">Next</button></div>`;
el.addEventListener("submit", e => { if(e.target.id === "wzFind"){ e.preventDefault(); find($("#wzQ").value) } });
el.addEventListener("change", e => {
const v = e.target, id = v.id;
if(id === "wzS"){ w.start = v.value || w.start; if(w.end < w.start) w.end = w.start; drawWiz() }
if(id === "wzE"){ w.end = v.value < w.start ? w.start : v.value; if(nDays(w) > 10) w.end = addDays(w.start, 9); drawWiz() }
if(id === "wzP") w.people = Math.max(1, +v.value || 1); if(id === "wzB") w.budget = Math.max(0, +v.value || 0); if(id === "wzF") w.from = v.value.trim();
});
el.addEventListener("click", async e => {
const b = e.target.closest("button"); if(!b) return;
if(b.dataset.pop) find(b.dataset.pop);
if(b.dataset.mode){ w.mode = b.dataset.mode; drawWiz() }
if(b.dataset.like){ const l = b.dataset.like; if(w.likes.includes(l)) w.likes = w.likes.filter(x => x !== l); else if(w.likes.length < 5) w.likes.push(l); else toast("You can pick up to 5"); drawWiz() }
if(b.id === "wzBack" && step > 1){ step--; drawWiz() }
if(b.id === "wzNext"){
if(step === 1 && !w.dest) return toast("Choose where you want to go");
if(step === 3){ ["wzP","wzB","wzF"].forEach(i => $("#" + i).dispatchEvent(new Event("change", {bubbles: true}))) }
if(step === 4 && !w.likes.length) return toast("Select at least one");
if(step < 5){ step++; drawWiz(); window.scrollTo(0, 0); return }
b.disabled = true; b.textContent = "Building your trip…";
const t = await build({...w, made: Date.now()}); trip = t; save();
store.set("pack", packFor(t.likes));
const sp = store.get("split", {budget: 0, people: [], items: []}); sp.budget = t.budget; store.set("split", sp);
b.disabled = false; homeCard(); toast("Your trip is ready!"); YS.show("trip");
}
});
}, () => { w = fresh(); step = 1; drawWiz() });

// ===== 2. Trip dashboard (widget cards) =====
const WMO = c => c === 0 ? ["Clear sky","☀️"] : c < 3 ? ["Partly cloudy","⛅"] : c === 3 ? ["Cloudy","☁️"] : c < 50 ? ["Foggy","🌫️"] : c < 70 ? ["Rain","🌧️"] : c < 80 ? ["Snow","❄️"] : c < 90 ? ["Showers","🌦️"] : ["Thunderstorm","⛈️"];
const drawTrip = () => {
const el = $("#v-trip"); if(!el) return;
if(!trip){ el.innerHTML = `<div class="glass empty-trip"><div class="big">🧳</div><h2>No trip yet</h2><p class="meta">Tell us where, when and what you love — we'll plan the days, budget and packing.</p><button class="pri" type="button" data-open="newtrip">Plan a new trip</button></div>`; return }
const sp = store.get("split", {budget: 0, people: [], items: []}), pack = store.get("pack", []);
const spent = sp.items.reduce((s, x) => s + x.a, 0), bud = sp.budget || trip.budget || 0, pct = bud ? Math.min(100, Math.round(spent / bud * 100)) : 0;
const l = left(trip), total = Math.max(l, 1), ring = l > 0 ? Math.max(4, 100 - Math.min(100, l / 30 * 100)) : 100;
const mode = (MODES.find(m => m[0] === trip.mode) || ["", "🚆 Train"])[1].split(" ")[0];
el.innerHTML = `<div class="trip-head"><div><small>${fmt(trip.start)} – ${fmt(trip.end)} · ${trip.people} ${trip.people > 1 ? "travellers" : "traveller"}</small><h2>${esc(trip.dest.n)}</h2></div>
<button class="sec" type="button" data-open="newtrip">+ New trip</button></div>
<div class="wgrid">
<section class="wg w-white"><h3>◔ Budget</h3><div class="pill-sm">TOTAL ${rs(bud)}</div>
<div class="donut" style="--p:${pct}"><span>${pct}%<small>spent</small></span></div>
<div class="legend"><i class="a"></i>Spent ${rs(spent)} <i class="b"></i>Left ${rs(Math.max(0, bud - spent))}</div></section>
<section class="wg w-white"><h3>🧾 Expenses</h3>
${sp.items.slice(-4).reverse().map(x => `<div class="ex"><span>${esc(x.t || "Expense")}</span><b>${rs(x.a)}</b></div>`).join("") || `<p class="meta">Nothing spent yet.</p>`}
<button class="add" type="button" data-open="split">⊕ Record</button></section>
<section class="wg w-yellow"><h3>⏳ Readiness</h3><div class="ring" style="--p:${ring}"><span><small>${l > 0 ? "Days left" : l > -nDays(trip) ? "Day" : "Done"}</small>${l > 0 ? l : l > -nDays(trip) ? 1 - l : "✓"}</span></div>
<div class="meta c">${pack.filter(x => x.done).length}/${pack.length} packed</div></section>
<section class="wg w-lilac" id="wgWx"><h3>📍 ${esc(trip.dest.n)}</h3><div class="meta">Loading weather…</div></section>
<section class="wg w-plum"><h3>${mode} Journey</h3>
<div class="leg"><small>${fmt(trip.start)}</small><b>${esc(trip.from || "Home")} <i>→</i> ${esc(trip.dest.n)}</b></div>
<div class="leg"><small>${fmt(trip.end)}</small><b>${esc(trip.dest.n)} <i>→</i> ${esc(trip.from || "Home")}</b></div>
<button class="add" type="button" data-open="routes">Compare transport</button></section>
<section class="wg w-dark" id="wgPack"></section>
<section class="wg w-sand wide"><h3>🗺️ Days & activity <button class="mini" type="button" data-open="days">Open</button></h3>
${trip.days.map((d, i) => { const ps = d.map(s => byId(s.id)).filter(Boolean);
return `<button type="button" class="dayrow" data-day="${i}"><span class="dchip">Day ${i + 1}</span><span><b>${esc(ps[0] ? ps[0].n : "Free day")}</b>${ps.length > 1 ? `<small>${ps.slice(1).map(p => esc(p.n)).join(" · ")}</small>` : ""}</span></button>` }).join("")}</section>
</div>
<button class="sec danger" type="button" id="tripDel">Delete this trip</button>`;
drawPack();
$("#tripDel").onclick = () => { if(confirm("Delete this trip? Your expenses stay saved.")){ trip = null; save(); homeCard(); drawTrip() } };
fetch(`https://api.open-meteo.com/v1/forecast?latitude=${trip.dest.lat}&longitude=${trip.dest.lng}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1`)
.then(r => r.json()).then(j => { const b = $("#wgWx"); if(!b) return; const [t, e] = WMO(j.current.weather_code);
b.innerHTML = `<h3>📍 ${esc(trip.dest.n)}</h3><div class="wx"><div><small>Temperature</small>H ${Math.round(j.daily.temperature_2m_max[0])}° · L ${Math.round(j.daily.temperature_2m_min[0])}°<small>Weather</small>${e} ${t}</div><b>${Math.round(j.current.temperature_2m)}°</b></div>` })
.catch(() => { const b = $("#wgWx"); if(b) b.querySelector(".meta").textContent = "Weather needs the internet." });
};
const drawPack = () => {
const box = $("#wgPack"); if(!box) return; const pack = store.get("pack", []);
box.innerHTML = `<h3>📋 Packing list</h3>${pack.map((x, i) => `<label class="pk${x.done ? " done" : ""}"><input type="checkbox" data-pk="${i}"${x.done ? " checked" : ""}><span>${esc(x.t)}</span><b data-pkdel="${i}" role="button" aria-label="Remove">✕</b></label>`).join("")}
<form id="pkAdd" class="row"><input id="pkNew" placeholder="Add an item" aria-label="New packing item" style="flex:1"><button class="add" type="submit">⊕</button></form>`;
};
page("trip", el => {
el.addEventListener("change", e => { const i = e.target.dataset.pk; if(i == null) return; const p = store.get("pack", []); p[i].done = e.target.checked ? 1 : 0; store.set("pack", p); drawTrip() });
el.addEventListener("submit", e => { if(e.target.id !== "pkAdd") return; e.preventDefault(); const t = $("#pkNew").value.trim(); if(!t) return; const p = store.get("pack", []); p.push({t, done: 0}); store.set("pack", p); drawPack() });
el.addEventListener("click", e => {
const d = e.target.closest("[data-pkdel]"); if(d){ e.preventDefault(); const p = store.get("pack", []); p.splice(+d.dataset.pkdel, 1); store.set("pack", p); drawPack(); return }
const r = e.target.closest("[data-day]"); if(r){ curDay = +r.dataset.day; YS.show("days") }
});
}, drawTrip);

// ===== 3. Day-by-day timeline =====
let curDay = 0;
const leg = (a, b) => { const k = km(a, b) * 1.3; return k < 1.5 ? `🚶 ${Math.max(2, Math.round(k / 5 * 60))} min walk · ${k.toFixed(1)} km` : `🚗 ${Math.round(k / 30 * 60)} min drive · ${Math.round(k)} km` };
const drawDays = () => {
const el = $("#v-days"); if(!el) return;
if(!trip){ el.innerHTML = `<div class="glass empty-trip"><h2>No trip yet</h2><button class="pri" type="button" data-open="newtrip">Plan a new trip</button></div>`; return }
curDay = Math.min(curDay, trip.days.length - 1);
const day = trip.days[curDay], ps = day.map(s => ({...s, p: byId(s.id)})).filter(s => s.p);
el.innerHTML = `<div class="trip-head"><div><small>${fmt(trip.start)} – ${fmt(trip.end)}</small><h2>${esc(trip.dest.n)}</h2></div></div>
<div class="dtabs">${trip.days.map((_, i) => `<button type="button" data-dt="${i}" class="${i === curDay ? "on" : ""}"><small>DAY</small>${String(i + 1).padStart(2, "0")}</button>`).join("")}</div>
<small class="over">DAY ${String(curDay + 1).padStart(2, "0")} · ${fmt(addDays(trip.start, curDay)).toUpperCase()}</small>
<h2 class="dtitle">${esc(ps[0] ? ps[0].p.n : "A free day")}${ps.length > 1 ? " & more" : ""}</h2>
<div class="tline">${ps.map((s, i) => `<div class="tstop${i === 0 ? " now" : ""}"><div class="ttime"><i></i>${s.t}</div>
<button type="button" class="tcard glass" data-go="${esc(s.id)}"><span><b>${esc(s.p.n)}</b><small>${esc((s.p.d || s.p.c || "").slice(0, 90))}</small></span><span class="tph pc-img" data-photo="${esc(s.id)}"><b>${esc(s.p.n[0])}</b></span></button>
<div class="tleg">${ps[i + 1] ? leg(s.p, ps[i + 1].p) : ""}<button class="mini" type="button" data-rm="${i}">Remove</button></div></div>`).join("") || `<div class="glass">🍛 Free day — try local markets, street food and a slow evening walk. Or add a place below.</div>`}</div>
<div class="row"><select id="dAdd" style="flex:1" aria-label="Add a stop"><option value="">+ Add a stop to this day…</option>${(PLACES.some(p => km(p, trip.dest) < 80) ? PLACES.filter(p => km(p, trip.dest) < 80) : PLACES).map(p => `<option value="${esc(p.id)}">${esc(p.n)}</option>`).join("")}</select></div>
<button class="pri" type="button" id="dShare">Share this plan</button>`;
YS.paintPhotos(el);
};
page("days", el => {
el.addEventListener("click", e => {
const t = e.target.closest("[data-dt]"); if(t){ curDay = +t.dataset.dt; drawDays(); return }
const r = e.target.closest("[data-rm]"); if(r){ trip.days[curDay].splice(+r.dataset.rm, 1); save(); drawDays(); return }
const g = e.target.closest("[data-go]"); if(g){ const p = byId(g.dataset.go); if(p) p.live ? YS.openLive(p) : openPlace(p.id); return }
if(e.target.id === "dShare"){ const txt = `My ${trip.dest.n} trip (Yatra Saathi)\n` + trip.days.map((d, i) => `\nDay ${i + 1}\n` + d.map(s => { const p = byId(s.id); return p ? `${s.t} ${p.n}` : "" }).join("\n")).join("\n");
if(navigator.share) navigator.share({text: txt}).catch(() => {}); else window.open("https://wa.me/?text=" + encodeURIComponent(txt), "_blank", "noopener") }
});
el.addEventListener("change", e => { if(e.target.id !== "dAdd" || !e.target.value) return; const d = trip.days[curDay];
const times = ["09:00","12:00","16:00","18:30","20:00"]; d.push({id: e.target.value, t: times[Math.min(d.length, 4)]}); save(); drawDays() });
}, drawDays);
})();
