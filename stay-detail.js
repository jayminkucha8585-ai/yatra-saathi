// ---------- Stay detail sheet: everything about one stay, inside the app ----------
(() => {
const {$, esc, store, km, toast} = YS;
let mini = null;
const inr = n => "₹" + n.toLocaleString("en-IN");
const tel = p => p.split(/[;,]/)[0].replace(/[^\d+]/g, "");
const row = (k, v) => v ? `<b>${k}</b><span>${esc(v)}</span>` : "";
async function copy(t, msg){ try{ await navigator.clipboard.writeText(t); toast(msg || "Copied") }catch(e){ toast("Couldn't copy") } }
YS.openStay = s => {
const fav = YS.stayFav(), isFav = fav.some(x => x.id === s.id), me = YS.me(), fromMe = km(me, s);
const AM = YS.stayAM, has = AM.filter(a => s.am[a[0]]);
$("#sBody").innerHTML = `<h2 style="font-size:26px;margin:0">${esc(s.name)}</h2>
${s.nameGu || s.nameHi ? `<div class="meta">${esc([s.nameGu, s.nameHi].filter(Boolean).join(" · "))}</div>` : ""}
<div><span class="tag">${esc(YS.stayTier[s.t])}</span><span class="tag">${esc(s.kind)}</span>${s.stars ? `<span class="tag">${"★".repeat(Math.min(5, s.stars))} ${s.stars}-star</span>` : ""}<span class="tag">${fromMe.toFixed(1)} km from you</span></div>
<div class="card" style="margin:12px 0"><div class="meta">Typical price per night</div>
<div style="font:800 24px 'Baloo Bhai 2',sans-serif;color:var(--sea)">${inr(s.price[0])} – ${inr(s.price[1])}</div>
<div class="meta">Estimate for this type of stay${s.stars ? " and star rating" : ""}. Prices go up on weekends, festivals and Rann Utsav season. Call to confirm today's rate.</div></div>
<div id="stMap"></div>
${s.addr ? `<p style="margin:4px 0"><b>Address:</b> ${esc(s.addr)}</p>` : `<p class="meta" style="margin:4px 0">Street address not listed. Use the map and in-app directions above.</p>`}
<h3 style="margin:14px 0 4px">Facilities</h3>
<div class="fac">${AM.map(a => `<span class="${s.am[a[0]] ? "" : "no"}">${s.am[a[0]] ? "✓" : "–"} ${a[1]}</span>`).join("")}</div>
${has.length ? "" : `<p class="meta">Facilities aren't listed for this stay yet. Ask when you call.</p>`}
<h3 style="margin:14px 0 4px">Details</h3>
<div class="kv">${row("Type", s.kind)}${row("Rooms", s.rooms)}${row("Beds", s.beds)}${row("Check-in", s.cin)}${row("Check-out", s.cout)}${row("Reception hours", s.hours)}${row("Pay by", s.pay)}${row("Run by", s.op)}${row("Contact", s.phone)}${row("Email", s.email)}${row("Website", s.web)}</div>
${s.desc ? `<p>${esc(s.desc)}</p>` : ""}
<div class="row" style="margin-top:14px">
<button class="pri" type="button" id="stDir">Directions in the app</button>
${s.phone ? `<a class="btn sec" href="tel:${esc(tel(s.phone))}">Call to book</a>` : ""}
<button class="sec" type="button" id="stFav">${isFav ? "♥ Saved" : "♡ Save"}</button>
<button class="sec" type="button" id="stCopy">Copy details</button>
${s.email ? `<button class="sec" type="button" id="stMail">Copy email</button>` : ""}
<button class="sec" type="button" data-go="close">Close</button></div>
${s.phone ? "" : `<p class="meta">No phone number listed for this stay yet.</p>`}`;
$("#sheet").classList.add("on");
if(mini){ mini.remove(); mini = null }
setTimeout(() => {
mini = L.map("stMap", {zoomControl:false, attributionControl:false}).setView([s.lat, s.lng], 15);
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {maxZoom:19}).addTo(mini);
L.marker([s.lat, s.lng]).addTo(mini).bindPopup(esc(s.name)).openPopup();
L.circleMarker([me.lat, me.lng], {radius:7, color:"#fff", weight:3, fillColor:"#1a73e8", fillOpacity:1}).addTo(mini);
}, 80);
$("#stDir").onclick = () => YS.nav(s.lat, s.lng, s.name);
$("#stFav").onclick = e => {
let f = YS.stayFav(); const on = !f.some(x => x.id === s.id);
f = on ? [s, ...f].slice(0, 50) : f.filter(x => x.id !== s.id);
store.set("stayFav", f); e.currentTarget.textContent = on ? "♥ Saved" : "♡ Save";
toast(on ? "Saved. You can see it offline under ♥ Saved." : "Removed from saved");
};
$("#stCopy").onclick = () => copy([s.name, YS.stayTier[s.t] + " " + s.kind + (s.stars ? `, ${s.stars}-star` : ""), s.addr, s.phone && "Phone: " + s.phone,
`Typical price: ${inr(s.price[0])}–${inr(s.price[1])} per night`, `Location: ${s.lat.toFixed(5)}, ${s.lng.toFixed(5)}`].filter(Boolean).join("\n"), "Stay details copied");
if(s.email) $("#stMail").onclick = () => copy(s.email, "Email copied");
};
})();
