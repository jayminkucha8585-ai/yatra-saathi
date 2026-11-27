// ---------- Creator studio: shoot-spot map, script writer, photo sharing ----------
(() => {
const {$, esc, toast} = YS;
let cmap = null, spots = null, posts = null;
const cam = on => L.divIcon({className:"", iconSize:[34,34], iconAnchor:[17,17],
html:`<div class="camp${on ? " on" : ""}"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="7" width="18" height="13" rx="3"/><circle cx="12" cy="13.5" r="3.5"/><path d="M8 7l1.5-3h5L16 7"/></svg></div>`});
const opt = (a, v) => a.map(([k, t]) => `<option value="${k}"${k === v ? " selected" : ""}>${t}</option>`).join("");

function draw(){
const p = PLACES.find(x => x.id === $("#crAt").value) || PLACES[0];
$("#crSpots").innerHTML = (p.shoot || []).map(s => `<li>${esc(s)}</li>`).join("");
$("#crBest").textContent = `Best season: ${p.best}. Golden hour is the first and last hour of sunlight. Follow local rules on drones and photography.`;
$("#crOut").value = YS.script(p, $("#crF").value, $("#crL").value);
if(cmap){ spots.eachLayer(m => m.setIcon(cam(m.options.pid === p.id))); cmap.setView([p.lat, p.lng], Math.max(cmap.getZoom(), 8)) }
}
YS.renderers.creator = () => {
const el = $("#v-creator");
if(!el.dataset.ready){
el.dataset.ready = 1;
el.innerHTML = `<p class="meta">Tap a camera on the map to see the best photo and video spots, then write your script.</p>
<div class="crmap-wrap"><div id="crMap"></div></div>
<div class="legend"><span><i class="camp sm"></i>Shoot spot</span><span><i class="phpin sm"></i>Traveler photo</span></div>
<label>Place<select id="crAt">${YS.placeOptions()}</select></label>
<div class="card"><h3>Best shoot spots</h3><ul class="tips" id="crSpots"></ul><div class="meta" id="crBest"></div></div>
<h2>Script writer</h2>
<div class="row"><label style="flex:1;margin:0">Language<select id="crL">${opt(YS.LANGS, localStorage.getItem("ys-lang") || "en")}</select></label>
<label style="flex:1;margin:0">Format<select id="crF">${opt(YS.FORMATS, "reel")}</select></label></div>
<textarea id="crOut" style="min-height:280px" aria-label="Your script"></textarea>
<div class="row"><button class="pri" id="crCopy" type="button">Copy script</button><button class="sec" id="crShare" type="button">Share</button></div>
<h2>Share your photos</h2><div id="creatorCloud"><div class="empty">Loading…</div></div>`;
cmap = L.map("crMap", {zoomControl:true}).setView([22.4, 71.2], 6);
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {maxZoom:19, attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}).addTo(cmap);
spots = L.layerGroup().addTo(cmap); posts = L.layerGroup().addTo(cmap);
PLACES.forEach(p => L.marker([p.lat, p.lng], {icon: cam(false), pid: p.id, title: p.n + " shoot spots"})
.on("click", () => { $("#crAt").value = p.id; draw() }).addTo(spots));
["#crAt","#crF"].forEach(s => $(s).onchange = draw);
$("#crL").onchange = () => { try{ localStorage.setItem("ys-lang", $("#crL").value) }catch(e){} draw() };
$("#crCopy").onclick = async () => { try{ await navigator.clipboard.writeText($("#crOut").value); toast("Script copied") }catch(e){ toast("Couldn't copy") } };
$("#crShare").onclick = async () => { if(navigator.share){ try{ await navigator.share({text: $("#crOut").value}) }catch(e){} } else $("#crCopy").click() };
}
if(YS.selected()) $("#crAt").value = YS.selected();
draw(); setTimeout(() => cmap.invalidateSize(), 60);
};
// traveler photos on the map (called by c-posts.js)
YS.onPosts = list => {
if(!posts) return; posts.clearLayers();
list.forEach((p, i) => {
const pl = PLACES.find(x => x.id === p.place), lat = typeof p.lat === "number" ? p.lat : pl && pl.lat + ((i % 5) - 2) * .01, lng = typeof p.lng === "number" ? p.lng : pl && pl.lng + ((i % 3) - 1) * .01;
if(lat == null || !p.img) return;
L.marker([lat, lng], {icon: L.divIcon({className:"", iconSize:[40,40], iconAnchor:[20,20], html:`<div class="phpin" style="background-image:url('${p.img}')"></div>`})})
.bindPopup(`<img src="${p.img}" alt="" style="width:180px;border-radius:8px"><br><b>${esc(p.name || "Traveler")}</b><br>${esc(p.cap || "")}`).addTo(posts);
});
};
})();
