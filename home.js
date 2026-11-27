// ---------- Home: booking-app style start screen ----------
(() => {
const {$, esc, placeOptions} = YS;
const I = p => `<svg viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`;
const SVC = [
  ["stays","Hotels",'<path d="M3 19V7M3 13h18v6M21 13a3 3 0 0 0-3-3h-7v3"/><circle cx="7" cy="10" r="1.5"/>'],
  ["routes","Bus",'<rect x="4" y="3" width="16" height="15" rx="3"/><path d="M4 10h16M8 21v-3M16 21v-3"/>'],
  ["routes","Train",'<rect x="6" y="3" width="12" height="14" rx="3"/><path d="M6 11h12M9 21l1.5-4M15 21l-1.5-4"/>'],
  ["routes","Car & bike",'<path d="M5 16V12l2-5h10l2 5v4zM5 16v2M19 16v2M5 12h14"/>'],
  ["routes","Boat",'<path d="M3 17l2 3h14l2-3zM6 17V9h12v8M12 4v5"/>'],
  ["places","Places",'<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>'],
  ["map","Live map",'<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14"/>'],
  ["weather","Weather",'<circle cx="8" cy="9" r="3"/><path d="M8 3v1M3 9h1M4.5 5.5l.7.7M9 20h8a3.5 3.5 0 0 0 0-7 5 5 0 0 0-9.6 1.5A3 3 0 0 0 9 20z"/>'],
  ["connect","Buddies",'<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M15 14.5c3 0 6 1.8 6 5"/>'],
  ["group","Group trips",'<path d="M3 9l9-5 9 5-9 5zM7 11v5c3 2 7 2 10 0v-5"/>'],
  ["translate","Translate",'<path d="M4 5h8M8 3v2M6 5c0 4 3 7 6 8M10 5c0 3-3 7-6 8M13 21l4-9 4 9M14.5 18h5"/>'],
  ["sos","SOS",'<path d="M12 3l9 16H3z"/><path d="M12 10v4M12 17h.01"/>']
];
const P = PLACES;
$("#v-home").innerHTML = `
  <form class="hsearch" id="hForm" role="search">
    <label for="hq" class="sr">Search places</label>
    <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>
    <input id="hq" list="hList" placeholder="Where do you want to go?" autocomplete="off">
    <datalist id="hList">${P.map(p => `<option value="${esc(p.n)}">`).join("")}</datalist>
    <button class="pri" type="submit">Search</button>
  </form>
  <div class="svc">${SVC.map(s => `<button type="button" data-open="${s[0]}" class="${s[0]==="sos"?"red":""}"><i>${I(s[2])}</i>${s[1]}</button>`).join("")}</div>
  <div class="card plan">
    <h2>Plan a trip</h2>
    <div class="row"><label style="flex:2;margin:0">Going to<select id="hTo">${placeOptions()}</select></label>
      <label style="flex:1;margin:0">Travellers<input id="hN" type="number" min="1" max="200" value="2"></label></div>
    <div class="row" style="margin-bottom:0"><button class="pri" type="button" id="hGo" style="flex:1">Compare transport</button>
      <button class="sec" type="button" id="hStay" style="flex:1">Find stays</button></div>
  </div>
  <h2>Popular this season</h2>
  <div class="hscroll">${P.map(p => `<button type="button" class="pcard" data-id="${p.id}">
    <span class="pimg" style="background:${COL[p.c] || "var(--indigo)"}">${esc(p.n[0])}</span>
    <b>${esc(p.n)}</b><span class="meta">${esc(p.c)} · ${esc(p.best)}</span></button>`).join("")}</div>
  <h2>Trip types</h2>
  <div class="chips">${[["heritage","Heritage"],["wildlife","Wildlife"],["temple","Temples"],["beach","Beaches"],["desert","Desert"],["hill","Hills"]].map(t => `<button type="button" class="sec" data-type="${t[0]}">${t[1]}</button>`).join("")}</div>`;

const pick = () => {
  const id = $("#hTo").value, n = $("#hN").value;
  if(typeof selectPlace === "function") selectPlace(id);
  $("#routeTo").value = id; $("#stayAt").value = id; $("#ppl").value = n;
};
$("#hGo").onclick = () => { pick(); YS.show("routes") };
$("#hStay").onclick = () => { pick(); YS.show("stays") };
$("#hForm").onsubmit = e => {
  e.preventDefault();
  const q = $("#hq").value.trim().toLowerCase(); if(!q) return;
  const hit = P.find(p => p.n.toLowerCase() === q) || P.find(p => p.n.toLowerCase().includes(q));
  if(hit){ openPlace(hit.id); return }
  YS.show("places"); $("#q").value = $("#hq").value; $("#q").dispatchEvent(new Event("input"));
};
$("#v-home").addEventListener("click", e => {
  const c = e.target.closest(".pcard"); if(c){ openPlace(c.dataset.id); return }
  const t = e.target.closest("[data-type]");
  if(t){ YS.show("places"); $("#q").value = t.dataset.type; $("#q").dispatchEvent(new Event("input")) }
});

MAIN.push("home"); TITLES.home = "Yatra Saathi"; TITLES.map = "Live map";
YS.show("home");
})();
