(() => {
const {$, $$, esc, store, km, toast, show} = YS;
const once = {};
const page = (id, fn) => { YS.renderers[id] = () => { if(!once[id]){ once[id] = 1; fn($("#v-"+id)) } if(YS.refresh?.[id]) YS.refresh[id]() } };
const mapsLink = () => { const m = YS.me(); return `https://maps.google.com/?q=${m.lat.toFixed(5)},${m.lng.toFixed(5)}` };
YS.refresh = YS.refresh || {};
// ================= Creator studio (shoot spots + script writer) =================
const FORMATS = {reel:"Instagram Reel (30 sec)", short:"YouTube Short (60 sec)", vlog:"Vlog (5–8 min)", caption:"Photo caption"};
function script(p, f, style){
  const hi = style === "hinglish", s = p.shoot || [];
  const hook = hi ? `Gujarat mein ${p.n} dekha hai kya? Ye video end tak dekhna!` : `Have you seen ${p.n} like this? Watch till the end!`;
  const tags = ["#"+p.n.replace(/[^A-Za-z]/g,""), "#Gujarat", "#GujaratTourism", "#"+p.c.replace(/\s/g,""), "#TravelIndia", "#YatraSaathi"].join(" ");
  if(f === "caption") return `${p.n} ✨\n${p.d}\n\nBest time: ${p.best}\n📍 ${p.n}, Gujarat\n\n${tags}`;
  if(f === "vlog") return `TITLE: ${p.n} Travel Guide | Best time, cost & tips\n\nINTRO (0:00): ${hook} Today I'm taking you to ${p.n}.\n\nPART 1 – Getting there (0:30): Show the journey. Mention how far it is and the cheapest way to reach (use Yatra Saathi's Routes tab).\n\nPART 2 – The place (2:00): ${p.d}\nShots: ${s.join("; ")}.\n\nPART 3 – Stay & food (4:00): Show one budget and one premium option.\n\nPART 4 – Tips (5:30): Best time is ${p.best}. Share 3 tips from the Trip guide.\n\nOUTRO (7:00): Ask viewers which place you should visit next. Subscribe!\n\n${tags}`;
  const secs = f === "reel" ? ["0–3s","3–12s","12–24s","24–30s"] : ["0–5s","5–25s","25–50s","50–60s"];
  return `HOOK (${secs[0]}): ${hook}\nShot: ${s[0] || "Wide establishing shot"}\n\nSCENE 2 (${secs[1]}): ${s[1] || "Close-up details"}\nVoiceover: ${p.d}\n\nSCENE 3 (${secs[2]}): ${s[2] || "You walking into the frame"}\nText on screen: Best time – ${p.best}\n\nCTA (${secs[3]}): ${hi ? "Save karo aur apne travel buddy ko tag karo!" : "Save this and tag your travel buddy!"}\n\nCaption: ${p.n}, Gujarat 📍\n${tags}`;
}
page("creator", el => {
  el.innerHTML = `<label>Place<select id="crAt">${YS.placeOptions()}</select></label>
    <div class="card"><h3>Best shoot spots</h3><ul class="tips" id="crSpots"></ul><div class="meta" id="crBest"></div></div>
    <h2>Script writer</h2>
    <div class="row"><select id="crF" style="flex:1">${Object.entries(FORMATS).map(([k,v]) => `<option value="${k}">${v}</option>`).join("")}</select>
      <select id="crSt" style="flex:1"><option value="en">English</option><option value="hinglish">Hinglish</option></select></div>
    <textarea id="crOut" style="min-height:260px"></textarea>
    <div class="row"><button class="sec" id="crCopy" type="button">Copy script</button></div>
    <h2>Share your photos</h2><div id="creatorCloud"><div class="empty">Loading…</div></div>`;
  const draw = () => { const p = PLACES.find(x => x.id === $("#crAt").value);
    $("#crSpots").innerHTML = (p.shoot || []).map(s => `<li>${esc(s)}</li>`).join("");
    $("#crBest").textContent = `Best season: ${p.best}. Golden hour is the first and last hour of sunlight. Follow local rules on drones and photography.`;
    $("#crOut").value = script(p, $("#crF").value, $("#crSt").value) };
  ["#crAt","#crF","#crSt"].forEach(s => $(s).onchange = draw);
  $("#crCopy").onclick = async () => { try{ await navigator.clipboard.writeText($("#crOut").value); toast("Script copied") }catch(e){ toast("Couldn't copy") } };
  if(YS.selected()) $("#crAt").value = YS.selected();
  draw();
});
})();
