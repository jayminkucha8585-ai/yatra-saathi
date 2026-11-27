(() => {
const {$, $$, esc, store, km, toast, show} = YS;
const once = {};
const page = (id, fn) => { YS.renderers[id] = () => { if(!once[id]){ once[id] = 1; fn($("#v-"+id)) } if(YS.refresh?.[id]) YS.refresh[id]() } };
const mapsLink = () => { const m = YS.me(); return `https://maps.google.com/?q=${m.lat.toFixed(5)},${m.lng.toFixed(5)}` };
YS.refresh = YS.refresh || {};
// ================= School & college trips =================
page("group", el => {
  el.innerHTML = `<div class="card"><h3>Guidelines for educational trips</h3><ul class="tips">
      <li>Get written approval from the principal and signed consent from every parent.</li>
      <li>Keep at least 1 teacher for every 15 students, with female staff for mixed groups.</li>
      <li>Carry a list of all students with parent phone numbers, blood group and allergies.</li>
      <li>Give each student an ID card with the teacher's number and the hotel address.</li>
      <li>Use buses with valid permit, fitness certificate and insurance; ask for the driver's licence.</li>
      <li>Do a headcount every time the group boards or leaves the bus.</li>
      <li>Carry a first-aid kit and know the nearest hospital at each stop.</li>
      <li>No travel on highways late at night; plan arrival before dark.</li></ul></div>
    <h2>Estimate a group trip</h2>
    <label>Destination<select id="grTo">${YS.placeOptions()}</select></label>
    <div class="row"><label style="flex:1">Students<input id="grS" type="number" min="1" value="40"></label><label style="flex:1">Teachers<input id="grT" type="number" min="1" value="3"></label></div>
    <div id="grOut"></div>
    <h2>Request low-cost group transport</h2>
    <div id="groupCloud"><div class="empty">Loading…</div></div>`;
  const est = async () => {
    const p = PLACES.find(x => x.id === $("#grTo").value), s = +$("#grS").value || 0, t = +$("#grT").value || 0, n = s + t;
    const r = await YS.getRoute(p), buses = Math.ceil(n/50), bus = buses * Math.max(r.km,100) * 60 * 2;
    const need = Math.ceil(s/15), warn = t < need ? `<p><b>Add ${need - t} more teacher${need-t>1?"s":""}</b> (1 per 15 students).</p>` : "";
    $("#grOut").innerHTML = `<div class="card"><h3>${buses} bus${buses>1?"es":""} for ${n} people</h3>
      <div class="meta">${Math.round(r.km)} km each way · about ${YS.hm(r.hrs*1.2)} by bus</div>
      <p>Round-trip charter: <b>${YS.rupee(bus)}</b> · about <b>${YS.rupee(bus/n)}</b> per person</p>${warn}
      <div class="meta">Estimate at ₹60/km per bus. Food, stay and entry tickets are extra.</div></div>`;
  };
  ["#grTo","#grS","#grT"].forEach(s => $(s).oninput = est);
  est();
});
})();
