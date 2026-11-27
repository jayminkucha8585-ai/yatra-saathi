(() => {
const {$, esc, store, km, toast} = YS;
const {now, offline, val, safeUrl, safeImg, compress, page} = CL;
let db, uid;
const ready = CL.ready.then(ok => { db = CL.db(); uid = CL.uid(); return ok });
const once = {};
// ================= Creator photo posts =================
page("creator", async () => {
const el = $("#creatorCloud"); if(!el || el.dataset.done) return; el.dataset.done = 1;
el.innerHTML = `<div class="card"><label>Photo<input id="poImg" type="file" accept="image/*"></label>
<label>Caption<textarea id="poCap" maxlength="300"></textarea></label>
<label>Video link (optional)<input id="poVid" placeholder="YouTube or Instagram link"></label>
<label class="check" style="border:0"><input type="checkbox" id="poHere"><span>Pin this photo on the map at my current spot (about 1 km accuracy)</span></label>
<div class="row"><button class="pri" id="poGo" type="button">Post</button></div>
<div class="meta">Photos are shrunk to save data. For videos, upload to YouTube or Instagram and paste the link.</div></div>
<div id="poFeed"><div class="empty">Loading posts…</div></div>`;
const feed = async () => {
const box = $("#poFeed");
if(!await ready){ box.innerHTML = offline; return }
try{
const snap = await db.collection("posts").orderBy("created","desc").limit(20).get();
YS.onPosts && YS.onPosts(snap.docs.map(d => { const x = d.data(); return {place: x.place, name: x.name, cap: x.cap, img: safeImg(x.img),
lat: typeof x.lat === "number" ? x.lat : null, lng: typeof x.lng === "number" ? x.lng : null} }));
box.innerHTML = snap.empty ? `<div class="empty">No posts yet. Be the first!</div>` : snap.docs.map(d => { const p = d.data(), img = safeImg(p.img),
vid = safeUrl(p.vid, ["youtube.com","youtu.be","instagram.com"]), pl = PLACES.find(x => x.id === p.place)?.n || "";
return `<div class="card post"><h3>${esc(p.name || "Traveler")}</h3><div class="meta">${esc(pl)}</div>
${img ? `<img alt="${esc(p.cap || "Travel photo")}" src="${img}" loading="lazy">` : ""}${p.cap ? `<p>${esc(p.cap)}</p>` : ""}
<div class="row" style="margin:0">${vid ? `<a class="btn sec" href="${esc(vid)}" target="_blank" rel="noopener">Watch video</a>` : ""}${p.uid === uid ? `<button class="sec" type="button" data-delpost="${d.id}">Delete</button>` : ""}</div></div>` }).join("");
}catch(e){ box.innerHTML = offline }
};
$("#poFeed").onclick = async e => { const b = e.target.closest("[data-delpost]"); if(!b) return;
try{ await db.collection("posts").doc(b.dataset.delpost).delete(); feed() }catch(err){ toast("Couldn't delete") } };
$("#poGo").onclick = async () => {
const f = $("#poImg").files[0], cap = val("#poCap"), vidRaw = val("#poVid"), vid = safeUrl(vidRaw, ["youtube.com","youtu.be","instagram.com"]);
if(!f){ toast("Choose a photo"); return }
if(vidRaw && !vid){ toast("Video link must be a YouTube or Instagram https link"); return }
if(!await ready){ toast("You're offline"); return }
const btn = $("#poGo"); btn.disabled = true; btn.textContent = "Posting…";
try{
const img = await compress(f);
const m = YS.me(), here = $("#poHere").checked && m.live ? {lat: Math.round(m.lat*100)/100, lng: Math.round(m.lng*100)/100} : {};
await db.collection("posts").add({uid, name: store.get("profile", {}).name || "Traveler", place: $("#crAt").value, cap, vid, img, ...here, created: now()});
$("#poImg").value = ""; $("#poCap").value = ""; $("#poVid").value = ""; toast("Posted!"); feed();
}catch(e){ toast(e.message === "too big" ? "Photo is too large" : "Couldn't post. Try again.") }
btn.disabled = false; btn.textContent = "Post";
};
feed();
});
})();
