(() => {
const {$, $$, esc, store, km, toast, show} = YS;
const once = {};
const page = (id, fn) => { YS.renderers[id] = () => { if(!once[id]){ once[id] = 1; fn($("#v-"+id)) } if(YS.refresh?.[id]) YS.refresh[id]() } };
const mapsLink = () => { const m = YS.me(); return `https://maps.google.com/?q=${m.lat.toFixed(5)},${m.lng.toFixed(5)}` };
YS.refresh = YS.refresh || {};
// ================= SOS =================
const NUMBERS = [["112","Emergency (all services)"],["100","Police"],["108","Ambulance"],["101","Fire"],["181","Women helpline"],["1098","Child helpline"],["1363","Tourist helpline"]];
page("sos", el => {
  el.innerHTML = `
    <a class="btn sosbig" href="tel:112">Call 112</a>
    <p class="note">Tap to call India's emergency number. Works without the internet.</p>
    <h2>Share my location</h2>
    <div class="card"><div class="meta" id="sosLoc"></div>
      <div class="row"><a class="btn pri" id="sosWa" target="_blank" rel="noopener">Send on WhatsApp</a><a class="btn sec" id="sosSms">Send SMS to my contacts</a><button class="sec" id="sosShare" type="button">Share…</button></div></div>
    <h2>Emergency contacts</h2>
    <div id="sosContacts"></div>
    <div class="row"><input id="scName" placeholder="Name" style="flex:1"><input id="scNum" type="tel" placeholder="Phone number" style="flex:1"><button class="sec" id="scAdd" type="button">Add</button></div>
    <h2>Helplines</h2>
    ${NUMBERS.map(n => `<div class="card call"><div><h3>${n[0]}</h3><div class="meta">${n[1]}</div></div><a class="btn sec" href="tel:${n[0]}">Call</a></div>`).join("")}
    <p class="note">Contacts are saved only on this phone.</p>`;
  const contacts = () => store.get("sos", []);
  const draw = () => {
    const c = contacts(), msg = `SOS! I need help. My location: ${mapsLink()}`;
    $("#sosLoc").textContent = `Your location: ${mapsLink()}`;
    $("#sosWa").href = "https://wa.me/?text=" + encodeURIComponent(msg);
    $("#sosSms").href = `sms:${c.map(x => x.num).join(",")}?body=${encodeURIComponent(msg)}`;
    $("#sosContacts").innerHTML = c.length ? c.map((x,i) => `<div class="card call"><div><h3>${esc(x.name)}</h3><div class="meta">${esc(x.num)}</div></div>
      <div class="row" style="margin:0"><a class="btn sec" href="tel:${esc(x.num)}">Call</a><button class="sec" type="button" data-del="${i}" aria-label="Remove">✕</button></div></div>`).join("")
      : `<div class="empty">Add family or friends to alert in an emergency.</div>`;
  };
  $("#scAdd").onclick = () => { const name = $("#scName").value.trim(), num = $("#scNum").value.replace(/[^\d+]/g, "");
    if(!name || num.length < 10){ toast("Enter a name and a 10-digit phone number"); return }
    store.set("sos", [...contacts(), {name, num}]); $("#scName").value = $("#scNum").value = ""; draw() };
  $("#sosContacts").onclick = e => { const d = e.target.closest("[data-del]"); if(!d) return; const c = contacts(); c.splice(+d.dataset.del, 1); store.set("sos", c); draw() };
  $("#sosShare").onclick = async () => { try{ await navigator.share({title:"SOS", text:`SOS! I need help. My location: ${mapsLink()}`}) }catch(e){ toast("Use WhatsApp or SMS instead") } };
  YS.refresh = YS.refresh || {}; YS.refresh.sos = draw;
});
})();
