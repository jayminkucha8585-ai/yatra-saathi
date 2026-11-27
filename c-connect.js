(() => {
const {$, esc, store, km, toast} = YS;
const {now, offline, val, safeUrl, safeImg, compress, page} = CL;
let db, uid;
const ready = CL.ready.then(ok => { db = CL.db(); uid = CL.uid(); return ok });
const once = {};
// ================= Traveler connect =================
page("connect", async () => {
  const el = $("#v-connect");
  if(!once.connect){ once.connect = 1;
    el.innerHTML = `<div class="card"><b>Stay safe:</b> meet new people only in public places, tell family your plans, and never share OTPs or send money.</div>
      <h2>My traveler profile</h2>
      <label>Name<input id="cName" maxlength="40"></label>
      <div class="row"><label style="flex:1">Age<input id="cAge" type="number" min="18" max="99"></label><label style="flex:2">Profession<input id="cJob" maxlength="40" placeholder="Student, engineer…"></label></div>
      <div class="row"><label style="flex:1">From<input id="cFrom" maxlength="40" placeholder="Your city"></label><label style="flex:1">Going to<select id="cTo">${YS.placeOptions()}</select></label></div>
      <label>Travel date<input id="cDate" type="date"></label>
      <label>About me<textarea id="cBio" maxlength="200" placeholder="Looking for travel buddies, love photography…"></textarea></label>
      <div class="row"><label style="flex:1">Instagram username<input id="cIg" maxlength="40" placeholder="without @"></label><label style="flex:1">YouTube channel link<input id="cYt" maxlength="120" placeholder="https://youtube.com/@…"></label></div>
      <div class="row"><button class="pri" id="cSave" type="button">Save & show me to travelers</button><button class="sec" id="cHide" type="button">Hide my profile</button></div>
      <h2>Travelers</h2>
      <div class="seg" id="cTab"><button type="button" data-t="dest" aria-pressed="true">Same destination</button><button type="button" data-t="near" aria-pressed="false">Near me (50 km)</button></div>
      <div id="cList"><div class="empty">Loading…</div></div>
      <p class="note">Only adults (18+) can use Traveler connect. Your exact location is never shared, only your area (about 10 km).</p>`;
    const mine = store.get("profile", {});
    [["#cName","name"],["#cAge","age"],["#cJob","job"],["#cFrom","from"],["#cDate","date"],["#cBio","bio"],["#cIg","ig"],["#cYt","yt"]].forEach(([s,k]) => { if(mine[k]) $(s).value = mine[k] });
    if(mine.to) $("#cTo").value = mine.to;
    let tab = "dest";
    $("#cTab").onclick = e => { const b = e.target.closest("button"); if(!b) return; tab = b.dataset.t;
      [...$("#cTab").children].forEach(x => x.setAttribute("aria-pressed", x === b)); list() };
    $("#cSave").onclick = async () => {
      const p = {name: val("#cName"), age: +val("#cAge"), job: val("#cJob"), from: val("#cFrom"), to: $("#cTo").value, date: val("#cDate"), bio: val("#cBio"),
        ig: val("#cIg").replace(/^@/, "").replace(/[^\w.]/g, ""), yt: safeUrl(val("#cYt"), ["youtube.com","youtu.be"])};
      if(!p.name || !p.job){ toast("Add your name and profession"); return }
      if(!(p.age >= 18 && p.age <= 99)){ toast("Traveler connect is for adults (18+)"); return }
      store.set("profile", p);
      if(!await ready){ toast("You're offline. Try again later."); return }
      const m = YS.me();
      try{ await db.collection("profiles").doc(uid).set({...p, uid, lat: Math.round(m.lat*10)/10, lng: Math.round(m.lng*10)/10, visible: true, updated: now()});
        toast("Profile saved. Other travelers can now see you."); list() }catch(e){ toast("Couldn't save. Try again.") }
    };
    $("#cHide").onclick = async () => { if(!await ready) return;
      try{ await db.collection("profiles").doc(uid).set({visible:false, uid, updated: now()}, {merge:true}); toast("Your profile is hidden"); list() }catch(e){ toast("Couldn't update") } };
    async function list(){
      const box = $("#cList");
      if(!await ready){ box.innerHTML = offline; return }
      box.innerHTML = `<div class="empty">Loading travelers…</div>`;
      try{
        const snap = await db.collection("profiles").orderBy("updated","desc").limit(150).get(), m = YS.me(), to = $("#cTo").value;
        let people = snap.docs.map(d => d.data()).filter(p => p.visible && p.uid !== uid && p.name);
        people = tab === "dest" ? people.filter(p => p.to === to) : people.filter(p => km(m, p) <= 50);
        const place = id => PLACES.find(x => x.id === id)?.n || "";
        box.innerHTML = people.length ? people.map(p => { const yt = safeUrl(p.yt, ["youtube.com","youtu.be"]), ig = String(p.ig || "").replace(/[^\w.]/g, "");
          return `<div class="card"><h3>${esc(p.name)}${p.age ? ", "+esc(p.age) : ""}</h3>
          <div class="meta">${esc(p.job)} · ${esc(p.from || "?")} → ${esc(place(p.to))}${p.date ? " · "+esc(p.date) : ""}</div>
          ${p.bio ? `<p>${esc(p.bio)}</p>` : ""}
          <div class="row" style="margin:6px 0 0">${ig ? `<a class="btn sec" href="https://instagram.com/${ig}" target="_blank" rel="noopener">Instagram</a>` : ""}${yt ? `<a class="btn sec" href="${esc(yt)}" target="_blank" rel="noopener">YouTube</a>` : ""}</div></div>` }).join("")
          : `<div class="empty">${tab === "dest" ? `No one else is going to ${esc(place(to))} yet. Save your profile so others can find you.` : "No travelers within 50 km right now."}</div>`;
      }catch(e){ box.innerHTML = offline }
    }
    YS.connectList = list;
  }
  YS.connectList();
});
})();
