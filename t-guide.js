(() => {
const {$, $$, esc, store, km, toast, show} = YS;
const once = {};
const page = (id, fn) => { YS.renderers[id] = () => { if(!once[id]){ once[id] = 1; fn($("#v-"+id)) } if(YS.refresh?.[id]) YS.refresh[id]() } };
const mapsLink = () => { const m = YS.me(); return `https://maps.google.com/?q=${m.lat.toFixed(5)},${m.lng.toFixed(5)}` };
YS.refresh = YS.refresh || {};
// ================= Trip guide & packing =================
const GUIDE = {
  beach:{name:"Beach", tips:["Swim only at marked safe zones and never after sunset.","Check tide timings; the sea gets rough in monsoon (Jun–Sep).","Use sunscreen and drink water often.","Keep phones and wallets in a waterproof pouch."],
    pack:["Sunscreen","Sunglasses","Cap or hat","Flip-flops","Swimwear","Quick-dry towel","Waterproof phone pouch","Light cotton clothes"]},
  hill:{name:"Hill station / forest", tips:["Roads can be slippery in monsoon; avoid night driving on ghats.","Carry a light jacket even in summer evenings.","Don't feed or disturb wild animals.","Keep some cash; ATMs can be few."],
    pack:["Light jacket","Walking shoes with grip","Raincoat or umbrella","Torch","Insect repellent","Reusable water bottle"]},
  desert:{name:"Desert", tips:["Carry plenty of water; it's dry even in winter.","Nights get cold in Dec–Jan; pack warm layers.","Get an inner-line or border permit if your route needs it.","Stay with your group on the salt flats; it's easy to lose direction."],
    pack:["Warm jacket for nights","Scarf for dust","Sunglasses","Lip balm and moisturiser","Water (2+ litres per person)","Power bank"]},
  wildlife:{name:"Wildlife safari", tips:["Book safari permits online in advance.","Wear earthy colours; avoid bright clothes and perfume.","Stay silent and inside the vehicle.","No plastic or food inside the park."],
    pack:["Earth-coloured clothes","Binoculars","Camera with zoom lens","Cap","Light jacket for early mornings","ID proof for permit"]},
  pilgrimage:{name:"Temple / pilgrimage", tips:["Dress modestly; cover shoulders and knees.","Leather items, mobiles and cameras may not be allowed inside.","Leave shoes at the official shoe stand.","Visit early morning to avoid long queues."],
    pack:["Modest clothes","Easy slip-on footwear","Small bag for offerings","Water bottle","Cash for donations and prasad"]},
  heritage:{name:"Heritage / city", tips:["Buy tickets online where possible (ASI monuments).","Hire only licensed guides.","Respect 'no photography' signs.","Carry water; many sites have little shade."],
    pack:["Comfortable walking shoes","Cap","Water bottle","Power bank","ID proof"]}
};
const COMMON = ["ID proof (Aadhaar / licence)","Phone charger","Power bank","Basic medicines and first-aid","Cash and UPI","Toothbrush and toiletries","Masks and sanitiser"];
page("guide", el => {
  el.innerHTML = `<div class="row"><select id="gType" style="flex:1">${Object.entries(GUIDE).map(([k,g]) => `<option value="${k}">${g.name}</option>`).join("")}</select>
    <label style="margin:0">Days <input id="gDays" type="number" min="1" max="30" value="2" style="width:80px"></label></div>
    <div id="gTips"></div><h2>Packing checklist</h2><div class="meta" id="gCount"></div><div id="gList"></div>
    <div class="row"><input id="gNew" placeholder="Add your own item" style="flex:1"><button class="sec" id="gAdd" type="button">Add</button><button class="sec" id="gReset" type="button">Reset</button></div>`;
  const key = () => "pack-" + $("#gType").value;
  const draw = () => {
    const t = $("#gType").value, g = GUIDE[t], days = Math.max(1, +$("#gDays").value || 1), st = store.get(key(), {done:[], extra:[]});
    $("#gTips").innerHTML = `<div class="card"><h3>${g.name} tips</h3><ul class="tips">${g.tips.map(x => `<li>${x}</li>`).join("")}</ul></div>`;
    const items = [`Clothes for ${days} day${days>1?"s":""} (${days + 1} sets)`, ...g.pack, ...COMMON, ...st.extra];
    $("#gList").innerHTML = items.map(i => { const d = st.done.includes(i);
      return `<label class="check${d?" done":""}"><input type="checkbox" data-i="${esc(i)}" ${d?"checked":""}><span>${esc(i)}</span></label>` }).join("");
    $("#gCount").textContent = `${st.done.filter(x => items.includes(x)).length} of ${items.length} packed`;
  };
  $("#gType").onchange = draw; $("#gDays").oninput = draw;
  $("#gList").onchange = e => { const i = e.target.dataset.i; if(i == null) return; const st = store.get(key(), {done:[], extra:[]});
    st.done = e.target.checked ? [...st.done, i] : st.done.filter(x => x !== i); store.set(key(), st); draw() };
  $("#gAdd").onclick = () => { const v = $("#gNew").value.trim(); if(!v) return; const st = store.get(key(), {done:[], extra:[]}); st.extra.push(v); store.set(key(), st); $("#gNew").value = ""; draw() };
  $("#gReset").onclick = () => { store.set(key(), {done:[], extra:[]}); draw() };
  YS.refresh = YS.refresh || {}; YS.refresh.guide = () => { const p = PLACES.find(x => x.id === YS.selected()); if(p && !once.guideSet){ once.guideSet = 1; $("#gType").value = p.type } draw() };
});
})();
