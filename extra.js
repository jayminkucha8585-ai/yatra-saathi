// ---------- Travel passport (stamps + badges), audio guide, crowd estimate ----------
(() => {
const {$, esc, store, km, toast} = YS;
const I = p => `<svg viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`;
$("main").insertAdjacentHTML("beforeend", `<section class="view" id="v-passport"></section>`);
TITLES.passport = "My travel passport";
const tiles = $("#v-home .tiles");
if(tiles){ const first = tiles.querySelector("button"); (first || tiles).insertAdjacentHTML(first ? "afterend" : "beforeend", `<button type="button" data-open="passport"><i>${I('<rect x="5" y="3" width="14" height="18" rx="2"/><circle cx="12" cy="10" r="3.5"/><path d="M8.5 10h7M12 6.5c1.2 1 1.2 6 0 7M9 17h6"/>')}</i>Passport</button>`) }
const byId = id => PLACES.find(p => p.id === id);
const state = p => (YS.stateOf ? YS.stateOf(p) : "Gujarat");
const kindOf = p => { const s = `${p.n} ${p.d || ""} ${p.type || ""} ${p.c || ""}`;
return /beach|island|coast/i.test(s) ? "beach" : /temple|mandir|shrine|gurudwara|church|mosque|masjid|monastery|basilica|pilgrim/i.test(s) ? "temple"
: /national park|sanctuary|wildlife|zoo|reserve|bird/i.test(s) ? "wild" : /hill|peak|mountain|valley|waterfall|falls|lake|nature|forest/i.test(s) ? "hill"
: /desert|rann|dune/i.test(s) ? "desert" : "heritage" };
const EMO = {beach: "🌊", temple: "🛕", wild: "🐅", hill: "⛰️", desert: "🏜️", heritage: "🏰"};

// ===== 1. Passport =====
let visited = store.get("visited", []);
const isVisited = id => visited.some(v => v.id === id);
const stamp = (p, auto) => {
if(!p || isVisited(p.id)) return false;
visited.push({id: p.id, n: p.n, k: kindOf(p), st: state(p), lat: p.lat, lng: p.lng, t: Date.now()}); store.set("visited", visited);
toast((auto ? "📍 You're at " + p.n + "! " : "") + "Stamp collected " + EMO[kindOf(p)]); drawPassport(); return true;
};
const unstamp = id => { visited = visited.filter(v => v.id !== id); store.set("visited", visited); drawPassport() };
// collect a stamp automatically when your real GPS location is within 1.5 km of a place
setInterval(() => { const m = YS.me(); if(!m || !m.live) return; const p = PLACES.find(x => !isVisited(x.id) && km(m, x) < 1.5); if(p) stamp(p, true) }, 60000);
const BADGES = [["beach","🏖️","Beach Lover",3],["temple","🛕","Pilgrim",5],["heritage","🏰","History Buff",5],["hill","⛰️","Mountain Soul",3],["wild","🐅","Safari Pro",3],["desert","🏜️","Desert Rider",2]];
const drawPassport = () => {
const el = $("#v-passport"); if(!el || !el.classList.contains("on") && !el.innerHTML) return;
const states = [...new Set(visited.map(v => v.st).filter(s => s && s !== "India"))];
const sorted = [...visited].sort((a, b) => a.t - b.t); let dist = 0; for(let i = 1; i < sorted.length; i++) dist += km(sorted[i - 1], sorted[i]) * 1.3;
const cnt = k => visited.filter(v => v.k === k).length;
const name = (store.get("profile", {}).name || "My").split(" ")[0];
el.innerHTML = `<small class="over">MY TRAVEL PASSPORT</small><h2 class="dtitle">${esc(name === "My" ? "My" : name + "'s")} India</h2>
<div class="card pp-top"><div class="row" style="justify-content:space-between;align-items:center"><div><b class="pp-big">${states.length} / 36</b><div class="meta">States & UTs explored</div></div><span style="font-size:40px">🇮🇳</span></div>
<div class="pp-bar"><i style="width:${Math.max(2, states.length / 36 * 100)}%"></i></div>
<div class="pp-stats"><div><b>${visited.length}</b><span>places</span></div><div><b>${Math.round(dist).toLocaleString("en-IN")}</b><span>km</span></div><div><b>${states.length}</b><span>states</span></div></div></div>
<h3 class="wz-h">STAMPS COLLECTED</h3>
<div class="card pp-stamps">${sorted.map((v, i) => `<button type="button" class="pp-stamp" data-ppgo="${esc(v.id)}" style="--r:${(i * 37) % 17 - 8}deg"><span>${EMO[v.k] || "📍"}</span><b>${esc(v.n.length > 14 ? v.n.slice(0, 13) + "…" : v.n)}</b><small>${new Date(v.t).toLocaleDateString("en-IN", {day: "numeric", month: "short", year: "2-digit"})}</small></button>`).join("")}
${Array.from({length: Math.max(2, 4 - visited.length % 4)}, () => `<div class="pp-stamp empty"><span>?</span></div>`).join("")}</div>
<p class="note">Stamps are collected automatically when you reach a place (keep location on), or tap "I've been here" on any place page.</p>
<h3 class="wz-h">BADGES</h3>
<div class="pp-badges">${BADGES.map(b => { const n = cnt(b[0]), ok = n >= b[3];
return `<div class="card pp-badge${ok ? "" : " locked"}"><span>${b[1]}</span><b>${b[2]}</b><small>${ok ? "Unlocked ✓" : `${n} / ${b[3]}`}</small></div>` }).join("")}
<div class="card pp-badge${states.length >= 3 ? "" : " locked"}"><span>🧭</span><b>Explorer</b><small>${states.length >= 3 ? "Unlocked ✓" : `${states.length} / 3 states`}</small></div></div>
<div class="row"><button class="pri" type="button" id="ppShare">Share my passport</button></div>`;
$("#ppShare").onclick = () => { const t = `My Yatra Saathi passport 🇮🇳\n${visited.length} places · ${states.length} states · ${Math.round(dist)} km\n${sorted.map(v => (EMO[v.k] || "📍") + " " + v.n).join("\n")}`;
if(navigator.share) navigator.share({text: t}).catch(() => {}); else window.open("https://wa.me/?text=" + encodeURIComponent(t), "_blank", "noopener") };
};
YS.renderers.passport = drawPassport;
$("#v-passport").addEventListener("click", e => { const b = e.target.closest("[data-ppgo]"); if(!b) return; const p = byId(b.dataset.ppgo); if(p) p.live ? YS.openLive(p) : openPlace(p.id) });

// ===== 2. Crowd estimate (by place type, hour and weekday — not live data) =====
const SHAPE = {temple: [5,8,7,5,4,3,3,3,4,6,8,9,7,4,2,1], heritage: [1,2,3,5,7,8,9,9,8,7,5,3,2,1,1,1], beach: [2,2,2,3,3,3,3,4,5,7,9,9,7,5,3,2],
wild: [7,8,7,4,2,1,1,1,2,5,7,6,2,1,1,1], hill: [3,4,5,6,7,8,8,8,7,6,6,5,3,2,1,1], desert: [3,4,4,4,3,2,2,2,3,6,9,9,8,6,4,2]};
const crowd = (p, d = new Date()) => { const wk = [0, 6].includes(d.getDay()) ? 1.25 : 1, s = SHAPE[kindOf(p)] || SHAPE.heritage; return s.map(v => Math.min(10, v * wk)) }; // 6am..9pm
const lvl = v => v >= 7 ? ["High", "#B8643A"] : v >= 4 ? ["Medium", "#B7862B"] : ["Low", "#0F5E63"];
const hh = h => (h % 12 || 12) + (h < 12 ? " am" : " pm");
const quiet = arr => { let best = 0; for(let i = 1; i < arr.length - 2; i++) if(arr[i] + arr[i + 1] < arr[best] + arr[best + 1]) best = i; return `${hh(best + 6)}–${hh(best + 8)}` };

// ===== 3. Audio guide (phone's own voice reads the place story) =====
const LANGS = [["en", "English", "en-IN"], ["gu", "ગુજરાતી", "gu-IN"], ["hi", "हिन्दी", "hi-IN"], ["mr", "मराठी", "mr-IN"], ["ta", "தமிழ்", "ta-IN"], ["te", "తెలుగు", "te-IN"], ["bn", "বাংলা", "bn-IN"], ["kn", "ಕನ್ನಡ", "kn-IN"], ["ml", "മലയാളം", "ml-IN"]];
let speaking = false;
const stopTalk = () => { try{ speechSynthesis.cancel() }catch(e){} speaking = false; const b = $("#agPlay"); if(b) b.textContent = "▶" };
const talk = async p => {
if(!("speechSynthesis" in window)) return toast("Your phone doesn't support reading aloud");
if(speaking) return stopTalk();
const b = $("#agPlay"), l = LANGS.find(x => x[0] === ($("#agLang") || {}).value) || LANGS[0]; b.textContent = "…";
let text = ""; try{ text = await YS.wikiText(p.wiki || p.n) }catch(e){}
text = (text || p.d || p.n).slice(0, 1400);
if(l[0] !== "en"){ try{ text = await YS.tr(text, l[0]) }catch(e){ toast("Couldn't translate. Reading in English."); } }
const parts = text.match(/[^.!?।]+[.!?।]?/g) || [text], voices = speechSynthesis.getVoices(), v = voices.find(x => x.lang && x.lang.toLowerCase().startsWith(l[0]));
if(l[0] !== "en" && !v && voices.length) toast("Your phone may not have a " + l[1] + " voice. Install it in Settings › Text-to-speech.");
speechSynthesis.cancel(); speaking = true; b.textContent = "■";
parts.forEach((s, i) => { const u = new SpeechSynthesisUtterance(s.trim()); u.lang = l[2]; if(v) u.voice = v; u.rate = .95; if(i === parts.length - 1) u.onend = stopTalk; speechSynthesis.speak(u) });
};

// ===== place page additions =====
const addCards = () => {
const body = $("#sBody"), id = YS.selected && YS.selected(), p = id && byId(id); if(!body || !p || body.querySelector(".xcards")) return;
const arr = crowd(p), h = new Date().getHours(), nowV = h >= 6 && h <= 21 ? arr[h - 6] : 0, [nl, nc] = h >= 6 && h <= 21 ? lvl(nowV) : ["Closed / quiet", "#667085"], d = YS.dist ? YS.dist(p) : Math.round(km(YS.me(), p));
body.insertAdjacentHTML("beforeend", `<div class="xcards">
<div class="xstats"><div class="card"><small>CROWD NOW</small><b style="color:${nc}">${nl}</b></div><div class="card"><small>QUIETEST</small><b>${quiet(arr)}</b></div><div class="card"><small>DISTANCE</small><b>${d.toLocaleString("en-IN")} km</b></div></div>
<div class="card"><small class="over">CROWD ESTIMATE · ${new Date().toLocaleDateString("en-IN", {weekday: "long"}).toUpperCase()}</small>
<div class="cbars">${arr.map((v, i) => `<i style="height:${v * 10}%;background:${lvl(v)[1]};opacity:${i + 6 === h ? 1 : .55}" title="${hh(i + 6)}"></i>`).join("")}</div>
<div class="cax"><span>6 am</span><span>12 pm</span><span>6 pm</span><span>9 pm</span></div>
<p class="note" style="margin:6px 0 0">An estimate from the type of place, time and day — not live data. Weekends and festivals are busier.</p></div>
<div class="card agcard"><i class="agic">${I('<path d="M11 5 6 9H2v6h4l5 4zM15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/>')}</i>
<div style="flex:1;min-width:0"><b>Audio guide</b><div class="meta">Listen to the story of this place</div>
<select id="agLang" aria-label="Language">${LANGS.map(l => `<option value="${l[0]}">${l[1]}</option>`).join("")}</select></div>
<button type="button" id="agPlay" class="agplay" aria-label="Play audio guide">▶</button></div>
<button type="button" class="${isVisited(p.id) ? "sec" : "pri"} wide" id="ppHere">${isVisited(p.id) ? "✓ In your passport — tap to remove" : "📍 I've been here — collect stamp"}</button></div>`);
const lang = store.get("lang", "en"); if(LANGS.some(l => l[0] === lang)) $("#agLang").value = lang;
$("#agPlay").onclick = () => talk(p);
$("#ppHere").onclick = e => { if(isVisited(p.id)){ unstamp(p.id); e.target.className = "pri wide"; e.target.textContent = "📍 I've been here — collect stamp" } else { stamp(p); e.target.className = "sec wide"; e.target.textContent = "✓ In your passport — tap to remove" } };
};
const op = window.openPlace; window.openPlace = id => { stopTalk(); op(id); addCards() };
const ol = YS.openLive; YS.openLive = raw => { stopTalk(); ol(raw); addCards() };
document.addEventListener("click", e => { if(e.target.closest('[data-go="close"]')) stopTalk() });
})();
