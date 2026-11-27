// ---------- live GPS ----------
const statusEl = $("#status");
function onPos(p){
  const first = !me.live;
  me = {lat:p.coords.latitude, lng:p.coords.longitude, name:"your location", live:true};
  store.set("me", me);
  meMarker.setLatLng([me.lat, me.lng]); accCircle.setLatLng([me.lat, me.lng]).setRadius(p.coords.accuracy);
  statusEl.textContent = `Live GPS on · accurate to ${Math.round(p.coords.accuracy)} m`;
  if(follow || first) map.setView([me.lat, me.lng], first ? 13 : map.getZoom());
  if(first){ renderPlaces(); updateRoute() }
}
function onErr(e){ statusEl.textContent = e.code === 1 ? "Location blocked. Allow location for this site in Chrome settings." : "Waiting for GPS signal…" }
if("geolocation" in navigator) navigator.geolocation.watchPosition(onPos, onErr, {enableHighAccuracy:true, maximumAge:10000, timeout:20000});
else statusEl.textContent = "This browser has no GPS support.";

// ---------- real road route (OSRM) ----------
async function getRoute(p){
  const key = `${me.lat.toFixed(3)},${me.lng.toFixed(3)}>${p.id}`;
  if(routeCache[key]) return routeCache[key];
  try{
    const r = await fetch(`https://router.project-osrm.org/route/v1/driving/${me.lng},${me.lat};${p.lng},${p.lat}?overview=full&geometries=geojson`);
    const j = await r.json();
    if(j.code !== "Ok") throw 0;
    const rt = j.routes[0];
    return routeCache[key] = {km: rt.distance/1000, hrs: rt.duration/3600, line: rt.geometry.coordinates.map(c => [c[1], c[0]]), live:true};
  }catch(e){
    const d = km(me, p)*1.3;
    return {km:d, hrs:d/55, line:[[me.lat,me.lng],[p.lat,p.lng]], live:false};
  }
}
YS.getRoute = getRoute;
async function updateRoute(){
  const p = PLACES.find(x => x.id === sel);
  Object.entries(pins).forEach(([id, m]) => m.setIcon(pinIcon(id === sel)));
  if(!p){ $("#routeInfo").textContent = "Tap a red pin to plan a trip."; return }
  $("#routeInfo").textContent = "Finding the road route…";
  const r = await getRoute(p);
  if(routeLine) routeLine.remove();
  routeLine = L.polyline(r.line, {color:"#0f8f88", weight:5, opacity:.85, dashArray: r.live ? null : "8 8"}).addTo(map);
  $("#routeInfo").textContent = `${p.n}: ${Math.round(r.km)} km, about ${hm(r.hrs)} by road${r.live ? "" : " (estimate, offline)"}`;
  if($("#v-routes").classList.contains("on")) renderRoutes();
}
