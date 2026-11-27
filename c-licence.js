(() => {
const {$, esc, store, km, toast} = YS;
const {now, offline, val, safeUrl, safeImg, compress, page} = CL;
let db, uid;
const ready = CL.ready.then(ok => { db = CL.db(); uid = CL.uid(); return ok });
const once = {};
// ================= Licence verification =================
page("licence", async () => {
  const el = $("#v-licence");
  if(!once.licence){ once.licence = 1;
    el.innerHTML = `<div class="card"><h3>Why verify?</h3><p>Drivers and riders who offer rides or rent vehicles through Yatra Saathi upload their driving licence. Verified drivers get a badge that travelers can trust.</p></div>
      <div id="lStatus"></div>
      <label>Full name (as on licence)<input id="lName" maxlength="60"></label>
      <label>Driving licence number<input id="lNo" maxlength="20" placeholder="e.g. GJ01 20190012345" style="text-transform:uppercase"></label>
      <label>Vehicle type<select id="lType"><option>Two-wheeler</option><option>Car</option><option>Bus / commercial</option></select></label>
      <label>Photo of licence (front)<input id="lImg" type="file" accept="image/*"></label>
      <div class="row"><button class="pri" id="lGo" type="button">Submit for verification</button></div>
      <p class="note">Only you and the Yatra Saathi verification team can see your licence. Verification is checked by the team (a direct link with police and Parivahan records is planned for a later phase).</p>`;
    $("#lGo").onclick = async () => {
      const name = val("#lName"), no = val("#lNo").toUpperCase().replace(/[^A-Z0-9]/g, ""), f = $("#lImg").files[0];
      if(!name || !/^[A-Z]{2}\d{2}[A-Z0-9]{7,14}$/.test(no)){ toast("Enter your name and a valid licence number"); return }
      if(!f){ toast("Add a photo of your licence"); return }
      if(!await ready){ toast("You're offline"); return }
      const btn = $("#lGo"); btn.disabled = true; btn.textContent = "Uploading…";
      try{ const img = await compress(f, 1400);
        await db.collection("licences").doc(uid).set({uid, name, no, type: $("#lType").value, img, status: "pending", created: now()});
        toast("Submitted for verification"); status() }catch(e){ toast("Couldn't upload. Try again.") }
      btn.disabled = false; btn.textContent = "Submit for verification";
    };
  }
  async function status(){
    const box = $("#lStatus"); if(!await ready){ box.innerHTML = ""; return }
    try{ const d = await db.collection("licences").doc(uid).get();
      box.innerHTML = d.exists ? `<div class="card"><h3>Status: ${esc(d.data().status)}</h3><div class="meta">${esc(d.data().type)} · ${esc(d.data().no)}</div></div>` : "";
    }catch(e){ box.innerHTML = "" }
  }
  status();
});
})();
