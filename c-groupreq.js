(() => {
const {$, esc, store, km, toast} = YS;
const {now, offline, val, safeUrl, safeImg, compress, page} = CL;
let db, uid;
const ready = CL.ready.then(ok => { db = CL.db(); uid = CL.uid(); return ok });
const once = {};
// ================= Group transport request =================
page("group", async () => {
  const el = $("#groupCloud"); if(!el || el.dataset.done) return; el.dataset.done = 1;
  el.innerHTML = `<div class="card">
      <label>School / college name<input id="gqInst" maxlength="80"></label>
      <div class="row"><label style="flex:1">Contact person<input id="gqName" maxlength="40"></label><label style="flex:1">Phone<input id="gqPhone" type="tel" maxlength="13"></label></div>
      <div class="row"><label style="flex:1">Pickup city<input id="gqFrom" maxlength="40"></label><label style="flex:1">Trip date<input id="gqDate" type="date"></label></div>
      <label>Notes<textarea id="gqNote" maxlength="300" placeholder="AC / non-AC, number of days, stay needed…"></textarea></label>
      <div class="row"><button class="pri" id="gqGo" type="button">Request quotes</button></div>
      <div class="meta">Your request goes to the Yatra Saathi team, who collect quotes from bus agencies and call you back.</div></div>
    <h2>My requests</h2><div id="gqList"></div>`;
  const list = async () => {
    const box = $("#gqList"); if(!await ready){ box.innerHTML = offline; return }
    try{ const snap = await db.collection("groupRequests").where("uid","==",uid).get();
      box.innerHTML = snap.empty ? `<div class="empty">No requests yet.</div>` : snap.docs.map(d => { const r = d.data();
        return `<div class="card"><h3>${esc(r.inst)}</h3><div class="meta">${esc(r.students)} students · ${esc(PLACES.find(x => x.id === r.to)?.n || "")} · ${esc(r.date)}</div><span class="tag">${esc(r.status || "pending")}</span></div>` }).join("");
    }catch(e){ box.innerHTML = offline }
  };
  $("#gqGo").onclick = async () => {
    const r = {inst: val("#gqInst"), name: val("#gqName"), phone: val("#gqPhone").replace(/[^\d+]/g, ""), from: val("#gqFrom"), date: val("#gqDate"), note: val("#gqNote"),
      to: $("#grTo").value, students: +$("#grS").value || 0, teachers: +$("#grT").value || 0};
    if(!r.inst || !r.name || r.phone.length < 10 || !r.date){ toast("Fill in name, phone, institution and date"); return }
    if(!await ready){ toast("You're offline"); return }
    try{ await db.collection("groupRequests").add({...r, uid, status: "pending", created: now()}); toast("Request sent! We'll call you with quotes."); list() }
    catch(e){ toast("Couldn't send. Try again.") }
  };
  list();
});
})();
