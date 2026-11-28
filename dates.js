// ---------- Show every date as dd/mm/yyyy (date boxes and dates written in text) ----------
(() => {
const pad = n => String(n).padStart(2, "0");
const dmy = iso => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || ""); return m ? `${m[3]}/${m[2]}/${m[1]}` : "" };
const css = document.createElement("style");
css.textContent = `.ysd-wrap{position:relative;display:block;min-width:0}
.ysd-wrap>input[type=date]{width:100%;box-sizing:border-box}
.ysd-wrap>input[type=date]::-webkit-datetime-edit{opacity:0}
.ysd-txt{position:absolute;display:flex;align-items:center;pointer-events:none;color:var(--ink);font:inherit;white-space:nowrap}
.ysd-txt.empty{color:var(--mute)}`;
document.head.appendChild(css);

const draw = inp => { const t = inp._ysd; if(!t) return; const v = dmy(inp.value), cs = getComputedStyle(inp);
  t.style.left = inp.offsetLeft + parseFloat(cs.paddingLeft) + parseFloat(cs.borderLeftWidth) + "px";
  t.style.top = inp.offsetTop + "px"; t.style.height = inp.offsetHeight + "px";
  t.textContent = v || "dd/mm/yyyy"; t.classList.toggle("empty", !v) };
const setup = inp => {
  if(inp._ysd || inp.closest(".ysd-wrap")) return;
  const cs = getComputedStyle(inp), w = document.createElement("span");
  w.className = "ysd-wrap"; w.style.flex = cs.flex;
  if(inp.style.width){ w.style.width = inp.style.width; inp.style.width = "" }
  inp.parentNode.insertBefore(w, inp); w.appendChild(inp);
  const t = document.createElement("span"); t.className = "ysd-txt notranslate"; t.setAttribute("aria-hidden", "true");
  t.style.fontSize = cs.fontSize; t.style.fontWeight = cs.fontWeight;
  w.appendChild(t); inp._ysd = t;
  inp.addEventListener("input", () => draw(inp)); inp.addEventListener("change", () => draw(inp));
  draw(inp); requestAnimationFrame(() => draw(inp));
};
addEventListener("resize", () => document.querySelectorAll("input[type=date]").forEach(draw));
document.addEventListener("click", e => { if(e.target.closest("[data-open],[data-v],nav button")) setTimeout(() => document.querySelectorAll("input[type=date]").forEach(draw), 120) });
// redraw when code changes a date box's value
const d = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value");
Object.defineProperty(HTMLInputElement.prototype, "value", {configurable: true, enumerable: d.enumerable,
  get(){ return d.get.call(this) }, set(v){ d.set.call(this, v); if(this._ysd) draw(this) }});

// dates written as 2026-11-29 in text become 29/11/2026
const ISO = /\b(\d{4})-(\d{2})-(\d{2})\b/g;
const SKIP = "script,style,textarea,input,select,option,code,.ysd-txt";
const fixText = root => {
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for(let n = w.nextNode(); n; n = w.nextNode()){
    if(!ISO.test(n.nodeValue)) continue; ISO.lastIndex = 0;
    const p = n.parentElement; if(!p || p.closest(SKIP)) continue;
    n.nodeValue = n.nodeValue.replace(ISO, (s, y, m, dd) => `${dd}/${m}/${y}`);
  }
};
const scan = root => {
  if(root.nodeType === 3){ if(root.parentElement) fixText(root.parentElement); return }
  if(root.nodeType !== 1) return;
  (root.matches("input[type=date]") ? [root] : root.querySelectorAll("input[type=date]")).forEach(setup);
  fixText(root);
};
let pend = new Set(), t = null;
new MutationObserver(ms => { ms.forEach(m => m.type === "characterData" ? pend.add(m.target) : m.addedNodes.forEach(n => pend.add(n)));
  clearTimeout(t); t = setTimeout(() => { pend.forEach(n => n.isConnected && scan(n)); pend.clear() }, 60) })
  .observe(document.body, {childList: true, subtree: true, characterData: true});
scan(document.body);
YS.dmy = dmy;
})();
