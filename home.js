// ---------- Home: MakeMyTrip-style start screen ----------
(() => {
const {$, $$, esc, store, toast, placeOptions} = YS;
const I = p => `<svg viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`;
const TILES = [
  ["map","Map",'<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14"/>'],
  ["stays","Stays",'<path d="M3 19V7M3 13h18v6M21 13a3 3 0 0 0-3-3h-7v3"/>'],
  ["routes","Routes",'<rect x="5" y="3" width="14" height="14" rx="3"/><path d="M5 11h14M8 21l1.5-4M16 21l-1.5-4"/>'],
  ["places","Places",'<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>'],
  ["weather","Weather",'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5"/>'],
  ["connect","Buddies",'<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M15 14.5c3 0 6 2 6 5.5"/>'],
  ["group","Group trip",'<rect x="3" y="5" width="18" height="12" rx="3"/><path d="M3 11h18M7 21v-4M17 21v-4"/>'],
  ["creator","Creator",'<rect x="3" y="7" width="18" height="13" rx="3"/><circle cx="12" cy="13.5" r="3.5"/><path d="M8 7l1.5-3h5L16 7"/>']
];
const MODES = [["Bus","State bus"],["Train","Train"],["Car","Car"],["Bike","Bike"],["Boat","Boat"]];
const soon = new Date(Date.now() + 2*864e5).toISOString().slice(0,10);
$("#v-home").innerHTML = `
  <div class="tiles">${TILES.map(t => `<button type="button" data-open="${t[0]}"><i>${I(t[2])}</i>${t[1]}</button>`).join("")}</div>
  <div class="search">
    <div class="seg" id="hMode">${MODES.map(m => `<button type="button" data-m="${m[0]}" aria-pressed="false">${m[0]}</button>`).join("")}</div>
    <div class="fields">
      <div class="fld">From<b id="hFrom">Your location</b><span id="hFromSub"></span></div>
      <label class="fld">To<select id="hTo">${placeOptions()}</select></label>
      <label class="fld">Date<input id="hDate" type="date" value="${esc(store.get("tripDate", soon))}"></label>
      <label class="fld">Travellers<input id="hPpl" type="number" min="1" max="200" value="2"></label>
    </div>
    <button class="go" id="hGo" type="button">COMPARE &amp; PLAN</button>
  </div>
  <h2>Offers &amp; trip tips</h2>
  <div class="offers">
    <button class="offer a" type="button" data-place="rann"><small>Season</small><b>Rann Utsav season</b><span>Tent city near Dhordo, Nov to Feb</span></button>
    <button class="offer b" type="button" data-open="group"><small>Students</small><b>School trip bus quotes</b><span>Tell us the group size, we call back</span></button>
    <button class="offer b" type="button" data-place="gir"><small>Wildlife</small><b>Gir lion safari</b><span>Best Dec to Mar, book safaris early</span></button>
  </div>`;

const sel = store.get("sel", null); if(sel) $("#hTo").value = sel;
let mode = store.get("mode", "Bus");
const paint = () => $$("#hMode button").forEach(b => b.setAttribute("aria-pressed", b.dataset.m === mode));
$$("#hMode button").forEach(b => b.onclick = () => { mode = b.dataset.m; store.set("mode", mode); paint() });
paint();

$("#hGo").onclick = async () => {
  const id = $("#hTo").value, p = PLACES.find(x => x.id === id);
  selectPlace(id);
  $("#ppl").value = Math.max(1, Math.min(200, +$("#hPpl").value || 1));
  store.set("tripDate", $("#hDate").value);
  YS.show("routes");
  await renderRoutes();
  const dt = $("#hDate").value;
  if(dt) $("#dist").textContent += " · trip on " + new Date(dt).toLocaleDateString("en-IN", {day:"numeric", month:"short"});
  if(mode === "Boat"){ toast(p.boat ? "The Okha ferry is included in every option" : "No boat needed for " + p.n + ". Showing road and rail options."); return }
  if(mode === "Train" && !p.rail){ toast("No direct train to " + p.n + ". Showing other options."); return }
  const name = MODES.find(m => m[0] === mode)[1];
  const card = $$("#modeList .card").find(c => c.querySelector("h3").textContent.startsWith(name));
  if(card){ card.classList.add("pick"); card.scrollIntoView({block:"center", behavior:"smooth"}) }
};

YS.renderers.home = () => {
  const m = YS.me();
  $("#hFrom").textContent = m.name || "Your location";
  $("#hFromSub").textContent = m.live ? "Your live location" : "Approximate location";
};

// navigation: Home replaces Map as a main tab; Map opens from the tiles
MAIN.splice(MAIN.indexOf("map"), 1, "home");
TITLES.home = "Yatra Saathi"; TITLES.map = "Live map"; TITLES.routes = "Compare transport";
YS.last = "home";
document.addEventListener("click", e => {
  const pl = e.target.closest("[data-place]"); if(pl){ openPlace(pl.dataset.place); return }
  const nv = e.target.closest("nav [data-v]"); if(nv){ YS.last = nv.dataset.v; return }
  const op = e.target.closest("[data-open]");
  if(op && !MAIN.includes(op.dataset.open)) $$("nav button").forEach(b => b.dataset.v === YS.last ? b.setAttribute("aria-current","page") : b.removeAttribute("aria-current"));
});
$("#back").onclick = () => YS.show(YS.last || "home");
YS.show("home");
})();
