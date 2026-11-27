(() => {
const {$, $$, esc, store, km, toast, show} = YS;
const once = {};
const page = (id, fn) => { YS.renderers[id] = () => { if(!once[id]){ once[id] = 1; fn($("#v-"+id)) } if(YS.refresh?.[id]) YS.refresh[id]() } };
const mapsLink = () => { const m = YS.me(); return `https://maps.google.com/?q=${m.lat.toFixed(5)},${m.lng.toFixed(5)}` };
YS.refresh = YS.refresh || {};
// ================= Weather (Open-Meteo, free) =================
const WMO = {0:"Clear sky",1:"Mostly clear",2:"Partly cloudy",3:"Cloudy",45:"Fog",48:"Fog",51:"Light drizzle",53:"Drizzle",55:"Heavy drizzle",61:"Light rain",63:"Rain",65:"Heavy rain",
  71:"Snow",80:"Rain showers",81:"Rain showers",82:"Heavy showers",95:"Thunderstorm",96:"Thunderstorm with hail",99:"Thunderstorm with hail"};
page("weather", el => {
  el.innerHTML = `<div class="row"><select id="wAt" style="flex:1"><option value="me">My location</option>${YS.placeOptions()}</select></div><div id="wOut"></div>
    <p class="note">Forecast from Open-Meteo.</p>`;
  $("#wAt").onchange = load;
  async function load(){
    const v = $("#wAt").value, p = v === "me" ? {...YS.me(), n: YS.me().name} : PLACES.find(x => x.id === v), out = $("#wOut");
    out.innerHTML = `<div class="empty">Loading weather…</div>`;
    try{
      const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${p.lat}&longitude=${p.lng}&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,relative_humidity_2m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=5`);
      const j = await r.json(), c = j.current, d = j.daily;
      const advice = c.temperature_2m >= 35 ? "Very hot: carry water, cap and sunscreen; avoid travel 12–4 pm." : c.temperature_2m <= 12 ? "Cold: carry a jacket." :
        (d.precipitation_probability_max[0] >= 60 ? "Rain likely: carry an umbrella and check road conditions." : "Good weather for travel.");
      out.innerHTML = `<div class="card"><div class="meta">${esc(p.n)}</div><div class="big">${Math.round(c.temperature_2m)}°C</div>
        <div>${WMO[c.weather_code] || "—"} · feels like ${Math.round(c.apparent_temperature)}°C</div>
        <div class="meta">Humidity ${c.relative_humidity_2m}% · Wind ${Math.round(c.wind_speed_10m)} km/h</div><p><b>${advice}</b></p></div>
        <div class="days">${d.time.map((t,i) => `<div><b>${new Date(t).toLocaleDateString("en-IN",{weekday:"short"})}</b><br>${Math.round(d.temperature_2m_max[i])}° / ${Math.round(d.temperature_2m_min[i])}°<br><span class="meta">${WMO[d.weather_code[i]] || ""}<br>Rain ${d.precipitation_probability_max[i] ?? 0}%</span></div>`).join("")}</div>`;
    }catch(e){ out.innerHTML = `<div class="empty">Couldn't load the weather. Check your internet.</div>` }
  }
  YS.refresh = YS.refresh || {}; YS.refresh.weather = () => { if(YS.selected()) $("#wAt").value = YS.selected(); load() };
});
})();
