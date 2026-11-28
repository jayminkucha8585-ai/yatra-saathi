// ---------- Together: live location sharing, traveler tips, creator profiles (Firebase) ----------
(() => {
const {$, esc, store, toast} = YS;
const I = p => `<svg viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`;
const VIEWS = [["live","Share live location","Live location",'<circle cx="12" cy="12" r="3"/><path d="M5 12a7 7 0 0 1 14 0M2 12a10 10 0 0 1 20 0"/>'],
["tips","Traveler tips","Tips",'<path d="M4 5h16v11H9l-5 4z"/><path d="M8 9h8M8 12h5"/>'],
["creators","Creators","Creators",'<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/><path d="M18 3l1 2 2 .3-1.5 1.4.4 2.3-1.9-1-1.9 1 .4-2.3L15 5.3l2-.3z"/>']];
const main = $("main");
VIEWS.forEach(v => { main.insertAdjacentHTML("beforeend", `<section class="view" id="v-${v[0]}"></section>`); TITLES[v[0]] = v[1] });
const tiles = $("#v-home .tiles");
if(tiles) tiles.insertAdjacentHTML("beforeend", VIEWS.map(v => `<button type="button" data-open="${v[0]}"><i>${I(v[3])}</i>${v[2]}</button>`).join(""));
const db = () => window.CL && CL.db && CL.db(), uid = () => window.CL && CL.uid && CL.uid();
const myName = () => store.get("profile", {}).name || (window.firebase && firebase.auth().currentUser && firebase.auth().currentUser.displayName) || "Traveler";
const now = () => firebase.firestore.FieldValue.serverTimestamp();
const ago = ms => { const m = Math.round((Date.now() - ms) / 60000); return m < 1 ? "just now" : m < 60 ? m + " min ago" : Math.round(m / 60) + " h ago" };
const noDb = `<div class="empty">This needs the internet and a signed-in account.</div>`;
const once = {};
const page = (id, build, refresh) => { YS.renderers[id] = () => { if(!once[id]){ once[id] = 1; build($("#v-" + id)) } refresh && refresh() } };

// ===== 1. Live location sharing =====
let liveId = store.get("liveId", null), liveTimer = null;
const push = async () => { const m = YS.me(); if(!liveId || !db()) return;
try{ await db().collection("live").doc(liveId).set({uid: uid(), name: myName(), lat: m.lat, lng: m.lng, t: Date.now(), until: store.get("liveUntil", 0)}) }catch(e){} };
const liveLink = () => location.origin + location.pathname + "?live=" + liveId;
const stopLive = async () => { clearInterval(liveTimer); liveTimer = null; const id = liveId; liveId = null; store.set("liveId", null);
if(id && db()) try{ await db().collection("live").doc(id).delete() }catch(e){} drawLive() };
const tick = () => { if(store.get("liveUntil", 0) < Date.now()) return stopLive(); push() };
const startLive = async hours => {
if(!uid()) return toast("Please sign in first");
liveId = liveId || (Date.now().toString(36) + Math.random().toString(36).slice(2, 10));
store.set("liveId", liveId); store.set("liveUntil", Date.now() + hours * 36e5);
await push(); clearInterval(liveTimer); liveTimer = setInterval(tick, 30000); drawLive();
};
const drawLive = () => {
const box = $("#lvBox"); if(!box) return;
box.innerHTML = liveId ? `<div class="card"><h3>🟢 Sharing your live location</h3><div class="meta">Until ${new Date(store.get("liveUntil", 0)).toLocaleTimeString("en-IN", {hour: "numeric", minute: "2-digit"})}. Updates every 30 seconds while the app is open.</div>
<div class="row"><button class="pri" type="button" id="lvSend">Send link</button><button class="sec" type="button" id="lvStop">Stop sharing</button></div></div>`
: `<p>Let family or friends follow your trip on a map. They only need the link, not the app.</p>
<div class="row"><button class="pri" type="button" data-lvh="1">1 hour</button><button class="pri" type="button" data-lvh="8">8 hours</button><button class="pri" type="button" data-lvh="24">24 hours</button></div>`;
if($("#lvSend")) $("#lvSend").onclick = async () => { const t = `Follow my trip live on Yatra Saathi: ${liveLink()}`;
try{ if(navigator.share) return await navigator.share({text: t}) }catch(e){ return } window.open("https://wa.me/?text=" + encodeURIComponent(t), "_blank", "noopener") };
if($("#lvStop")) $("#lvStop").onclick = stopLive;
};
page("live", el => {
el.innerHTML = `<div id="lvBox"></div><p class="note">Only people with your link can see your location. Sharing stops by itself at the time you chose, or when you tap Stop. Keep the app open for updates.</p>`;
el.onclick = e => { const b = e.target.closest("[data-lvh]"); if(b) startLive(+b.dataset.lvh) };
}, drawLive);
if(liveId){ if(store.get("liveUntil", 0) > Date.now()) liveTimer = setInterval(tick, 30000); else stopLive() }

// viewer: someone opened a ?live= link (works without signing in)
const watchId = new URLSearchParams(location.search).get("live");
if(watchId && /^[a-z0-9]{6,30}$/.test(watchId)){
const a = $("#auth"); if(a){ a.classList.remove("on"); new MutationObserver(() => a.classList.contains("on") && a.classList.remove("on")).observe(a, {attributes: true, attributeFilter: ["class"]}) }
main.insertAdjacentHTML("beforeend", `<section class="view" id="v-watch"><div class="card" id="wInfo">Loading location…</div><div id="wMap" style="height:60vh;border-radius:16px"></div></section>`);
TITLES.watch = "Live location";
setTimeout(() => {
YS.show("watch"); const m = L.map("wMap").setView([22.5, 78.9], 5);
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {maxZoom: 19, attribution: "&copy; OpenStreetMap"}).addTo(m);
let mk = null;
const go = () => { const d = db(); if(!d) return setTimeout(go, 800);
d.collection("live").doc(watchId).onSnapshot(s => {
if(!s.exists || (s.data().until || 0) < Date.now()){ $("#wInfo").innerHTML = "This person has stopped sharing their location."; return }
const x = s.data(); $("#wInfo").innerHTML = `<h3>${esc(x.name || "Traveler")}</h3><div class="meta">Updated ${ago(x.t)}</div>
<a class="btn sec" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination=${x.lat},${x.lng}">Directions in Google Maps</a>`;
mk ? mk.setLatLng([x.lat, x.lng]) : (mk = L.marker([x.lat, x.lng]).addTo(m)); m.setView([x.lat, x.lng], Math.max(m.getZoom(), 14));
}, () => { $("#wInfo").innerHTML = "Couldn't load this location. The link may be old, or sharing has stopped." }) };
go();
}, 300);
}

// ===== 2. Traveler tips for each place =====
let tipPlace = null;
const loadTips = async () => {
const box = $("#tpList"); if(!box) return; const p = PLACES.find(x => x.id === tipPlace);
$("#tpFor").textContent = p ? "Tips for " + p.n : "Pick a place";
if(!p){ box.innerHTML = ""; return }
if(!db()){ box.innerHTML = noDb; return }
box.innerHTML = `<div class="empty">Loading tips…</div>`;
try{ const s = await db().collection("tips").where("place", "==", p.id).limit(50).get();
const list = s.docs.map(d => ({id: d.id, ...d.data()})).sort((a, b) => (b.t || 0) - (a.t || 0));
box.innerHTML = list.length ? list.map(x => `<div class="card"><p style="margin:0 0 4px">${esc(x.text)}</p><div class="meta">${esc(x.name || "Traveler")} · ${x.t ? ago(x.t) : ""}</div>
${x.uid === uid() ? `<button class="sec" type="button" data-tpdel="${esc(x.id)}">Delete</button>` : ""}</div>`).join("") : `<div class="empty">No tips yet. Share the first one!</div>`;
}catch(e){ box.innerHTML = `<div class="empty">Couldn't load tips. Check your internet.</div>` }
};
page("tips", el => {
el.innerHTML = `<select id="tpAt" aria-label="Place"></select><h2 id="tpFor"></h2>
<form id="tpForm"><textarea id="tpText" maxlength="300" placeholder="Share a useful tip: road condition, best time, where to eat, what to carry…" style="min-height:80px" aria-label="Your tip"></textarea>
<div class="row"><button class="pri" type="submit">Post tip</button></div></form><div id="tpList"></div>
<p class="note">Tips are public and show your name. Please be kind and do not share phone numbers or personal details.</p>`;
$("#tpAt").onchange = e => { tipPlace = e.target.value; loadTips() };
$("#tpForm").onsubmit = async e => { e.preventDefault(); const text = $("#tpText").value.trim();
if(text.length < 5) return toast("Write a little more"); if(!uid() || !db()) return toast("Please sign in first");
const p = PLACES.find(x => x.id === tipPlace); if(!p) return;
try{ await db().collection("tips").add({place: p.id, pname: p.n, text, uid: uid(), name: myName(), t: Date.now(), created: now()}); $("#tpText").value = ""; toast("Thanks for the tip!"); loadTips() }
catch(err){ toast("Couldn't post. Check your internet.") } };
el.addEventListener("click", async e => { const b = e.target.closest("[data-tpdel]"); if(!b) return;
try{ await db().collection("tips").doc(b.dataset.tpdel).delete(); loadTips() }catch(err){ toast("Couldn't delete") } });
}, () => { const s = $("#tpAt"); s.innerHTML = YS.placeOptions(); tipPlace = (YS.selected && YS.selected()) || tipPlace || PLACES[0].id; s.value = tipPlace; loadTips() });
document.addEventListener("click", e => { const b = e.target.closest("[data-tipsfor]"); if(b){ tipPlace = b.dataset.tipsfor; if(YS.selected && typeof selectPlace === "function") selectPlace(tipPlace); YS.show("tips") } });
// "Tips" button on every place page
const op = window.openPlace, ol = YS.openLive;
const addTip = () => { const row = $("#sBody .row"), id = YS.selected && YS.selected(); if(row && id && !row.querySelector("[data-tipsfor]")) row.insertAdjacentHTML("beforeend", `<button class="sec" type="button" data-tipsfor="${esc(id)}">Traveler tips</button>`) };
window.openPlace = id => { op(id); addTip() };
YS.openLive = raw => { ol(raw); addTip() };

// ===== 3. Creator profiles =====
let follows = store.get("follows", []), posts = [];
const loadCreators = async () => {
const box = $("#crList"); if(!box) return;
if(!db()){ box.innerHTML = noDb; return }
box.innerHTML = `<div class="empty">Loading creators…</div>`;
try{ const s = await db().collection("posts").orderBy("created", "desc").limit(100).get();
posts = s.docs.map(d => d.data()).filter(x => x.uid);
const by = {}; posts.forEach(x => { (by[x.uid] = by[x.uid] || {uid: x.uid, name: x.name || "Traveler", n: 0, img: ""}).n++; if(!by[x.uid].img && CL.safeImg(x.img)) by[x.uid].img = x.img });
const list = Object.values(by).sort((a, b) => follows.includes(b.uid) - follows.includes(a.uid) || b.n - a.n);
box.innerHTML = list.length ? list.map(c => `<button class="pc place" type="button" data-crp="${esc(c.uid)}" style="width:100%;text-align:left">
<span class="pc-img${c.img ? " has" : ""}"${c.img ? ` style="background-image:url('${c.img}')"` : ""}><b>${esc(c.name[0] || "T")}</b></span>
<span class="pc-txt"><h3>${esc(c.name)}${follows.includes(c.uid) ? " ⭐" : ""}</h3><span class="meta">${c.n} post${c.n > 1 ? "s" : ""}</span></span></button>`).join("")
: `<div class="empty">No creators yet. Share a photo in the Creator studio to be the first!</div>`;
}catch(e){ box.innerHTML = `<div class="empty">Couldn't load creators. Check your internet.</div>` }
};
const profile = id => {
const mine = posts.filter(x => x.uid === id), name = (mine[0] && mine[0].name) || "Traveler", f = follows.includes(id);
$("#sBody").innerHTML = `<h2 style="margin-top:0">${esc(name)}</h2><div class="meta">${mine.length} recent post${mine.length > 1 ? "s" : ""}</div>
<div class="row"><button class="${f ? "sec" : "pri"}" type="button" data-follow="${esc(id)}">${f ? "Following ✓" : "Follow"}</button><button class="sec" type="button" data-go="close">Close</button></div>
<div class="psgrid">${mine.map(x => { const img = CL.safeImg(x.img), pl = PLACES.find(p => p.id === x.place);
return `<div class="card" style="padding:0;overflow:hidden">${img ? `<img src="${img}" alt="${esc(x.cap || "Photo")}" style="width:100%;display:block" loading="lazy">` : ""}
<div style="padding:8px"><div class="meta">${esc(pl ? pl.n : "")}</div>${x.cap ? `<div>${esc(x.cap)}</div>` : ""}</div></div>` }).join("")}</div>`;
$("#sheet").classList.add("on");
};
page("creators", el => {
el.innerHTML = `<p class="meta">Travel creators sharing photos from across India. Follow your favourites to see them first.</p>
<div class="row"><button class="pri" type="button" data-open="creator">Share my photos</button></div><div id="crList"></div>`;
el.onclick = e => { const b = e.target.closest("[data-crp]"); if(b) profile(b.dataset.crp) };
}, loadCreators);
document.addEventListener("click", e => { const b = e.target.closest("[data-follow]"); if(!b) return; const id = b.dataset.follow;
follows = follows.includes(id) ? follows.filter(x => x !== id) : [...follows, id]; store.set("follows", follows);
b.textContent = follows.includes(id) ? "Following ✓" : "Follow"; b.className = follows.includes(id) ? "sec" : "pri"; loadCreators() });

// Delete account also deletes this person's tips and live location
const clean = async id => { const d = db(); if(!d) return;
for(const c of ["tips", "live"]){ try{ const s = await d.collection(c).where("uid", "==", id).get(); await Promise.all(s.docs.map(x => x.ref.delete().catch(() => {}))) }catch(e){} } };
if(window.firebase && firebase.auth) try{ firebase.auth().onAuthStateChanged(u => { if(u && typeof u.delete === "function" && !u.__ysw){ const del = u.delete.bind(u); u.delete = async () => { await clean(u.uid); return del() }; u.__ysw = 1 } }) }catch(e){}
})();
