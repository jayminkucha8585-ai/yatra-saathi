// Yatra Saathi — online features core (Firebase): traveler connect, creator posts, group transport requests, licence verification
const CL = window.CL = {};
(() => {
const {$} = YS;
const CFG = {
  apiKey: "AIzaSyDtOeCfZfmVTqzlNRLTyJXkGRdeiYa7mFw",
  authDomain: "yatra-saathi-7b0d7.firebaseapp.com",
  projectId: "yatra-saathi-7b0d7",
  storageBucket: "yatra-saathi-7b0d7.firebasestorage.app",
  messagingSenderId: "720099608184",
  appId: "1:720099608184:web:eb4e9c63723cbb65944f8d"
};
let db = null, uid = null;
const ready = new Promise(res => {
  try{
    firebase.initializeApp(CFG); db = firebase.firestore();
    firebase.auth().onAuthStateChanged(u => { if(u){ uid = u.uid; res(true) } });
    firebase.auth().signInAnonymously().catch(() => res(false));
  }catch(e){ res(false) }
});
const now = () => firebase.firestore.FieldValue.serverTimestamp();
const offline = `<div class="empty">Online features need the internet. Please check your connection and try again.</div>`;
const val = id => $(id).value.trim();
const safeUrl = (u, hosts) => { try{ const x = new URL(u); return x.protocol === "https:" && hosts.some(h => x.hostname === h || x.hostname.endsWith("."+h)) ? x.href : "" }catch(e){ return "" } };
const safeImg = s => /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(s || "") ? s : "";

// shrink a photo so it fits in the free database (under ~500 KB)
function compress(file, max = 1100){
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => {
      const s = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement("canvas");
      c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(img.src);
      let q = .75, out = c.toDataURL("image/jpeg", q);
      while(out.length > 500000 && q > .3){ q -= .1; out = c.toDataURL("image/jpeg", q) }
      out.length > 700000 ? rej(new Error("too big")) : res(out);
    };
    img.onerror = () => rej(new Error("not an image"));
    img.src = URL.createObjectURL(file);
  });
}

CL.ready = ready; CL.db = () => db; CL.uid = () => uid; CL.now = now; CL.offline = offline; CL.val = val; CL.safeUrl = safeUrl; CL.safeImg = safeImg; CL.compress = compress;
CL.page = (id, fn) => { const orig = YS.renderers[id]; YS.renderers[id] = () => { orig && orig(); fn() } };
})();
