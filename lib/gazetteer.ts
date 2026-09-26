// Place-name → region lookup. Used by ingestion (region tagging) and My Area
// (city/municipality search). Granularity stops at city/municipality (§18).
import type { RegionId } from "./taxonomy";

export interface Place {
  name: string;
  province: string; // province, or "Metro Manila"
  region: RegionId;
  kind: "province" | "city" | "municipality";
  lat?: number;
  lng?: number;
  aliases?: string[];
}

const P = (name: string, region: RegionId, aliases?: string[]): Place => ({
  name,
  province: name,
  region,
  kind: "province",
  aliases,
});
const C = (
  name: string,
  province: string,
  region: RegionId,
  lat: number,
  lng: number,
  kind: Place["kind"] = "city",
  aliases?: string[],
): Place => ({ name, province, region, kind, lat, lng, aliases });

export const PROVINCES: Place[] = [
  P("Metro Manila", "ncr", ["NCR", "Kalakhang Maynila"]),
  P("Abra", "car"), P("Apayao", "car"), P("Benguet", "car"), P("Ifugao", "car"),
  P("Kalinga", "car"), P("Mountain Province", "car"),
  P("Ilocos Norte", "r1"), P("Ilocos Sur", "r1"), P("La Union", "r1"), P("Pangasinan", "r1"),
  P("Batanes", "r2"), P("Cagayan", "r2"), P("Isabela", "r2"), P("Nueva Vizcaya", "r2"), P("Quirino", "r2"),
  P("Aurora", "r3"), P("Bataan", "r3"), P("Bulacan", "r3"), P("Nueva Ecija", "r3"),
  P("Pampanga", "r3"), P("Tarlac", "r3"), P("Zambales", "r3"),
  P("Batangas", "r4a"), P("Cavite", "r4a"), P("Laguna", "r4a"), P("Quezon Province", "r4a", ["Quezon"]), P("Rizal", "r4a"),
  P("Marinduque", "r4b"), P("Occidental Mindoro", "r4b"), P("Oriental Mindoro", "r4b"),
  P("Palawan", "r4b"), P("Romblon", "r4b"),
  P("Albay", "r5"), P("Camarines Norte", "r5"), P("Camarines Sur", "r5"), P("Catanduanes", "r5"),
  P("Masbate", "r5"), P("Sorsogon", "r5"),
  P("Aklan", "r6"), P("Antique", "r6"), P("Capiz", "r6"), P("Guimaras", "r6"), P("Iloilo", "r6"),
  P("Negros Occidental", "nir"), P("Negros Oriental", "nir"), P("Siquijor", "nir"),
  P("Bohol", "r7"), P("Cebu", "r7"),
  P("Biliran", "r8"), P("Eastern Samar", "r8"), P("Leyte", "r8"), P("Northern Samar", "r8"),
  P("Samar", "r8"), P("Southern Leyte", "r8"),
  P("Zamboanga del Norte", "r9"), P("Zamboanga del Sur", "r9"), P("Zamboanga Sibugay", "r9"),
  P("Bukidnon", "r10"), P("Camiguin", "r10"), P("Lanao del Norte", "r10"),
  P("Misamis Occidental", "r10"), P("Misamis Oriental", "r10"),
  P("Davao de Oro", "r11"), P("Davao del Norte", "r11"), P("Davao del Sur", "r11"),
  P("Davao Occidental", "r11"), P("Davao Oriental", "r11"),
  P("Cotabato", "r12", ["North Cotabato"]), P("Sarangani", "r12"), P("South Cotabato", "r12"), P("Sultan Kudarat", "r12"),
  P("Agusan del Norte", "r13"), P("Agusan del Sur", "r13"), P("Dinagat Islands", "r13"),
  P("Surigao del Norte", "r13"), P("Surigao del Sur", "r13"),
  P("Basilan", "barmm"), P("Lanao del Sur", "barmm"), P("Maguindanao del Norte", "barmm"),
  P("Maguindanao del Sur", "barmm"), P("Sulu", "barmm"), P("Tawi-Tawi", "barmm"),
];

