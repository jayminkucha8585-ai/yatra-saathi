(() => {
const {$, $$, esc, store, km, toast, show} = YS;
const once = {};
const page = (id, fn) => { YS.renderers[id] = () => { if(!once[id]){ once[id] = 1; fn($("#v-"+id)) } if(YS.refresh?.[id]) YS.refresh[id]() } };
const mapsLink = () => { const m = YS.me(); return `https://maps.google.com/?q=${m.lat.toFixed(5)},${m.lng.toFixed(5)}` };
YS.refresh = YS.refresh || {};
// ================= Translator (MyMemory, free) =================
const LANGS = [["en","English","en-IN"],["gu","Gujarati","gu-IN"],["hi","Hindi","hi-IN"],["mr","Marathi","mr-IN"],["ta","Tamil","ta-IN"],["te","Telugu","te-IN"],
  ["kn","Kannada","kn-IN"],["ml","Malayalam","ml-IN"],["bn","Bengali","bn-IN"],["pa","Punjabi","pa-IN"],["ur","Urdu","ur-IN"]];
const PHRASES = ["Where is the bus stand?","How much does this cost?","Please take me to this hotel.","Where can I find a toilet?","I need a doctor.","Is this water safe to drink?","Thank you very much!","Please help me."];
page("translate", el => {
  const opts = LANGS.map(l => `<option value="${l[0]}">${l[1]}</option>`).join("");
  el.innerHTML = `<div class="row"><select id="tFrom" style="flex:1">${opts}</select><button class="sec" id="tSwap" type="button" aria-label="Swap languages">⇄</button><select id="tTo" style="flex:1">${opts}</select></div>
    <textarea id="tIn" placeholder="Type or speak…"></textarea>
    <div class="row"><button class="pri" id="tGo" type="button">Translate</button><button class="sec" id="tMic" type="button">Speak</button></div>
    <div class="card"><div id="tOut" style="font-size:20px;min-height:30px"></div><div class="row"><button class="sec" id="tSay" type="button">Play aloud</button><button class="sec" id="tCopy" type="button">Copy</button></div></div>
    <h2>Quick phrases</h2><div id="tPh">${PHRASES.map(p => `<button class="tag" type="button" style="border:0;min-height:36px">${p}</button>`).join(" ")}</div>
    <p class="note">Translations from MyMemory need the internet. Check important details with a local.</p>`;
  $("#tFrom").value = "en"; $("#tTo").value = "gu";
  const go = async () => {
    const q = $("#tIn").value.trim(); if(!q) return;
    $("#tOut").textContent = "Translating…";
    try{
      const r = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(q.slice(0,450))}&langpair=${$("#tFrom").value}|${$("#tTo").value}`);
      const j = await r.json(); $("#tOut").textContent = j.responseData?.translatedText || "No translation found";
    }catch(e){ $("#tOut").textContent = "Couldn't translate. Check your internet." }
  };
  $("#tGo").onclick = go;
  $("#tSwap").onclick = () => { const a = $("#tFrom").value; $("#tFrom").value = $("#tTo").value; $("#tTo").value = a };
  $("#tPh").onclick = e => { const b = e.target.closest("button"); if(!b) return; $("#tFrom").value = "en"; $("#tIn").value = b.textContent; go() };
  const voice = code => LANGS.find(l => l[0] === code)[2];
  $("#tSay").onclick = () => { const t = $("#tOut").textContent; if(!t || !window.speechSynthesis) return;
    const u = new SpeechSynthesisUtterance(t); u.lang = voice($("#tTo").value); speechSynthesis.cancel(); speechSynthesis.speak(u) };
  $("#tCopy").onclick = async () => { try{ await navigator.clipboard.writeText($("#tOut").textContent); toast("Copied") }catch(e){ toast("Couldn't copy") } };
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if(!SR) $("#tMic").style.display = "none";
  else $("#tMic").onclick = () => { const r = new SR(); r.lang = voice($("#tFrom").value);
    r.onresult = e => { $("#tIn").value = e.results[0][0].transcript; go() }; r.onerror = () => toast("Couldn't hear you. Try again."); r.start(); toast("Listening…") };
});
})();
