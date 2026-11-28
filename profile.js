// ---------- New profile page + Light / Dark / Auto theme ----------
(() => {
const {$, esc, store, toast} = YS;

// ===== Theme: auto (follow phone), light, dark =====
const orig = new WeakMap();
const applyTheme = () => {
  const mode = store.get("theme", "auto");
  for(const sh of document.styleSheets){
    let rules; try{ rules = sh.cssRules }catch(e){ continue }
    for(const r of rules){
      if(!r.media || !r.conditionText && !r.media.mediaText) continue;
      if(!orig.has(r)){ if(!/prefers-color-scheme/.test(r.media.mediaText)) continue; orig.set(r, r.media.mediaText) }
      const o = orig.get(r), dark = /dark/.test(o);
      r.media.mediaText = mode === "auto" ? o : (mode === "dark") === dark ? "all" : "not all";
    }
  }
  const isDark = mode === "dark" || mode === "auto" && matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.style.colorScheme = isDark ? "dark" : "light";
  document.documentElement.classList.toggle("ys-dark", isDark);
  const m = document.querySelector('meta[name="theme-color"]'); if(m) m.content = isDark ? "#0E1518" : "#0F5E63";
};
YS.setTheme = t => { store.set("theme", t); applyTheme() };
applyTheme();
addEventListener("load", applyTheme);
new MutationObserver(applyTheme).observe(document.head, {childList: true});
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", applyTheme);

// ===== Profile =====
const ROLES = [["photo","📷","Photographer"],["creator","🎬","Content Creator"],["explorer","🧭","Explorer"],["trekker","🥾","Trekker"],
  ["foodie","🍛","Foodie"],["pilgrim","🛕","Pilgrim"],["biker","🏍️","Biker"],["solo","🎒","Solo traveller"],["family","👨‍👩‍👧","Family traveller"],["student","🎓","Student"]];
const INTERESTS = ["Beaches","Mountains","Temples","Forts & palaces","Wildlife","Food","Photography","Trekking","Road trips","Festivals","Camping","Handicrafts"];
const css = document.createElement("style");
css.textContent = `#v-me .pf-top{display:flex;gap:16px;align-items:center;margin-top:4px}
.pf-av{width:92px;height:92px;border-radius:50%;flex:none;position:relative;border:3px solid var(--sea);box-shadow:0 0 0 4px var(--soft);background:linear-gradient(160deg,#F4C77A,#B8643A 60%,#0F5E63);display:grid;place-items:center;color:#fff;font:800 38px "Baloo Bhai 2",sans-serif;padding:0;min-height:0}
.pf-av img{width:100%;height:100%;border-radius:50%;object-fit:cover}
.pf-pen{position:absolute;right:-3px;bottom:-3px;width:30px;height:30px;border-radius:50%;background:var(--sea);color:#fff;display:grid;place-items:center;font-size:14px;border:2px solid var(--bg)}
.pf-top h2{margin:0;font-size:22px;line-height:1.2}.pf-city{color:var(--mute);font-size:14px;margin:2px 0 8px}
.pf-st{display:flex;gap:16px;text-align:center}.pf-st b{display:block;font-size:19px}.pf-st span{font-size:12px;color:var(--mute)}
.pf-chips{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0 6px}.pf-chip{padding:7px 13px;border-radius:99px;font-size:13px;font-weight:600;background:var(--soft);color:var(--sea)}
.pf-chip:nth-child(3n+2){background:rgba(184,100,58,.15);color:var(--dune)}.pf-chip:nth-child(3n){background:rgba(47,93,140,.15);color:var(--indigo)}
.pf-bio{color:var(--mute);font-size:14px;margin:6px 2px 14px;white-space:pre-wrap}
.pf-btns{display:flex;gap:10px}.pf-btns button{min-height:46px;border-radius:16px;font-weight:700}.pf-btns .pri{flex:2}.pf-btns .sec{flex:1}
.pf-row3{display:flex;margin:14px 0;padding:14px 0!important;border-radius:22px}.pf-row3 button{flex:1;background:none!important;border:0!important;box-shadow:none!important;border-right:1px solid var(--line)!important;border-radius:0;flex-direction:column;color:var(--ink);padding:0 4px;min-height:0;gap:2px}
.pf-row3 button:last-child{border-right:0!important}.pf-row3 i{font-style:normal;font-size:20px}.pf-row3 b{font-size:18px}.pf-row3 span{font-size:12px;color:var(--mute);font-weight:400}
.pf-ver{display:flex;gap:12px;padding:14px;border-radius:22px;margin:0 0 14px}.pf-ver .sh{width:46px;height:46px;border-radius:50%;background:var(--soft);display:grid;place-items:center;font-size:22px;flex:none}
.pf-ver h3{margin:0 0 4px;font-size:16px}.pf-ver p{margin:0 0 10px;font-size:13px;color:var(--mute)}.pf-ver button{width:100%}
.pf-pills{display:flex;gap:10px;flex-wrap:wrap;margin:0 0 6px}.pf-pills em{font-style:normal;background:var(--sea);color:#fff;border-radius:99px;padding:1px 8px;margin-left:6px;font-size:12px}
.pf-list{display:none;flex-wrap:wrap;gap:6px;margin:8px 0}.pf-list.on{display:flex}.pf-list span{padding:6px 11px;border-radius:99px;font-size:13px;background:var(--soft)}
.pf-h{margin:18px 2px 2px;font-size:19px}.pf-sub{color:var(--mute);font-size:13px;margin:0 2px 10px}
.pf-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:4px}.pf-grid button{aspect-ratio:1;padding:0;border-radius:10px;overflow:hidden;min-height:0;background:var(--soft)}
.pf-grid img{width:100%;height:100%;object-fit:cover;display:block}
.pf-theme{display:flex;gap:6px;margin:14px 0}.pf-theme button{flex:1}.pf-theme button[aria-pressed=true]{background:var(--sea)!important;color:#fff!important}
.pf-pick{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0 12px}.pf-pick button{min-height:0;padding:7px 12px;border-radius:99px;font-size:13px;font-weight:600}
.pf-pick button[aria-pressed=true]{background:var(--sea)!important;color:#fff!important}
#pfSheet h2{margin:0 0 10px}#pfSheet label{display:block;margin:8px 0}#pfSheet b.t{display:block;margin-top:10px}
.pf-big img{width:100%;border-radius:16px;display:block}`;
document.head.appendChild(css);

document.body.insertAdjacentHTML("beforeend", `<div class="sheet" id="pfSheet"><div id="pfSheetIn"></div></div>`);
const sheet = $("#pfSheet"), sheetIn = $("#pfSheetIn");
const openSheet = html => { sheetIn.innerHTML = html; sheet.classList.add("on") };
const closeSheet = () => sheet.classList.remove("on");
sheet.addEventListener("click", e => { if(e.target === sheet || e.target.closest("[data-pfclose]")) closeSheet() });

// the Traveler connect form saves only its own fields: keep roles, interests and places; clear the photo on sign-out
const keep = ["roles", "interests", "want"], setPrev = store.set;
store.set = function(k, v){
  if(k === "profile" && v && typeof v === "object"){
    if(!Object.keys(v).length) setPrev.call(store, "myPic", "");
    else { const old = store.get("profile", {}); keep.forEach(x => { if(v[x] === undefined && old[x] !== undefined) v = {...v, [x]: old[x]} }) }
  }
  return setPrev.call(store, k, v);
};
const prof = () => store.get("profile", {});
const pic = () => { const p = store.get("myPic", ""); if(p) return p;
  const u = YS.user; return u && u.photoURL && /^https:\/\/[a-z0-9.-]+\.googleusercontent\.com\//.test(u.photoURL) ? u.photoURL : "" };
const ready = () => window.CL && CL.ready ? CL.ready : Promise.resolve(false);
const db = () => window.CL && CL.db && CL.db(), uid = () => window.CL && CL.uid && CL.uid();
const place = id => (typeof PLACES !== "undefined" ? PLACES : []).find(x => x.id === id);
const journalCount = () => new Promise(res => { try{ const q = indexedDB.open("ys-journal", 1);
  q.onupgradeneeded = () => q.result.createObjectStore("e", {keyPath: "id"});
  q.onsuccess = () => { try{ const c = q.result.transaction("e").objectStore("e").count(); c.onsuccess = () => res(c.result); c.onerror = () => res(0) }catch(e){ res(0) } };
  q.onerror = () => res(0) }catch(e){ res(0) } });
let myPosts = [];

const origMe = YS.renderers.me;
YS.renderers.me = () => {
  origMe && origMe();
  const box = $("#v-me"); if(!box) return;
  const old = box.querySelector(".me-head"); if(old) old.remove();
  const p = prof(), u = YS.user, name = p.name || (u && u.displayName) || "Traveler", ph = pic();
  const visited = store.get("visited", []), states = new Set(visited.map(v => v.st).filter(s => s && s !== "India")).size;
  const roles = ROLES.filter(r => (p.roles || []).includes(r[0])), ints = p.interests || [], want = (p.want || []).map(place).filter(Boolean);
  const theme = store.get("theme", "auto");
  box.insertAdjacentHTML("afterbegin", `<div id="pfBox">
    <div class="pf-top"><button class="pf-av" type="button" id="pfPic" aria-label="Change profile photo">${ph ? `<img src="${esc(ph)}" alt="" referrerpolicy="no-referrer">` : esc(name[0].toUpperCase())}<span class="pf-pen">✎</span></button>
      <div style="min-width:0"><h2>${esc(name)}</h2><div class="pf-city">📍 ${esc(p.from || "Add your city")}</div>
      <div class="pf-st"><div><b id="pfPosts">–</b><span>Posts</span></div><div><b>${visited.length}</b><span>Places</span></div><div><b>${states}</b><span>States</span></div></div></div></div>
    ${roles.length ? `<div class="pf-chips">${roles.map(r => `<span class="pf-chip">${r[1]} ${r[2]}</span>`).join("")}</div>` : `<div style="height:10px"></div>`}
    <div class="pf-bio">${esc(p.bio || "Tap Edit profile to add a short bio.")}</div>
    <div class="pf-btns"><button class="pri" type="button" id="pfEdit">Edit profile</button><button class="sec" type="button" id="pfShare">⤴ Share</button></div>
    <div class="pf-row3 card"><button type="button" data-open="connect"><i>🧳</i><b id="pfGo">–</b><span>Going with me</span></button>
      <button type="button" data-open="tips"><i>💬</i><b id="pfTips">–</b><span>My tips</span></button>
      <button type="button" data-open="journal"><i>📓</i><b id="pfJr">–</b><span>Journal</span></button></div>
    <div id="pfVer"></div>
    <div class="pf-pills"><button class="pill" type="button" data-pflist="int">☆ Interests<em>${ints.length}</em></button><button class="pill" type="button" data-pflist="want">📍 Want to visit<em>${want.length}</em></button></div>
    <div class="pf-list" id="pfL-int">${ints.length ? ints.map(i => `<span>${esc(i)}</span>`).join("") : `<span>None yet. Add them in Edit profile.</span>`}</div>
    <div class="pf-list" id="pfL-want">${want.length ? want.map(w => `<span>${esc(w.n)}</span>`).join("") : `<span>None yet. Add them in Edit profile.</span>`}</div>
    <h2 class="pf-h">Theme</h2>
    <div class="pf-theme">${[["auto","📱 Auto"],["light","☀️ Light"],["dark","🌙 Dark"]].map(t => `<button class="sec" type="button" data-theme="${t[0]}" aria-pressed="${theme === t[0]}">${t[1]}</button>`).join("")}</div>
    <h2 class="pf-h">Posts</h2><div class="pf-sub" id="pfPostSub">Loading…</div><div class="pf-grid" id="pfGrid"></div>
    <h2 class="pf-h">Settings</h2></div>`);
  fill();
};

async function fill(){
  journalCount().then(n => { const e = $("#pfJr"); if(e) e.textContent = n });
  const p = prof(), set = (id, v) => { const e = $(id); if(e) e.textContent = v };
  if(!await ready() || !db()){ set("#pfPosts", 0); set("#pfGo", 0); set("#pfTips", 0); $("#pfPostSub") && ($("#pfPostSub").textContent = "Sign in and connect to the internet to see your posts."); return }
  const d = db(), me = uid();
  d.collection("posts").where("uid", "==", me).limit(60).get().then(s => {
    myPosts = s.docs.map(x => ({id: x.id, ...x.data()})).sort((a, b) => ((b.created && b.created.seconds) || 0) - ((a.created && a.created.seconds) || 0));
    set("#pfPosts", myPosts.length);
    const sub = $("#pfPostSub"), g = $("#pfGrid"); if(!g) return;
    sub.textContent = myPosts.length ? myPosts.length + (myPosts.length === 1 ? " post" : " posts") : "No posts yet.";
    g.innerHTML = myPosts.map((x, i) => { const img = CL.safeImg(x.img); return `<button type="button" data-pfpost="${i}" aria-label="Open post">${img ? `<img src="${img}" alt="" loading="lazy">` : ""}</button>` }).join("")
      + (myPosts.length ? "" : `<button type="button" data-open="creator" style="font-size:28px;color:var(--sea)" aria-label="Add a post">+</button>`);
  }).catch(() => { set("#pfPosts", 0); const sub = $("#pfPostSub"); if(sub) sub.textContent = "Couldn't load your posts." });
  d.collection("tips").where("uid", "==", me).limit(200).get().then(s => set("#pfTips", s.size)).catch(() => set("#pfTips", 0));
  if(p.to) d.collection("profiles").where("to", "==", p.to).limit(200).get()
    .then(s => set("#pfGo", s.docs.filter(x => x.id !== me && x.data().visible).length)).catch(() => set("#pfGo", 0));
  else set("#pfGo", 0);
  d.collection("licences").doc(me).get().then(s => {
    const st = s.exists ? s.data().status : "", v = $("#pfVer"); if(!v) return;
    v.innerHTML = st === "verified" || st === "approved" ? `<div class="pf-ver card"><div class="sh">✅</div><div><h3>Verified traveller</h3><p style="margin:0">Your driving licence has been checked.</p></div></div>`
      : `<div class="pf-ver card"><div class="sh">🛡️</div><div><h3>${st ? "Verification pending" : "Get the verified badge"}</h3>
        <p>${st ? "We're checking your driving licence." : "Upload your driving licence. Verified travellers build trust faster."}</p>
        ${st ? "" : `<button class="sec" type="button" data-open="licence">Verify now</button>`}</div></div>`;
  }).catch(() => {});
}

// save profile changes on the phone and online
async function save(changes){
  const p = {...prof(), ...changes}; store.set("profile", p);
  if(await ready() && db()) try{
    const on = {name: p.name || "", from: p.from || "", bio: p.bio || "", roles: p.roles || [], interests: p.interests || [], want: p.want || [], uid: uid(), updated: CL.now()};
    if(changes.pic !== undefined) on.pic = changes.pic;
    await db().collection("profiles").doc(uid()).set(on, {merge: true});
  }catch(e){}
}

const editSheet = () => {
  const p = prof(), r = new Set(p.roles || []), it = new Set(p.interests || []), w = new Set(p.want || []);
  openSheet(`<h2>Edit profile</h2>
    <label>Name<input id="pfN" maxlength="40" value="${esc(p.name || (YS.user && YS.user.displayName) || "")}"></label>
    <label>City<input id="pfC" maxlength="40" placeholder="Vadodara" value="${esc(p.from || "")}"></label>
    <label>Bio<textarea id="pfB" maxlength="200" placeholder="I want to see every corner of Gujarat.">${esc(p.bio || "")}</textarea></label>
    <b class="t">I am a… (pick up to 3)</b><div class="pf-pick" id="pfR">${ROLES.map(x => `<button class="sec" type="button" data-v="${x[0]}" aria-pressed="${r.has(x[0])}">${x[1]} ${x[2]}</button>`).join("")}</div>
    <b class="t">Interests</b><div class="pf-pick" id="pfI">${INTERESTS.map(x => `<button class="sec" type="button" data-v="${esc(x)}" aria-pressed="${it.has(x)}">${esc(x)}</button>`).join("")}</div>
    <b class="t">Want to visit</b><div class="row"><select id="pfW">${YS.placeOptions()}</select><button class="sec" type="button" id="pfWAdd">Add</button></div>
    <div class="pf-pick" id="pfWL"></div>
    <div class="row"><button class="pri" type="button" id="pfSave" style="flex:1">Save</button><button class="sec" type="button" data-pfclose style="flex:1">Cancel</button></div>`);
  const drawW = () => { $("#pfWL").innerHTML = [...w].map(id => place(id)).filter(Boolean).map(x => `<button class="sec" type="button" data-w="${x.id}" aria-pressed="true">${esc(x.n)} ✕</button>`).join("") };
  drawW();
  $("#pfWAdd").onclick = () => { w.add($("#pfW").value); drawW() };
  $("#pfWL").onclick = e => { const b = e.target.closest("[data-w]"); if(b){ w.delete(b.dataset.w); drawW() } };
  const tog = (box, set, max) => box.onclick = e => { const b = e.target.closest("[data-v]"); if(!b) return; const v = b.dataset.v;
    if(set.has(v)) set.delete(v); else { if(max && set.size >= max) return toast("Pick up to " + max); set.add(v) }
    b.setAttribute("aria-pressed", set.has(v)) };
  tog($("#pfR"), r, 3); tog($("#pfI"), it, 0);
  $("#pfSave").onclick = async () => {
    const name = $("#pfN").value.trim(); if(!name) return toast("Add your name");
    await save({name, from: $("#pfC").value.trim(), bio: $("#pfB").value.trim(), roles: [...r], interests: [...it], want: [...w]});
    closeSheet(); toast("Profile saved"); YS.renderers.me();
  };
};

const pickPhoto = () => { const f = document.createElement("input"); f.type = "file"; f.accept = "image/*";
  f.onchange = async () => { const file = f.files[0]; if(!file) return;
    try{ const img = await CL.compress(file, 320); store.set("myPic", img); await save({pic: img}); toast("Photo updated"); YS.renderers.me() }
    catch(e){ toast("Couldn't use that photo") } };
  f.click() };

const share = async () => { const p = prof(), name = p.name || "Traveler";
  const t = `${name} is on Yatra Saathi${p.from ? " from " + p.from : ""}. ${p.bio ? p.bio + " " : ""}Plan your trip too: ${location.origin + location.pathname}`;
  try{ if(navigator.share) return await navigator.share({text: t}) }catch(e){ return }
  window.open("https://wa.me/?text=" + encodeURIComponent(t), "_blank", "noopener") };

const openPost = i => { const x = myPosts[i]; if(!x) return; const img = CL.safeImg(x.img), pl = place(x.place);
  openSheet(`<div class="pf-big">${img ? `<img src="${img}" alt="">` : ""}</div>${pl ? `<div class="meta" style="margin-top:8px">📍 ${esc(pl.n)}</div>` : ""}
    ${x.cap ? `<p>${esc(x.cap)}</p>` : ""}<div class="row"><button class="sec" type="button" id="pfDel" style="flex:1;color:#b3261e">Delete post</button><button class="sec" type="button" data-pfclose style="flex:1">Close</button></div>`);
  $("#pfDel").onclick = async () => { if(!confirm("Delete this post?")) return;
    try{ await db().collection("posts").doc(x.id).delete(); closeSheet(); toast("Post deleted"); YS.renderers.me() }catch(e){ toast("Couldn't delete") } } };

document.addEventListener("click", e => {
  const t = e.target;
  if(t.closest("#pfEdit")) return editSheet();
  if(t.closest("#pfPic")) return pickPhoto();
  if(t.closest("#pfShare")) return share();
  const th = t.closest("[data-theme]"); if(th){ YS.setTheme(th.dataset.theme);
    document.querySelectorAll("[data-theme]").forEach(b => b.setAttribute("aria-pressed", b === th)); return toast(th.textContent.trim() + " theme") }
  const l = t.closest("[data-pflist]"); if(l){ const el = $("#pfL-" + l.dataset.pflist); const on = !el.classList.contains("on");
    document.querySelectorAll(".pf-list").forEach(x => x.classList.remove("on")); el.classList.toggle("on", on); return }
  const pp = t.closest("[data-pfpost]"); if(pp) return openPost(+pp.dataset.pfpost);
});
})();