export const CITIES: Place[] = [
  // NCR
  C("Manila", "Metro Manila", "ncr", 14.5995, 120.9842, "city", ["Maynila"]),
  C("Quezon City", "Metro Manila", "ncr", 14.676, 121.0437, "city", ["QC"]),
  C("Caloocan", "Metro Manila", "ncr", 14.6507, 120.9676),
  C("Las Piñas", "Metro Manila", "ncr", 14.4445, 120.9939, "city", ["Las Pinas"]),
  C("Makati", "Metro Manila", "ncr", 14.5547, 121.0244),
  C("Malabon", "Metro Manila", "ncr", 14.6681, 120.9658),
  C("Mandaluyong", "Metro Manila", "ncr", 14.5794, 121.0359),
  C("Marikina", "Metro Manila", "ncr", 14.6507, 121.1029),
  C("Muntinlupa", "Metro Manila", "ncr", 14.4081, 121.0415),
  C("Navotas", "Metro Manila", "ncr", 14.6667, 120.9417),
  C("Parañaque", "Metro Manila", "ncr", 14.4793, 121.0198, "city", ["Paranaque"]),
  C("Pasay", "Metro Manila", "ncr", 14.5378, 121.0014),
  C("Pasig", "Metro Manila", "ncr", 14.5764, 121.0851),
  C("San Juan", "Metro Manila", "ncr", 14.6019, 121.0355),
  C("Taguig", "Metro Manila", "ncr", 14.5176, 121.0509),
  C("Valenzuela", "Metro Manila", "ncr", 14.7011, 120.983),
  C("Pateros", "Metro Manila", "ncr", 14.5446, 121.0685, "municipality"),
  // CAR
  C("Baguio", "Benguet", "car", 16.4023, 120.596),
  C("La Trinidad", "Benguet", "car", 16.4553, 120.5877, "municipality"),
  C("Tabuk", "Kalinga", "car", 17.4189, 121.4443),
  C("Bangued", "Abra", "car", 17.5963, 120.6178, "municipality"),
  // Region I
  C("Laoag", "Ilocos Norte", "r1", 18.1978, 120.5936),
  C("Vigan", "Ilocos Sur", "r1", 17.5747, 120.3869),
  C("San Fernando (La Union)", "La Union", "r1", 16.6159, 120.3166, "city", ["San Fernando, La Union"]),
  C("Dagupan", "Pangasinan", "r1", 16.043, 120.3333),
  C("Alaminos", "Pangasinan", "r1", 16.1553, 119.9806),
  C("Urdaneta", "Pangasinan", "r1", 15.9761, 120.5711),
  // Region II
  C("Tuguegarao", "Cagayan", "r2", 17.6132, 121.727),
  C("Ilagan", "Isabela", "r2", 17.1486, 121.8893),
  C("Santiago", "Isabela", "r2", 16.6881, 121.5486),
  C("Cauayan", "Isabela", "r2", 16.9278, 121.7717),
  C("Bayombong", "Nueva Vizcaya", "r2", 16.4845, 121.1447, "municipality"),
  // Region III
  C("Angeles", "Pampanga", "r3", 15.145, 120.5887),
  C("San Fernando (Pampanga)", "Pampanga", "r3", 15.0286, 120.6898, "city", ["San Fernando, Pampanga"]),
  C("Malolos", "Bulacan", "r3", 14.8433, 120.8114),
  C("Meycauayan", "Bulacan", "r3", 14.7369, 120.9608),
  C("San Jose del Monte", "Bulacan", "r3", 14.8139, 121.0453),
  C("Olongapo", "Zambales", "r3", 14.8386, 120.2842),
  C("Balanga", "Bataan", "r3", 14.6761, 120.5361),
  C("Cabanatuan", "Nueva Ecija", "r3", 15.4869, 120.9675),
  C("Tarlac City", "Tarlac", "r3", 15.4755, 120.5963),
  C("Baler", "Aurora", "r3", 15.7589, 121.5623, "municipality"),
  // CALABARZON
  C("Antipolo", "Rizal", "r4a", 14.5862, 121.1761),
  C("Cainta", "Rizal", "r4a", 14.5786, 121.1222, "municipality"),
  C("Taytay", "Rizal", "r4a", 14.5692, 121.1325, "municipality"),
  C("Rodriguez", "Rizal", "r4a", 14.7603, 121.2076, "municipality", ["Montalban"]),
  C("Bacoor", "Cavite", "r4a", 14.4624, 120.9645),
  C("Dasmariñas", "Cavite", "r4a", 14.3294, 120.9367, "city", ["Dasmarinas"]),
  C("Imus", "Cavite", "r4a", 14.4297, 120.9367),
  C("Tagaytay", "Cavite", "r4a", 14.1153, 120.9621),
  C("General Trias", "Cavite", "r4a", 14.3869, 120.8817),
  C("Calamba", "Laguna", "r4a", 14.2117, 121.1653),
  C("San Pablo", "Laguna", "r4a", 14.0683, 121.3256),
  C("Santa Rosa", "Laguna", "r4a", 14.3122, 121.1114),
  C("Biñan", "Laguna", "r4a", 14.3333, 121.0833, "city", ["Binan"]),
  C("San Pedro", "Laguna", "r4a", 14.3595, 121.0473),
  C("Los Baños", "Laguna", "r4a", 14.1699, 121.2441, "municipality", ["Los Banos", "UPLB"]),
  C("Santa Cruz (Laguna)", "Laguna", "r4a", 14.2814, 121.4161, "municipality", ["Santa Cruz, Laguna"]),
  C("Batangas City", "Batangas", "r4a", 13.7565, 121.0583),
  C("Lipa", "Batangas", "r4a", 13.9411, 121.1622),
  C("Tanauan", "Batangas", "r4a", 14.0863, 121.1497),
  C("Lucena", "Quezon Province", "r4a", 13.9373, 121.6179),
  // MIMAROPA
  C("Puerto Princesa", "Palawan", "r4b", 9.7392, 118.7353),
  C("El Nido", "Palawan", "r4b", 11.1956, 119.4075, "municipality"),
  C("Coron", "Palawan", "r4b", 11.9986, 120.2043, "municipality"),
  C("Calapan", "Oriental Mindoro", "r4b", 13.4117, 121.18),
  C("Boac", "Marinduque", "r4b", 13.4463, 121.84, "municipality"),
  // Bicol
  C("Legazpi", "Albay", "r5", 13.1391, 123.7438),
  C("Naga", "Camarines Sur", "r5", 13.6218, 123.1948),
  C("Iriga", "Camarines Sur", "r5", 13.4213, 123.4124),
  C("Sorsogon City", "Sorsogon", "r5", 12.9742, 124.0058),
  C("Masbate City", "Masbate", "r5", 12.3686, 123.6167),
  C("Virac", "Catanduanes", "r5", 13.5807, 124.2306, "municipality"),
  C("Daet", "Camarines Norte", "r5", 14.1122, 122.9553, "municipality"),
  // Western Visayas
  C("Iloilo City", "Iloilo", "r6", 10.7202, 122.5621),
  C("Roxas", "Capiz", "r6", 11.5853, 122.7511),
  C("Kalibo", "Aklan", "r6", 11.7072, 122.3647, "municipality"),
  C("Boracay", "Aklan", "r6", 11.9674, 121.9248, "municipality", ["Malay"]),
  C("San Jose de Buenavista", "Antique", "r6", 10.7439, 121.9411, "municipality"),
  // NIR
  C("Bacolod", "Negros Occidental", "nir", 10.6765, 122.9509),
  C("Dumaguete", "Negros Oriental", "nir", 9.3068, 123.3054),
  // Central Visayas
  C("Cebu City", "Cebu", "r7", 10.3157, 123.8854),
  C("Mandaue", "Cebu", "r7", 10.3236, 123.9223),
  C("Lapu-Lapu", "Cebu", "r7", 10.3103, 123.9494),
  C("Talisay (Cebu)", "Cebu", "r7", 10.2447, 123.8494),
  C("Tagbilaran", "Bohol", "r7", 9.6417, 123.8547),
  // Eastern Visayas
  C("Tacloban", "Leyte", "r8", 11.2444, 125.0036),
  C("Ormoc", "Leyte", "r8", 11.0064, 124.6075),
  C("Catbalogan", "Samar", "r8", 11.7753, 124.8861),
  C("Borongan", "Eastern Samar", "r8", 11.6081, 125.4319),
  C("Maasin", "Southern Leyte", "r8", 10.1333, 124.8333),
  // Zamboanga Peninsula
  C("Zamboanga City", "Zamboanga del Sur", "r9", 6.9214, 122.079),
  C("Pagadian", "Zamboanga del Sur", "r9", 7.8257, 123.437),
  C("Dipolog", "Zamboanga del Norte", "r9", 8.5883, 123.3409),
  // Northern Mindanao
  C("Cagayan de Oro", "Misamis Oriental", "r10", 8.4542, 124.6319, "city", ["CDO"]),
  C("Iligan", "Lanao del Norte", "r10", 8.228, 124.2452),
  C("Malaybalay", "Bukidnon", "r10", 8.1575, 125.1278),
  C("Valencia", "Bukidnon", "r10", 7.9064, 125.0942),
  // Davao
  C("Davao City", "Davao del Sur", "r11", 7.1907, 125.4553),
  C("Tagum", "Davao del Norte", "r11", 7.4478, 125.8078),
  C("Digos", "Davao del Sur", "r11", 6.7497, 125.3572),
  C("Mati", "Davao Oriental", "r11", 6.9551, 126.2166),
  // SOCCSKSARGEN
  C("General Santos", "South Cotabato", "r12", 6.1164, 125.1716, "city", ["GenSan"]),
  C("Koronadal", "South Cotabato", "r12", 6.5031, 124.8469),
  C("Kidapawan", "Cotabato", "r12", 7.0083, 125.0894),
  C("Tacurong", "Sultan Kudarat", "r12", 6.6925, 124.6764),
  // Caraga
  C("Butuan", "Agusan del Norte", "r13", 8.9475, 125.5406),
  C("Surigao City", "Surigao del Norte", "r13", 9.7843, 125.4888),
  C("Siargao", "Surigao del Norte", "r13", 9.8482, 126.0458, "municipality", ["General Luna"]),
  C("Bislig", "Surigao del Sur", "r13", 8.2153, 126.3219),
  // BARMM
  C("Cotabato City", "Maguindanao del Norte", "barmm", 7.2236, 124.2464),
  C("Marawi", "Lanao del Sur", "barmm", 8.0034, 124.2839),
  C("Jolo", "Sulu", "barmm", 6.0535, 121.0021, "municipality"),
  C("Isabela City", "Basilan", "barmm", 6.7013, 121.9711),
  C("Bongao", "Tawi-Tawi", "barmm", 5.0292, 119.7731, "municipality"),
];

