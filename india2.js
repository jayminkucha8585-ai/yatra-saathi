// ---------- Maps: photo points for everyone, best shoot spots + viewpoints for creators ----------
(() => {
const {$, esc, toast, store} = YS;
const picIcon = (img, cls) => L.divIcon({className:"", iconSize:[44,44], iconAnchor:[22,22], html:`<div class="${cls}" style="background-image:url('${esc(img)}')"></div>`});
const pop = s => `${s.img ? `<img src="${esc(s.img)}" alt="" style="width:200px;max-width:100%;border-radius:8px;display:block">` : ""}<b>${esc(s.name)}</b>
${s.by ? `<br><small>Photo: ${esc(s.by)}${s.lic ? " · " + esc(s.lic) : ""}</small>` : ""}
<br><button type="button" class="pri" data-goto="${s.lat},${s.lng}" data-name="${esc(s.name)}" style="margin-top:6px;min-height:36px;padding:0 12px">Directions in the app</button>`;
document.addEventListener("click", e => {
const b = e.target.closest("[data-goto]"); if(!b) return;
const [lat, lng] = b.dataset.goto.split(",").map(Number);
YS.nav ? YS.nav(lat, lng, b.dataset.name) : toast("Directions not available");
});
const jump = async (q, m) => {
q = q.trim(); if(!q) return;
try{ const g = await YS.geocode(q); if(!g) return toast("Place not found in India"); m.fire("dragstart"); m.setView([g.lat, g.lng], 13) }
catch(e){ toast("Couldn't search. Check your internet.") }
};

// ---- main map: picture points of places all over India ----
const map = YS.map, pics = L.layerGroup(), got = new Set(), shown = new Set();
let on = store.get("picPts", true), t;
if(on) pics.addTo(map);
const loadPics = () => {
clearTimeout(t); t = setTimeout(async () => {
if(!on || map.getZoom() < 10 || !$("#v-map").classList.contains("on")) return;
const c = map.getCenter(), k = c.lat.toFixed(1) + "," + c.lng.toFixed(1); if(got.has(k)) return; got.add(k);
if(shown.size > 400){ pics.clearLayers(); shown.clear() }
try{ (await YS.wikiNear(c.lat, c.lng, 10000)).forEach(p => {
if(!p.img || shown.has(p.id)) return; shown.add(p.id);
L.marker([p.lat, p.lng], {icon: picIcon(p.img, "picpt"), title: p.n}).on("click", () => YS.openLive(p)).addTo(pics) }) }
catch(e){ got.delete(k) }
}, 400);
};
map.on("moveend", loadPics);
YS.renderers.map = loadPics;
$("#mapwrap").insertAdjacentHTML("beforebegin", `<form class="row" id="mSearch"><input id="mQ" type="search" placeholder="Search any place in India" style="flex:1" aria-label="Search the map"><button class="pri" type="submit">Go</button></form>`);
$("#mSearch").onsubmit = e => { e.preventDefault(); jump($("#mQ").value, map) };
$("#fuel").insertAdjacentHTML("afterend", `<button class="sec" id="picBtn" type="button" aria-pressed="${on}">Photo points</button>`);
$("#picBtn").onclick = e => {
on = !on; store.set("picPts", on); e.currentTarget.setAttribute("aria-pressed", on);
if(!on) return map.removeLayer(pics);
pics.addTo(map); got.clear();
map.getZoom() < 10 ? toast("Zoom in to see photo points of places") : loadPics();
};
const info = $("#routeInfo"); if(info && !$("#picHint")) info.insertAdjacentHTML("afterend", `<p class="note" id="picHint">Zoom in anywhere in India to see photo points. Tap a photo to open the place.</p>`);

// ---- creator map (made later, when the creator studio opens) ----
L.Map.addInitHook(function(){ if(this._container && this._container.id === "crMap") setTimeout(() => creator(this), 0) });
function creator(cm){
const shots = L.layerGroup().addTo(cm), views = L.layerGroup().addTo(cm), done = new Set();
const wrap = $("#crMap").closest(".crmap-wrap") || $("#crMap");
wrap.insertAdjacentHTML("beforebegin", `<form class="row" id="crSearch"><input id="crQ" type="search" placeholder="Find shoot spots anywhere in India" style="flex:1" aria-label="Search shoot spots"><button class="pri" type="submit">Go</button></form>`);
// search any place in India: move the map there AND make it the place for shoot spots and scripts
const pick = async q => {
q = q.trim(); if(!q || !$("#crAt")) return;
try{
let p = (await YS.wikiSearch(q)).list[0];
if(!p){ const g = await YS.geocode(q); if(g) p = (await YS.wikiNear(g.lat, g.lng, 10000))[0] }
if(!p) return;
p = YS.addPlace(p); $("#crAt").value = p.id; $("#crAt").dispatchEvent(new Event("change"));
toast("Shoot spots and script for " + p.n);
}catch(e){}
};
$("#crSearch").onsubmit = e => { e.preventDefault(); jump($("#crQ").value, cm); pick($("#crQ").value) };
const lg = $("#v-creator .legend");
if(lg) lg.insertAdjacentHTML("beforeend", `<span><i class="shotpin sm"></i>Best photo spot (real photo shot here)</span><span><i class="viewpin sm">👁</i>Viewpoint for photo & video</span>`);
let tt;
const load = () => { clearTimeout(tt); tt = setTimeout(() => {
if(cm.getZoom() < 8) return;
const c = cm.getCenter(), k = c.lat.toFixed(1) + "," + c.lng.toFixed(1); if(done.has(k)) return; done.add(k);
YS.photoSpots(c.lat, c.lng, 12).then(list => list.forEach(s => L.marker([s.lat, s.lng], {icon: picIcon(s.img, "shotpin"), title: s.name}).bindPopup(pop(s)).addTo(shots))).catch(() => done.delete(k));
YS.overpass(`[out:json][timeout:20];nwr(around:15000,${c.lat},${c.lng})[tourism=viewpoint];out center 40;`).then(j => j.elements.forEach(el => {
const lat = el.lat ?? (el.center && el.center.lat), lng = el.lon ?? (el.center && el.center.lon); if(lat == null) return;
const s = {lat, lng, name: el.tags.name || "Viewpoint"};
L.marker([lat, lng], {icon: L.divIcon({className:"", iconSize:[30,30], iconAnchor:[15,15], html:`<div class="viewpin">👁</div>`}), title: s.name}).bindPopup(pop(s)).addTo(views);
})).catch(() => {});
}, 500) };
cm.on("moveend", load); load();
}
})();
// ---------- App language: English + 22 Indian languages (auto-translated by Google Translate) ----------
(() => {
const {$, store, toast} = YS;
const LANG = YS.APP_LANGS = [["en","English","English"],["as","অসমীয়া","Assamese"],["bn","বাংলা","Bengali"],["brx","बड़ो","Bodo"],["doi","डोगरी","Dogri"],
["gu","ગુજરાતી","Gujarati"],["hi","हिन्दी","Hindi"],["kn","ಕನ್ನಡ","Kannada"],["ks","کٲشُر","Kashmiri"],["gom","कोंकणी","Konkani"],["mai","मैथिली","Maithili"],
["ml","മലയാളം","Malayalam"],["mni-Mtei","ꯃꯤꯇꯩꯂꯣꯟ","Manipuri"],["mr","मराठी","Marathi"],["ne","नेपाली","Nepali"],["or","ଓଡ଼ିଆ","Odia"],["pa","ਪੰਜਾਬੀ","Punjabi"],
["sa","संस्कृतम्","Sanskrit"],["sat","ᱥᱟᱱᱛᱟᱲᱤ","Santali"],["sd","سنڌي","Sindhi"],["ta","தமிழ்","Tamil"],["te","తెలుగు","Telugu"],["ur","اردو","Urdu"]];
let lang = store.get("appLang", "en");
if(!LANG.some(l => l[0] === lang)) lang = "en";
YS.appLang = () => lang;
const KEY = "tr-" + lang, dict = store.get(KEY, {});
let saveT;
const save = () => { clearTimeout(saveT); saveT = setTimeout(() => { const k = Object.keys(dict); k.slice(0, Math.max(0, k.length - 4000)).forEach(x => delete dict[x]); store.set(KEY, dict) }, 1000) };

// one call to Google Translate
const call = async (text, to, from) => {
const r = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&dt=t&sl=${from}&tl=${encodeURIComponent(to)}&q=${encodeURIComponent(text)}`);
if(!r.ok) throw new Error("translate " + r.status);
const j = await r.json();
return (j[0] || []).map(s => s[0]).join("");
};
YS.tr = async (text, to, from = "en") => {
if(!text || to === from) return text;
const parts = [], lines = text.split("\n"); let cur = "";
lines.forEach(l => { if((cur + l).length > 1400 && cur){ parts.push(cur); cur = "" } cur += (cur ? "\n" : "") + l });
parts.push(cur);
return (await Promise.all(parts.map(p => p.trim() ? call(p, to, from) : p))).join("\n");
};

// ---------- translate the whole screen ----------
if(lang !== "en"){
document.documentElement.lang = lang;
const SKIP = "script,style,textarea,code,.notranslate,.leaflet-control-attribution,#crOut,#tOut,#tIn,#tPh,#crL,#tFrom,#tTo,.me-head,.phpin";
const ATTR = ["placeholder","aria-label","title"];
const done = new WeakMap();
const norm = s => s.replace(/\s+/g, " ").trim();
const want = s => /[A-Za-z]{2,}/.test(s) && s.length < 600 && !/@|https?:|www\./.test(s);
const missing = new Set();
const fix = (val, set, n, k) => {
const d = done.get(n) || {}; if(d[k] === val) return;
const en = norm(val); if(!want(en)) return;
if(dict[en] != null){ const out = val.match(/^\s*/)[0] + dict[en] + val.match(/\s*$/)[0]; d[k] = out; done.set(n, d); set(out) }
else missing.add(en);
};
const walk = root => {
if(!root) return;
if(root.nodeType === 3){ const p = root.parentElement; if(p && !p.closest(SKIP)) fix(root.nodeValue, v => root.nodeValue = v, root, "t"); return }
if(root.nodeType !== 1 || root.closest(SKIP)) return;
const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
for(let n = w.nextNode(); n; n = w.nextNode()){ const p = n.parentElement; if(p && !p.closest(SKIP)) fix(n.nodeValue, v => n.nodeValue = v, n, "t") }
[root, ...root.querySelectorAll("[placeholder],[aria-label],[title]")].forEach(el => ATTR.forEach(a => {
const v = el.getAttribute && el.getAttribute(a); if(v && !el.closest(".notranslate")) fix(v, x => el.setAttribute(a, x), el, a) }));
};
let busy = false, failed = 0;
const fetchMissing = async () => {
if(busy || !missing.size || failed > 3) return;
busy = true;
const list = [...missing].slice(0, 120); list.forEach(s => missing.delete(s));
const chunks = []; let c = [], len = 0;
list.forEach(s => { if(len + s.length > 1200 && c.length){ chunks.push(c); c = []; len = 0 } c.push(s); len += s.length + 1 });
if(c.length) chunks.push(c);
await Promise.all(chunks.map(async part => {
try{
const res = (await call(part.join("\n"), lang, "en")).split("\n");
if(res.length === part.length) part.forEach((s, i) => dict[s] = res[i].trim() || s);
else for(const s of part) dict[s] = (await call(s, lang, "en")).trim() || s;
}catch(e){ failed++ }
}));
save(); busy = false;
walk(document.body);
if(missing.size) setTimeout(fetchMissing, 300);
else if(failed > 3) toast("Translation needs the internet. Showing English for now.");
};
let t = null; const roots = new Set();
const run = () => { roots.forEach(walk); roots.clear(); fetchMissing() };
new MutationObserver(ms => {
ms.forEach(m => m.type === "childList" ? m.addedNodes.forEach(n => roots.add(n)) : roots.add(m.target));
clearTimeout(t); t = setTimeout(run, 80);
}).observe(document.body, {subtree:true, childList:true, characterData:true, attributes:true, attributeFilter:ATTR});
walk(document.body); fetchMissing();
}

// ---------- language picker ----------
const short = () => (LANG.find(l => l[0] === lang) || LANG[0])[1].slice(0, 3);
YS.langPicker = () => {
$("#sBody").innerHTML = `<h2 style="margin-top:0">App language</h2>
<p class="meta">Translated automatically by Google Translate. A few words may not be perfect.</p>
<div class="langs notranslate">${LANG.map(l => `<button type="button" data-lang="${l[0]}" aria-pressed="${l[0] === lang}"><b>${l[1]}</b><span>${l[2]}</span></button>`).join("")}</div>
<div class="row"><button class="sec" type="button" data-go="close">Close</button></div>`;
$("#sheet").classList.add("on");
};
document.addEventListener("click", e => {
const b = e.target.closest("[data-lang]");
if(b){ store.set("appLang", b.dataset.lang); location.reload(); return }
if(e.target.closest(".hlang")){ e.preventDefault(); YS.langPicker() }
});
const btn = cls => `<button class="hlang notranslate ${cls}" type="button" aria-label="Change language">🌐 ${short()}</button>`;
const hs = $(".hsos"); if(hs) hs.insertAdjacentHTML("beforebegin", btn(""));
const addAuth = () => { const a = $("#auth"); if(a && a.innerHTML && !a.querySelector(".hlang")) a.insertAdjacentHTML("afterbegin", btn("authlang")) };
addAuth(); new MutationObserver(addAuth).observe($("#auth"), {childList:true});

// profile row
const me = YS.renderers.me;
YS.renderers.me = () => { me && me(); const m = $("#v-me .menu");
if(m) m.insertAdjacentHTML("afterbegin", `<button type="button" class="hlang-row" onclick="YS.langPicker()"><b>App language</b><span class="notranslate">${(LANG.find(l => l[0] === lang) || LANG[0]).slice(1).join(" · ")}</span><i aria-hidden="true">›</i></button>`) };

})();
// ---------- Script writer and translator in every Indian language ----------
(() => {
const {$, toast} = YS, LANG = YS.APP_LANGS, lang = YS.appLang();
// ---------- scripts in every language ----------
const OWN = ["en","hi","gu","hinglish"], sc0 = YS.script;
// scripts name the right state: "#Kerala #KeralaTourism · 📍 Place, Kerala" instead of always Gujarat
const STATES = ["Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Andaman and Nicobar","Chandigarh","Dadra and Nagar Haveli","Daman and Diu","Delhi","Jammu and Kashmir","Ladakh","Lakshadweep","Puducherry"];
YS.stateOf = p => !p.live ? "Gujarat" : (STATES.find(s => `${p.d} ${p.wiki || ""} ${p.n}`.includes(s)) || "India");
const sc = (p, f, l) => {
const out = sc0(p, f, l), st = YS.stateOf(p), tag = st.replace(/[^A-Za-z]/g, "");
if(st === "Gujarat") return out;
return out.replace(/#GujaratTourism/g, st === "India" ? "#IncredibleIndia" : `#${tag}Tourism`).replace(/#Gujarat\b/g, `#${tag}`).replace(/, Gujarat/g, `, ${st}`);
};
YS.script = sc;
if(YS.LANGS){
LANG.filter(l => !OWN.includes(l[0])).forEach(l => YS.LANGS.push([l[0], `${l[1]} (${l[2]})`]));
YS.script = (p, f, l) => {
if(OWN.includes(l)) return sc(p, f, l);
const en = sc(p, f, "en");
YS.tr(en, l).then(t => { const o = $("#crOut"); if(o && $("#crL") && $("#crL").value === l) o.value = t }).catch(() => toast("Couldn't translate the script. Check your internet."));
return en;
};
}

// ---------- translator: all languages, Google ----------
const tr = YS.renderers.translate;
YS.renderers.translate = () => {
tr && tr();
const from = $("#tFrom"), to = $("#tTo"); if(!from || from.dataset.all) return;
from.dataset.all = 1;
const opts = LANG.map(l => `<option value="${l[0]}">${l[2]} · ${l[1]}</option>`).join("");
from.innerHTML = to.innerHTML = opts; from.value = "en"; to.value = lang === "en" ? "gu" : lang;
const go = async () => {
const q = $("#tIn").value.trim(); if(!q) return;
$("#tOut").textContent = "…";
try{ $("#tOut").textContent = await YS.tr(q, to.value, from.value) }catch(e){ $("#tOut").textContent = "Couldn't translate. Check your internet." }
};
$("#tGo").onclick = go;
$("#tPh").onclick = e => { const b = e.target.closest("button"); if(!b) return; from.value = "en"; $("#tIn").value = b.textContent; go() };
$("#tSay").onclick = () => { const t = $("#tOut").textContent; if(!t || !window.speechSynthesis) return;
const u = new SpeechSynthesisUtterance(t); u.lang = to.value.split("-")[0] + "-IN"; speechSynthesis.cancel(); speechSynthesis.speak(u) };
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
if(SR) $("#tMic").onclick = () => { const r = new SR(); r.lang = from.value.split("-")[0] + "-IN";
r.onresult = e => { $("#tIn").value = e.results[0][0].transcript; go() }; r.onerror = () => toast("Couldn't hear you. Try again."); r.start(); toast("Listening…") };
const n = $("#v-translate .note"); if(n) n.textContent = "Translations by Google Translate need the internet. Check important details with a local.";
};
})();
