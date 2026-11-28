// ---------- Helpful extras: budget alerts, weather packing tips, trip journal, I'm-safe check-in, phrasebook, big text ----------
(() => {
const {$, esc, store, toast} = YS;
const I = p => `<svg viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`;
const main = $("main"), tiles = $("#v-home .tiles");
const VIEWS = [["journal","Journal","Journal",'<path d="M6 3h11a2 2 0 0 1 2 2v16l-3-2-3 2-3-2-3 2V4a1 1 0 0 1 1-1z"/><path d="M9 8h7M9 12h7M9 16h4"/>'],
["safe","I'm safe","I'm safe",'<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>'],
["phrases","Phrases","Phrases",'<path d="M4 5h11v9H8l-4 3z"/><path d="M15 9h5v8l-3-2h-6v-1"/>']];
VIEWS.forEach(v => { main.insertAdjacentHTML("beforeend", `<section class="view" id="v-${v[0]}"></section>`); TITLES[v[0]] = v[1];
if(tiles) tiles.insertAdjacentHTML("beforeend", `<button type="button" data-open="${v[0]}"><i>${I(v[3])}</i>${v[2]}</button>`) });
if(tiles) tiles.insertAdjacentHTML("beforeend", `<button type="button" id="bigText"><i>${I('<path d="M4 18 9 6l5 12M5.8 14h6.4M15 18l3-7 3 7M15.9 16h4.2"/>')}</i>Big text</button>`);
const rs = n => "₹" + Math.round(n).toLocaleString("en-IN");
const css = document.createElement("style");
css.textContent = `html.bigtxt{font-size:118%}html.bigtxt body{font-size:1.12rem}html.bigtxt .tiles button{font-size:13.5px}
.jr-entry{margin:10px 0}.jr-entry img{width:100%;max-height:260px;object-fit:cover;border-radius:16px;display:block;margin-bottom:8px}
.jr-entry p{margin:6px 0 0;white-space:pre-wrap;line-height:1.45}.jr-top{display:flex;justify-content:space-between;align-items:center;gap:8px}
.jr-top small{color:var(--mute)}.jr-form textarea{width:100%;min-height:90px;border-radius:14px;padding:10px 12px;font:inherit;box-sizing:border-box}
.jr-prev{width:100%;max-height:200px;object-fit:cover;border-radius:14px;margin-top:8px;display:none}
.ph-tabs{display:flex;gap:6px;overflow-x:auto;padding-bottom:6px;margin-bottom:8px}.ph-tabs .pill{flex:none;white-space:nowrap}.ph-row{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--line)}
.ph-row div{flex:1;min-width:0}.ph-row b{display:block;font-size:17px}.ph-row small{display:block;color:var(--mute)}.ph-row .ph-en{font-size:12px;letter-spacing:.04em;text-transform:uppercase;color:var(--sea);font-weight:700}
.ph-say{width:42px;height:42px;min-height:0;border-radius:50%;padding:0;flex:none}
.wx-tips{margin-top:10px}.wx-tips ul{margin:6px 0 10px;padding-left:20px}.bud-alert{border-left:4px solid #B8643A!important}
.safe-big{width:100%;font-size:18px;padding:18px!important;margin-top:10px}`;
document.head.appendChild(css);

// ===== Big text (easier to read) =====
const applyBig = () => document.documentElement.classList.toggle("bigtxt", !!store.get("bigText", false));
applyBig();
document.addEventListener("click", e => { if(!e.target.closest("#bigText")) return; store.set("bigText", !store.get("bigText", false)); applyBig(); toast(store.get("bigText", false) ? "Big text on" : "Big text off") });

// ===== 1. Budget alerts (warn at 80% and 100% of the trip budget) =====
const budgetLevel = sp => { const spent = (sp.items || []).reduce((s, x) => s + (+x.a || 0), 0), bud = +sp.budget || 0; return {spent, bud, lvl: !bud ? 0 : spent >= bud ? 2 : spent >= bud * .8 ? 1 : 0} };
const origSet = store.set;
store.set = function(k, v){
const before = k === "split" ? budgetLevel(store.get("split", {budget: 0, items: []})).lvl : 0;
const r = origSet.apply(this, arguments);
if(k === "split" && v){ const b = budgetLevel(v);
if(b.lvl > before) toast(b.lvl === 2 ? `⚠️ Budget crossed! Spent ${rs(b.spent)} of ${rs(b.bud)}` : `💡 80% of budget used — ${rs(b.bud - b.spent)} left`) }
return r;
};

// ===== 2. Weather-based packing tips on the My trip screen =====
const addTips = () => {
const trip = store.get("trip", null), v = $("#v-trip"); if(!trip || !trip.dest || !v || $("#wxTips")) return;
const sp = store.get("split", {budget: 0, items: []}), b = budgetLevel(sp);
const grid = v.querySelector(".wgrid"); if(!grid) return;
if(b.lvl) grid.insertAdjacentHTML("afterbegin", `<section class="wg w-white wide bud-alert"><h3>${b.lvl === 2 ? "⚠️ Over budget" : "💡 Budget check"}</h3><p class="meta">You have spent ${rs(b.spent)} of ${rs(b.bud)}.${b.lvl === 2 ? " Try local buses, dhabas and free sights for the rest of the trip." : " About " + rs(b.bud - b.spent) + " is left."}</p></section>`);
grid.insertAdjacentHTML("beforeend", `<section class="wg w-white wide" id="wxTips"><h3>🌦️ Weather packing tips</h3><div class="meta">Checking the forecast…</div></section>`);
const box = $("#wxTips"), days = Math.round((new Date(trip.start + "T00:00Z") - Date.now()) / 864e5);
if(days > 15){ box.querySelector(".meta").textContent = "The forecast opens about 2 weeks before your trip. Check back closer to " + trip.start + "."; return }
fetch(`https://api.open-meteo.com/v1/forecast?latitude=${trip.dest.lat}&longitude=${trip.dest.lng}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max&timezone=auto&forecast_days=16`)
.then(r => r.json()).then(j => {
const d = j.daily, idx = d.time.map((t, i) => t >= trip.start && t <= trip.end ? i : -1).filter(i => i >= 0);
if(!idx.length){ box.querySelector(".meta").textContent = "No forecast for your dates yet."; return }
const hi = Math.max(...idx.map(i => d.temperature_2m_max[i])), lo = Math.min(...idx.map(i => d.temperature_2m_min[i])),
rain = Math.max(...idx.map(i => d.precipitation_probability_max[i] || 0)), uv = Math.max(...idx.map(i => d.uv_index_max[i] || 0));
const items = [];
if(rain >= 40) items.push("Umbrella", "Rain jacket", "Waterproof phone pouch");
if(lo <= 12) items.push("Warm jacket", "Thermal wear", "Woollen cap");
else if(lo <= 18) items.push("Light sweater");
if(hi >= 33) items.push("Cap or hat", "ORS packets", "Cotton clothes");
if(uv >= 7) items.push("Sunscreen SPF 50", "Sunglasses");
const pack = store.get("pack", []), have = new Set(pack.map(x => x.t.toLowerCase())), add = [...new Set(items)].filter(t => !have.has(t.toLowerCase()));
box.innerHTML = `<h3>🌦️ Weather packing tips</h3><p class="meta">${trip.dest.n}: ${Math.round(lo)}°–${Math.round(hi)}°C, up to ${rain}% chance of rain, UV ${Math.round(uv)}.</p>
${add.length ? `<ul>${add.map(t => `<li>${esc(t)}</li>`).join("")}</ul><button class="pri" type="button" id="wxAdd">Add ${add.length} to packing list</button>` : `<p class="meta">✓ Your packing list already covers this weather.</p>`}`;
const btn = $("#wxAdd"); if(btn) btn.onclick = () => { const p = store.get("pack", []); add.forEach(t => p.push({t, done: 0})); store.set("pack", p); toast("Added to packing list"); YS.renderers.trip && YS.renderers.trip() };
}).catch(() => { box.querySelector(".meta").textContent = "Weather tips need the internet." });
};
const tr = YS.renderers.trip; if(tr) YS.renderers.trip = function(){ const r = tr.apply(this, arguments); setTimeout(addTips, 0); return r };

// ===== 3. Trip journal (notes + photos, saved only on this phone) =====
const DB = new Promise((ok, no) => { try{ const q = indexedDB.open("ys-journal", 1); q.onupgradeneeded = () => q.result.createObjectStore("e", {keyPath: "id"}); q.onsuccess = () => ok(q.result); q.onerror = () => no(q.error) }catch(e){ no(e) } });
const tx = (mode, fn) => DB.then(db => new Promise((ok, no) => { const t = db.transaction("e", mode), s = t.objectStore("e"), r = fn(s); t.oncomplete = () => ok(r && r.result); t.onerror = () => no(t.error) }));
const allEntries = () => tx("readonly", s => s.getAll()).then(a => (a || []).sort((x, y) => y.t - x.t));
const shrink = file => new Promise((ok, no) => { const img = new Image(), url = URL.createObjectURL(file);
img.onload = () => { const m = 1000, s = Math.min(1, m / Math.max(img.width, img.height)), c = document.createElement("canvas");
c.width = Math.round(img.width * s); c.height = Math.round(img.height * s); c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url); ok(c.toDataURL("image/jpeg", .72)) };
img.onerror = no; img.src = url });
let pending = null;
const drawJournal = () => {
const el = $("#v-journal"); if(!el) return; const trip = store.get("trip", null);
el.innerHTML = `<div class="card jr-form"><b>New memory</b><div class="meta">${trip ? "Trip: " + esc(trip.dest.n) : "Write about any place or day"}</div>
<textarea id="jrText" placeholder="What did you see, eat or feel today?" aria-label="Journal text"></textarea>
<img class="jr-prev" id="jrPrev" alt="Selected photo">
<div class="row"><label class="sec" style="display:inline-flex;align-items:center;gap:6px;cursor:pointer">📷 Photo<input type="file" accept="image/*" id="jrPhoto" hidden></label>
<button class="pri" type="button" id="jrSave" style="flex:1">Save memory</button></div></div>
<p class="note">Saved only on this phone. Use Share to send a memory to family or Instagram.</p><div id="jrList"><p class="meta">Loading…</p></div>`;
pending = null;
$("#jrPhoto").onchange = async e => { const f = e.target.files[0]; if(!f) return; try{ pending = await shrink(f); const p = $("#jrPrev"); p.src = pending; p.style.display = "block" }catch(err){ toast("Couldn't read that photo") } };
$("#jrSave").onclick = async () => { const text = $("#jrText").value.trim(); if(!text && !pending) return toast("Write something or add a photo");
const t = store.get("trip", null);
try{ await tx("readwrite", s => s.put({id: Date.now() + "" + Math.random().toString(36).slice(2, 6), t: Date.now(), text, img: pending, place: t ? t.dest.n : ""})); toast("Memory saved 📔"); drawJournal() }
catch(e){ toast("Couldn't save — phone storage may be full") } };
listJournal();
};
const listJournal = () => allEntries().then(list => { const box = $("#jrList"); if(!box) return;
box.innerHTML = list.length ? list.map(x => `<div class="card jr-entry">${x.img ? `<img src="${x.img}" alt="Journal photo">` : ""}
<div class="jr-top"><small>${new Date(x.t).toLocaleString("en-IN", {day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit"})}${x.place ? " · " + esc(x.place) : ""}</small>
<span><button class="mini" type="button" data-jrshare="${x.id}">Share</button> <button class="mini" type="button" data-jrdel="${x.id}">Delete</button></span></div>
${x.text ? `<p>${esc(x.text)}</p>` : ""}</div>`).join("") : `<div class="card c"><div style="font-size:42px">📔</div><p class="meta">No memories yet. Your first one goes here.</p></div>`;
}).catch(() => { const box = $("#jrList"); if(box) box.innerHTML = `<p class="meta">Journal isn't available on this browser.</p>` });
document.addEventListener("click", async e => {
const d = e.target.closest("[data-jrdel]"); if(d){ if(confirm("Delete this memory?")){ await tx("readwrite", s => s.delete(d.dataset.jrdel)); listJournal() } return }
const s = e.target.closest("[data-jrshare]"); if(!s) return;
const x = (await allEntries()).find(y => y.id === s.dataset.jrshare); if(!x) return;
const text = `${x.place ? "📍 " + x.place + "\n" : ""}${x.text || ""}\n— shared from Yatra Saathi`;
try{ if(x.img && navigator.canShare){ const blob = await (await fetch(x.img)).blob(), file = new File([blob], "memory.jpg", {type: "image/jpeg"});
if(navigator.canShare({files: [file]})) return await navigator.share({files: [file], text}) }
if(navigator.share) return await navigator.share({text}) }catch(err){ return }
window.open("https://wa.me/?text=" + encodeURIComponent(text), "_blank", "noopener");
});
YS.renderers.journal = drawJournal;

// ===== 4. I'm safe check-in (share your location with family in one tap) =====
const drawSafe = () => {
const el = $("#v-safe"); if(!el) return; const fam = store.get("family", "");
el.innerHTML = `<div class="card"><b>Let family know you're okay</b><p class="meta">Sends a message with your current location on WhatsApp, or any app you choose. Nothing is sent without you tapping Send.</p>
<label>Family WhatsApp number (optional)<input id="sfNum" type="tel" inputmode="tel" placeholder="e.g. 98xxxxxx10" value="${esc(fam)}"></label>
<button class="pri safe-big" type="button" id="sfGo">✅ I'm safe — share location</button>
<button class="sec safe-big" type="button" id="sfReach">🏨 Reached my stay</button></div>
<div class="card"><b>Check-in reminder</b><p class="meta">Get a reminder to check in, so family doesn't worry.</p>
<div class="row"><select id="sfIn" aria-label="Remind me in"><option value="60">In 1 hour</option><option value="120">In 2 hours</option><option value="240">In 4 hours</option><option value="480">In 8 hours</option></select>
<button class="sec" type="button" id="sfRem">Set reminder</button></div><p class="meta" id="sfRemTxt"></p></div>
<p class="note">In an emergency, use the red SOS button or call 112.</p>`;
const nxt = store.get("safeRemind", 0); $("#sfRemTxt").textContent = nxt > Date.now() ? "Reminder set for " + new Date(nxt).toLocaleTimeString("en-IN", {hour: "numeric", minute: "2-digit"}) : "";
const send = async kind => {
const num = $("#sfNum").value.replace(/\D/g, ""); store.set("family", num);
let loc = YS.me && YS.me(); const fresh = await new Promise(ok => { if(!navigator.geolocation) return ok(null); navigator.geolocation.getCurrentPosition(p => ok({lat: p.coords.latitude, lng: p.coords.longitude}), () => ok(null), {enableHighAccuracy: true, timeout: 8000, maximumAge: 60000}) });
if(fresh) loc = fresh;
const map = loc ? `https://maps.google.com/?q=${loc.lat.toFixed(5)},${loc.lng.toFixed(5)}` : "";
const text = `${kind === "stay" ? "🏨 I've reached my stay safely." : "✅ I'm safe."}${map ? "\nMy location: " + map : ""}\n${new Date().toLocaleString("en-IN", {hour: "numeric", minute: "2-digit", day: "numeric", month: "short"})}`;
store.set("safeRemind", 0);
if(num) window.open(`https://wa.me/${num.length === 10 ? "91" + num : num}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
else if(navigator.share) navigator.share({text}).catch(() => {}); else window.open("https://wa.me/?text=" + encodeURIComponent(text), "_blank", "noopener");
};
$("#sfGo").onclick = () => send("safe"); $("#sfReach").onclick = () => send("stay");
$("#sfRem").onclick = () => { const at = Date.now() + +$("#sfIn").value * 6e4; store.set("safeRemind", at);
if("Notification" in window && Notification.permission === "default") Notification.requestPermission();
$("#sfRemTxt").textContent = "Reminder set for " + new Date(at).toLocaleTimeString("en-IN", {hour: "numeric", minute: "2-digit"}); toast("Reminder set") };
};
setInterval(() => { const at = store.get("safeRemind", 0); if(!at || Date.now() < at) return; store.set("safeRemind", 0);
try{ if("Notification" in window && Notification.permission === "granted") new Notification("Yatra Saathi", {body: "Time to check in — let family know you're safe.", icon: "icon-192.png"}) }catch(e){}
toast("⏰ Time to check in with family"); YS.show && YS.show("safe") }, 30000);
YS.renderers.safe = drawSafe;

// ===== 5. Offline phrasebook (works without internet) =====
const LANG = [["hi","हिन्दी","hi-IN"],["gu","ગુજરાતી","gu-IN"],["mr","मराठी","mr-IN"],["ta","தமிழ்","ta-IN"],["te","తెలుగు","te-IN"],["kn","ಕನ್ನಡ","kn-IN"],["ml","മലയാളം","ml-IN"],["bn","বাংলা","bn-IN"]];
const PH = [
["Hello", {hi:["नमस्ते","Namaste"],gu:["નમસ્તે","Namaste"],mr:["नमस्कार","Namaskar"],ta:["வணக்கம்","Vanakkam"],te:["నమస్కారం","Namaskaram"],kn:["ನಮಸ್ಕಾರ","Namaskara"],ml:["നമസ്കാരം","Namaskaram"],bn:["নমস্কার","Nomoskar"]}],
["Thank you", {hi:["धन्यवाद","Dhanyavaad"],gu:["આભાર","Aabhaar"],mr:["धन्यवाद","Dhanyavaad"],ta:["நன்றி","Nandri"],te:["ధన్యవాదాలు","Dhanyavaadaalu"],kn:["ಧನ್ಯವಾದ","Dhanyavaada"],ml:["നന്ദി","Nanni"],bn:["ধন্যবাদ","Dhonnobad"]}],
["How much is this?", {hi:["यह कितने का है?","Yeh kitne ka hai?"],gu:["આ કેટલાનું છે?","Aa ketla nu chhe?"],mr:["हे किती आहे?","He kiti aahe?"],ta:["இது எவ்வளவு?","Idhu evvalavu?"],te:["ఇది ఎంత?","Idi enta?"],kn:["ಇದು ಎಷ್ಟು?","Idu eshtu?"],ml:["ഇതിന് എത്രയാണ്?","Ithinu ethrayaanu?"],bn:["এটার দাম কত?","Etar dam koto?"]}],
["Where is the toilet?", {hi:["शौचालय कहाँ है?","Shauchalay kahaan hai?"],gu:["શૌચાલય ક્યાં છે?","Shauchalay kyaan chhe?"],mr:["शौचालय कुठे आहे?","Shauchalay kuthe aahe?"],ta:["கழிப்பறை எங்கே?","Kazhipparai enge?"],te:["టాయిలెట్ ఎక్కడ ఉంది?","Toilet ekkada undi?"],kn:["ಶೌಚಾಲಯ ಎಲ್ಲಿದೆ?","Shauchalaya ellide?"],ml:["ടോയ്‌ലറ്റ് എവിടെയാണ്?","Toilet evideyaanu?"],bn:["শৌচাগার কোথায়?","Shouchagar kothay?"]}],
["Help!", {hi:["मदद करो!","Madad karo!"],gu:["મદદ કરો!","Madad karo!"],mr:["मदत करा!","Madat kara!"],ta:["உதவி!","Udhavi!"],te:["సహాయం!","Sahaayam!"],kn:["ಸಹಾಯ ಮಾಡಿ!","Sahaaya maadi!"],ml:["സഹായിക്കൂ!","Sahaayikkoo!"],bn:["সাহায্য করুন!","Shahajjo korun!"]}],
["Water, please", {hi:["पानी दीजिए","Paani dijiye"],gu:["પાણી આપો","Paani aapo"],mr:["पाणी द्या","Paani dya"],ta:["தண்ணீர் கொடுங்கள்","Thanneer kodungal"],te:["నీళ్ళు ఇవ్వండి","Neellu ivvandi"],kn:["ನೀರು ಕೊಡಿ","Neeru kodi"],ml:["വെള്ളം തരൂ","Vellam tharoo"],bn:["জল দিন","Jol din"]}],
["Too expensive", {hi:["बहुत महँगा है","Bahut mehenga hai"],gu:["બહુ મોંઘું છે","Bahu monghu chhe"],mr:["खूप महाग आहे","Khoop mahaag aahe"],ta:["ரொம்ப விலை அதிகம்","Romba vilai adhigam"],te:["చాలా ఖరీదు","Chaala khareedu"],kn:["ತುಂಬಾ ದುಬಾರಿ","Thumba dubaari"],ml:["വളരെ വില കൂടുതലാണ്","Valare vila kooduthalaanu"],bn:["খুব দামি","Khub dami"]}],
["I don't understand", {hi:["मुझे समझ नहीं आया","Mujhe samajh nahin aaya"],gu:["મને સમજાયું નહીં","Mane samjaayu nahi"],mr:["मला समजलं नाही","Mala samajla naahi"],ta:["எனக்கு புரியவில்லை","Enakku puriyavillai"],te:["నాకు అర్థం కాలేదు","Naaku artham kaaledu"],kn:["ನನಗೆ ಅರ್ಥವಾಗಲಿಲ್ಲ","Nanage arthavaagalilla"],ml:["എനിക്ക് മനസ്സിലായില്ല","Enikku manassilaayilla"],bn:["আমি বুঝতে পারছি না","Ami bujhte parchhi na"]}],
["Where is the bus stand?", {hi:["बस स्टैंड कहाँ है?","Bus stand kahaan hai?"],gu:["બસ સ્ટેન્ડ ક્યાં છે?","Bus stand kyaan chhe?"],mr:["बस स्टँड कुठे आहे?","Bus stand kuthe aahe?"],ta:["பஸ் நிலையம் எங்கே?","Bus nilaiyam enge?"],te:["బస్ స్టాండ్ ఎక్కడ ఉంది?","Bus stand ekkada undi?"],kn:["ಬಸ್ ನಿಲ್ದಾಣ ಎಲ್ಲಿದೆ?","Bus nildaana ellide?"],ml:["ബസ് സ്റ്റാൻഡ് എവിടെയാണ്?","Bus stand evideyaanu?"],bn:["বাস স্ট্যান্ড কোথায়?","Bus stand kothay?"]}],
["No spicy food, please", {hi:["तीखा मत डालिए","Teekha mat daaliye"],gu:["તીખું ના નાખશો","Teekhu na naakhsho"],mr:["तिखट नको","Tikhat nako"],ta:["காரம் வேண்டாம்","Kaaram vendaam"],te:["కారం వద్దు","Kaaram vaddu"],kn:["ಖಾರ ಬೇಡ","Khaara beda"],ml:["എരിവ് വേണ്ട","Erivu venda"],bn:["ঝাল দেবেন না","Jhal deben na"]}]];
const drawPhr = () => {
const el = $("#v-phrases"); if(!el) return; let cur = store.get("phLang", "hi");
const draw = () => { const l = LANG.find(x => x[0] === cur) || LANG[0];
el.innerHTML = `<div class="ph-tabs">${LANG.map(x => `<button type="button" class="pill${x[0] === cur ? " on" : ""}" data-phl="${x[0]}">${x[1]}</button>`).join("")}</div>
<div class="card">${PH.map((p, i) => `<div class="ph-row"><div><span class="ph-en">${esc(p[0])}</span><b>${p[1][cur][0]}</b><small>${esc(p[1][cur][1])}</small></div><button class="sec ph-say" type="button" data-phs="${i}" aria-label="Say it">🔊</button></div>`).join("")}</div>
<p class="note">Works offline. 🔊 uses your phone's voice — if it's silent, add that language in Settings › Text-to-speech.</p>`;
el.onclick = e => { const t = e.target.closest("[data-phl]"); if(t){ cur = t.dataset.phl; store.set("phLang", cur); draw(); return }
const s = e.target.closest("[data-phs]"); if(!s || !("speechSynthesis" in window)) return;
const u = new SpeechSynthesisUtterance(PH[+s.dataset.phs][1][cur][0]); u.lang = l[2]; u.rate = .9;
const v = speechSynthesis.getVoices().find(x => x.lang && x.lang.toLowerCase().startsWith(cur)); if(v) u.voice = v;
speechSynthesis.cancel(); speechSynthesis.speak(u) } };
draw();
};
YS.renderers.phrases = drawPhr;
})();