export const PLACES: Place[] = [...CITIES, ...PROVINCES];

const norm = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/** City/municipality search for My Area onboarding. */
export function searchPlaces(q: string, limit = 8): Place[] {
  const n = norm(q);
  if (!n) return [];
  const scored = CITIES.map((p) => {
    const names = [p.name, ...(p.aliases ?? [])].map(norm);
    const best = Math.min(
      ...names.map((x) => (x === n ? 0 : x.startsWith(n) ? 1 : x.includes(n) ? 2 : 9)),
      norm(p.province).startsWith(n) ? 3 : 9,
    );
    return { p, best };
  }).filter((x) => x.best < 9);
  return scored.sort((a, b) => a.best - b.best || a.p.name.localeCompare(b.p.name)).slice(0, limit).map((x) => x.p);
}

/** Nearest known city/municipality to a coordinate ("Use my current location"). */
export function nearestPlace(lat: number, lng: number): Place {
  let best = CITIES[0];
  let d = Infinity;
  for (const p of CITIES) {
    const dd = (p.lat! - lat) ** 2 + ((p.lng! - lng) * Math.cos((lat * Math.PI) / 180)) ** 2;
    if (dd < d) {
      d = dd;
      best = p;
    }
  }
  return best;
}

/** Stable key for a place (used in URLs / storage). */
export const placeKey = (p: Place) => norm(`${p.name}--${p.province}`).replace(/[^a-z0-9]+/g, "-");
export const placeByKey = (k: string) => PLACES.find((p) => placeKey(p) === k) ?? null;
