// ---------- Profile tab ----------
(() => {
const {$, esc, store, toast} = YS;
const A = (typeof firebase !== "undefined" && firebase.apps && firebase.apps.length) ? firebase.auth() : null;
const ROWS = [["connect","Traveler profile","What other travelers see about you"],["licence","Driving licence","Upload for verification"],
["group","School & college trips","Group bus quotes and your requests"],["sos","Emergency contacts","People to alert in an SOS"],
["guide","Packing checklist","Trip guides by trip type"]];
YS.renderers.me = () => {
const box = $("#v-me"); if(!box) return;
const u = YS.user, name = store.get("profile", {}).name || (u && u.displayName) || "Traveler";
const pic = u && u.photoURL && /^https:\/\/[a-z0-9.-]+\.googleusercontent\.com\//.test(u.photoURL) ? u.photoURL : "";
box.innerHTML = `<div class="me-head">${pic ? `<img src="${esc(pic)}" alt="" referrerpolicy="no-referrer">` : `<span>${esc(name[0].toUpperCase())}</span>`}
<div><h2>${esc(name)}</h2><div class="meta">${esc(u ? u.email || "" : "Not signed in")}</div></div></div>
<div class="menu">${ROWS.map(r => `<button type="button" data-open="${r[0]}"><b>${r[1]}</b><span>${r[2]}</span><i aria-hidden="true">›</i></button>`).join("")}</div>
<div class="row"><button class="sec" id="meInstall" type="button" style="flex:1">Install app</button>
<button class="sec" id="meOut" type="button" style="flex:1">${u ? "Sign out" : "Sign in"}</button></div>
${u ? `<button class="sec" id="meDel" type="button" style="width:100%;color:#b3261e">Delete account</button>` : ""}
<p class="note" style="text-align:center"><a href="privacy.html" style="color:inherit">Privacy policy</a> · Yatra Saathi · Made in Gujarat</p>`;
$("#meInstall").onclick = () => { const b = $("#install"); if(b.style.display === "inline-flex") b.click(); else toast("Use your browser menu › Add to Home screen") };
$("#meOut").onclick = async () => { if(!A || !u){ $("#auth").classList.add("on"); return }
await A.signOut(); store.set("profile", {}); YS.user = null; toast("Signed out") };
const del = $("#meDel"); if(del) del.onclick = () => delAccount(u);
};
// delete the account and everything saved online for it (Play Store rule)
async function delAccount(u){
if(!confirm("Delete your Yatra Saathi account?\n\nYour profile, posts, group requests and licence details will be removed. This cannot be undone.")) return;
toast("Deleting…");
const db = window.CL && CL.db && CL.db(), id = u.uid, F = firebase.firestore;
if(db){
const quiet = p => p.catch(() => {});
for(const c of ["posts", "groupRequests"]){
const snap = await db.collection(c).where("uid", "==", id).get().catch(() => null);
if(snap) await Promise.all(snap.docs.map(d => quiet(d.ref.delete())));
}
await db.collection("profiles").doc(id).delete().catch(() => quiet(db.collection("profiles").doc(id).set({visible: false, name: "", bio: ""}, {merge: true})));
await quiet(db.collection("licences").doc(id).delete());
}
try{
await u.delete();
store.set("profile", {}); store.set("signedIn", false);
YS.user = null; toast("Your account has been deleted"); $("#auth").classList.add("on");
}catch(e){
if(e && e.code === "auth/requires-recent-login"){ alert("For safety, please sign out, sign in again, then tap Delete account once more."); }
else toast("Couldn't delete. Please check your internet and try again.");
}
}
})();
