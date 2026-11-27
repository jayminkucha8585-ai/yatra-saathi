// Destinations shown in the app. Add a new place by copying one line and changing the values.
// rail: 1 if a train station is close, boat: 1 if a ferry leg is needed.
const PLACES = [
  {id:"sou", n:"Statue of Unity", c:"Monument", lat:21.838, lng:73.719, best:"Oct to Mar", rail:1, d:"World's tallest statue on the Narmada, with a viewing gallery, valley of flowers and riverfront."},
  {id:"gir", n:"Gir National Park", c:"Wildlife", lat:21.17, lng:70.60, best:"Dec to Mar", rail:0, d:"Last wild home of the Asiatic lion. Book jungle safaris at Sasan Gir in advance."},
  {id:"som", n:"Somnath Temple", c:"Temple", lat:20.888, lng:70.401, best:"Oct to Mar", rail:1, d:"First of the twelve Jyotirlingas, on the Arabian Sea shore. Evening light and sound show."},
  {id:"dwk", n:"Dwarkadhish Temple", c:"Temple", lat:22.238, lng:68.968, best:"Nov to Feb", rail:1, d:"Ancient Krishna temple in Dwarka, on the Gomti ghat."},
  {id:"bet", n:"Bet Dwarka", c:"Island", lat:22.45, lng:69.11, best:"Nov to Feb", rail:1, boat:1, d:"Island temple and beaches, reached by ferry from Okha jetty."},
  {id:"shv", n:"Shivrajpur Beach", c:"Beach", lat:22.33, lng:68.95, best:"Nov to Mar", rail:1, d:"Blue Flag certified beach near Dwarka with clean water and snorkelling."},
  {id:"rann", n:"Rann of Kutch", c:"Nature", lat:23.84, lng:69.75, best:"Nov to Feb", rail:1, d:"White salt desert near Dhordo. Rann Utsav tent city runs in winter; full-moon nights are best."},
  {id:"rkv", n:"Rani ki Vav", c:"Heritage", lat:23.859, lng:72.101, best:"Oct to Mar", rail:1, d:"UNESCO stepwell in Patan with hundreds of carved sculptures."},
  {id:"mod", n:"Modhera Sun Temple", c:"Heritage", lat:23.583, lng:72.133, best:"Oct to Mar", rail:0, d:"11th-century Sun temple with a carved stepped tank and an evening projection show."},
  {id:"sab", n:"Sabarmati Ashram", c:"Heritage", lat:23.06, lng:72.58, best:"All year", rail:1, d:"Gandhiji's home on the Sabarmati riverfront, with museum and archives."},
  {id:"sap", n:"Saputara", c:"Hill station", lat:20.58, lng:73.75, best:"Jul to Feb", rail:0, d:"Gujarat's hill station in the Dang forest. Lake boating, ropeway and monsoon waterfalls."},
  {id:"pav", n:"Champaner-Pavagadh", c:"Heritage", lat:22.48, lng:73.53, best:"Jul to Feb", rail:0, d:"UNESCO archaeological park plus the hilltop Kalika Mata temple by ropeway."},
  {id:"polo", n:"Polo Forest", c:"Nature", lat:23.98, lng:73.27, best:"Jul to Feb", rail:0, d:"Old temples inside dense forest near Vijaynagar. Good for treks and camping."},
  {id:"pal", n:"Palitana", c:"Temple", lat:21.52, lng:71.82, best:"Oct to Mar", rail:1, d:"Hundreds of Jain temples on Shatrunjaya hill, reached by about 3,500 steps."},
  {id:"diu", n:"Diu", c:"Beach", lat:20.714, lng:70.98, best:"Oct to Mar", rail:0, d:"Coastal island with Portuguese fort, Nagoa beach and quiet lanes."}
];
