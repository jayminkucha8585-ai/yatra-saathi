// ---------- Video script writer: English, Hindi, Gujarati, Hinglish ----------
(() => {
const L = {...YS.SL,
  en: {hook: n => `Have you seen ${n} like this? Watch till the end!`, go: n => `Today I'm taking you to ${n}.`,
    type: {heritage:"Centuries of history carved in stone.", wildlife:"Wild, raw and full of life.", pilgrimage:"A place of deep faith and peace.", beach:"Sea breeze, soft sand and golden sunsets.", desert:"Endless land, open sky and silence.", hill:"Clouds, forests and cool fresh air."},
    cta:"Save this and tag your travel buddy!", reach:"Show the journey and the cheapest way to reach (see the Routes tab in Yatra Saathi).", stay:"Show one budget and one premium stay, and a local dish.",
    tips:"Share 3 tips: timing, what to carry, local rules.", outro:"Ask viewers where you should go next, and ask them to subscribe.",
    k:["HOOK","SCENE","Shot","Voiceover","Text on screen","CTA","Caption","Best time","TITLE","INTRO","Getting there","The place","Stay & food","Tips","OUTRO","Travel guide"]},
  hinglish: {hook: n => `${n} aise dekha hai kya? Video end tak dekhna!`, go: n => `Aaj hum chal rahe hain ${n}.`,
    type: {heritage:"Patthar mein likhi sadiyon purani kahani.", wildlife:"Jungle, janwar aur full thrill.", pilgrimage:"Shraddha aur shanti wali jagah.", beach:"Sea breeze, ret aur golden sunset.", desert:"Door tak khula maidan, khula aasmaan aur silence.", hill:"Baadal, jungle aur thandi fresh hawa."},
    cta:"Save karo aur apne travel buddy ko tag karo!", reach:"Journey dikhao aur pahunchne ka sabse sasta tareeka batao (Yatra Saathi ka Routes tab dekho).", stay:"Ek budget aur ek premium stay, aur ek local dish dikhao.",
    tips:"3 tips: sahi time, kya saath rakhna, local rules.", outro:"Viewers se poocho next kahan jaayein, aur subscribe karne ko bolo.",
    k:["HOOK","SCENE","Shot","Voiceover","Text on screen","CTA","Caption","Best time","TITLE","INTRO","Kaise pahunchein","Jagah","Stay & khana","Tips","OUTRO","Travel guide"]}
};
YS.LANGS = [["en","English"],["hi","हिंदी (Hindi)"],["gu","ગુજરાતી (Gujarati)"],["hinglish","Hinglish"]];
YS.FORMATS = [["reel","Instagram Reel (30 sec)"],["short","YouTube Short (60 sec)"],["vlog","Vlog (5–8 min)"],["caption","Photo caption"]];
YS.script = (p, f, lang) => {
  const t = L[lang] || L.en, k = t.k, s = p.shoot || [];
  const n = lang === "gu" ? (YS.SNAMES[p.id] || [])[0] || p.n : lang === "hi" ? (YS.SNAMES[p.id] || [])[1] || p.n : p.n;
  const line = t.type[p.type] || t.type.heritage;
  const tags = ["#"+p.n.replace(/[^A-Za-z]/g,""), "#Gujarat", "#GujaratTourism", "#"+p.c.replace(/\s/g,""), "#TravelIndia", "#YatraSaathi"].join(" ");
  if(f === "caption") return `${n} ✨\n${line}\n\n${k[7]}: ${p.best}\n📍 ${n}, Gujarat\n\n${tags}`;
  if(f === "vlog") return `${k[8]}: ${n} | ${k[15]}\n\n${k[9]} (0:00): ${t.hook(n)} ${t.go(n)}\n\n1. ${k[10]} (0:30): ${t.reach}\n\n2. ${k[11]} (2:00): ${line}\n${k[2]}: ${s.join("; ")}\n\n3. ${k[12]} (4:00): ${t.stay}\n\n4. ${k[13]} (5:30): ${k[7]} – ${p.best}. ${t.tips}\n\n${k[14]} (7:00): ${t.outro}\n\n${tags}`;
  const sec = f === "reel" ? ["0–3s","3–12s","12–24s","24–30s"] : ["0–5s","5–25s","25–50s","50–60s"];
  return `${k[0]} (${sec[0]}): ${t.hook(n)}\n${k[2]}: ${s[0] || "Wide establishing shot"}\n\n${k[1]} 2 (${sec[1]}): ${s[1] || "Close-up details"}\n${k[3]}: ${line}\n\n${k[1]} 3 (${sec[2]}): ${s[2] || "You walking into the frame"}\n${k[4]}: ${k[7]} – ${p.best}\n\n${k[5]} (${sec[3]}): ${t.cta}\n\n${k[6]}: ${n}, Gujarat 📍\n${tags}`;
};
})();
