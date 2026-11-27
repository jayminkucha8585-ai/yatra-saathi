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
<p class="note" style="text-align:center">Yatra Saathi · Made in Gujarat</p>`;
$("#meInstall").onclick = () => { const b = $("#install"); if(b.style.display === "inline-flex") b.click(); else toast("Use your browser menu › Add to Home screen") };
$("#meOut").onclick = async () => { if(!A || !u){ $("#auth").classList.add("on"); return }
await A.signOut(); store.set("profile", {}); YS.user = null; toast("Signed out") };
};
})();
