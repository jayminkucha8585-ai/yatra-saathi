// ---------- Sign-up page (Google + email) ----------
(() => {
const {$, $$, esc, store, toast} = YS;
const el = $("#auth");
const A = (typeof firebase !== "undefined" && firebase.apps && firebase.apps.length) ? firebase.auth() : null;
const G = `<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.6 5.4 2.6 13.2l7.8 6C12.3 13.5 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4 7.1-10 7.1-17.5z"/><path fill="#FBBC05" d="M10.4 28.8c-.5-1.5-.8-3.1-.8-4.8s.3-3.3.8-4.8l-7.8-6C.9 16.5 0 20.1 0 24s.9 7.5 2.6 10.8l7.8-6z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.7-4-13.6-9.7l-7.8 6C6.6 42.6 14.6 48 24 48z"/></svg>`;
el.innerHTML = `<div class="au-card">
<div class="au-brand"><h1>Yatra Saathi</h1><p>Nature loves to make your trips</p></div>
<p class="au-wait" id="auWait">Loading…</p>
<div id="auBody" hidden>
<h2 id="auH">Create your account</h2>
<p class="meta">Plan trips, meet travelers and stay safe across Gujarat.</p>
<button class="au-g" id="auG" type="button">${G}Continue with Google</button>
<div class="au-or"><span>or use email</span></div>
<form id="auF" novalidate>
<label id="auNameL">Your name<input id="auName" autocomplete="name" maxlength="40"></label>
<label>Email<input id="auEmail" type="email" autocomplete="email"></label>
<label>Password<input id="auPw" type="password" autocomplete="new-password" minlength="6" placeholder="At least 6 characters"></label>
<button class="pri au-go" id="auGo" type="submit">Sign up</button>
</form>
<button class="au-link" id="auForgot" type="button" hidden>Forgot password?</button>
<p class="au-sw"><span id="auSwT">Already have an account?</span> <button class="au-link" id="auSw" type="button">Log in</button></p>
<button class="au-link" id="auSkip" type="button" hidden>Continue without internet</button>
</div></div>`;

let up = true;
const setMode = m => { up = m;
$("#auH").textContent = up ? "Create your account" : "Welcome back"; $("#auNameL").hidden = !up;
$("#auGo").textContent = up ? "Sign up" : "Log in"; $("#auPw").autocomplete = up ? "new-password" : "current-password";
$("#auSwT").textContent = up ? "Already have an account?" : "New to Yatra Saathi?"; $("#auSw").textContent = up ? "Log in" : "Sign up";
$("#auForgot").hidden = up };
$("#auSw").onclick = () => setMode(!up);
const busy = b => $$("#auth button").forEach(x => x.disabled = b);
const MSG = {"auth/email-already-in-use":"This email already has an account. Tap Log in.","auth/invalid-email":"Check the email address.",
"auth/weak-password":"Password needs at least 6 characters.","auth/wrong-password":"Wrong email or password.","auth/invalid-credential":"Wrong email or password.",
"auth/invalid-login-credentials":"Wrong email or password.","auth/user-not-found":"No account with this email. Tap Sign up.",
"auth/popup-closed-by-user":"Google sign-in was closed.","auth/network-request-failed":"No internet connection.",
"auth/too-many-requests":"Too many tries. Wait a minute and try again.","auth/unauthorized-domain":"Sign-in isn't set up for this website yet.",
"auth/operation-not-allowed":"This sign-in method isn't turned on yet."};
const err = e => toast(MSG[e && e.code] || "Couldn't sign in. Try again.");

function check(){
const u = A && A.currentUser;
if(u && !u.isAnonymous){
const pr = store.get("profile", {});
if(!pr.name){ pr.name = u.displayName || (u.email || "Traveler").split("@")[0]; store.set("profile", pr) }
YS.user = u; el.classList.remove("on"); YS.renderers.me && YS.renderers.me();
} else { el.classList.add("on"); $("#auWait").hidden = true; $("#auBody").hidden = false }
}
YS.signedIn = () => !!(A && A.currentUser && !A.currentUser.isAnonymous);

if(!A){ $("#auWait").hidden = true; $("#auBody").hidden = false; $("#auSkip").hidden = false; toast("You're offline. Sign up when you're back online.") }
else {
A.onAuthStateChanged(check);
A.getRedirectResult().then(check).catch(err);
setTimeout(() => { if(el.classList.contains("on") && !navigator.onLine) $("#auSkip").hidden = false }, 4000);
}
$("#auSkip").onclick = () => el.classList.remove("on");

$("#auG").onclick = async () => {
const p = new firebase.auth.GoogleAuthProvider(), u = A.currentUser; busy(true);
try{ if(u && u.isAnonymous) await u.linkWithPopup(p); else await A.signInWithPopup(p); check() }
catch(e){
if(e.credential && /already-in-use/.test(e.code)){ try{ await A.signInWithCredential(e.credential); check() }catch(x){ err(x) } }
else if(/popup-blocked|not-supported|cancelled-popup/.test(e.code)){ A.signInWithRedirect(p); return }
else err(e);
}
busy(false);
};
$("#auF").onsubmit = async e => {
e.preventDefault();
const email = $("#auEmail").value.trim(), pw = $("#auPw").value, name = $("#auName").value.trim();
if(up && !name){ toast("Add your name"); return }
if(!email || pw.length < 6){ toast("Enter your email and a 6+ character password"); return }
busy(true);
try{
if(up){
store.set("profile", {...store.get("profile", {}), name});
const u = A.currentUser;
if(u && u.isAnonymous) await u.linkWithCredential(firebase.auth.EmailAuthProvider.credential(email, pw));
else await A.createUserWithEmailAndPassword(email, pw);
await A.currentUser.updateProfile({displayName: name});
} else await A.signInWithEmailAndPassword(email, pw);
check();
}catch(x){ err(x) }
busy(false);
};
$("#auForgot").onclick = async () => {
const email = $("#auEmail").value.trim(); if(!email){ toast("Type your email first"); return }
try{ await A.sendPasswordResetEmail(email); toast("Password reset link sent to your email") }catch(x){ err(x) }
};
})();
