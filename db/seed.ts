// Sample edition for offline dev and first run. Uses FICTIONAL publishers
// (ids prefixed `sample-`, links to example.org) so demo headlines are never
// attributed to real outlets. `npm run seed` resets the DB to this edition.
import { createHash } from "node:crypto";
import { getDb } from "./client";
import type { LanguageId, RegionId, SourceTypeId } from "../lib/taxonomy";

const H = 3600_000;
const now = Date.now();
const ago = (h: number) => new Date(now - h * H).toISOString();

type S = {
  id: string;
  name: string;
  type: SourceTypeId;
  ownership: string;
  regions: RegionId[];
  languages: LanguageId[];
  dataStatus?: "partner" | "feed" | "link";
  paywalled?: boolean;
};

const SOURCES: S[] = [
  { id: "sample-national-daily", name: "The National Daily (sample)", type: "national", ownership: "Sample Media Holdings, Inc.", regions: ["ncr"], languages: ["en"], paywalled: true },
  { id: "sample-metro-broadcast", name: "Metro Broadcast News (sample)", type: "national", ownership: "Sample Broadcasting Network", regions: ["ncr"], languages: ["en", "fil"] },
  { id: "sample-balita", name: "Balita Ngayon (sample)", type: "national", ownership: "Sample Tabloid Publishing Corp.", regions: ["ncr"], languages: ["fil"] },
  { id: "sample-business-ledger", name: "Business Ledger (sample)", type: "national", ownership: "Sample Media Holdings, Inc.", regions: ["ncr"], languages: ["en"] },
  { id: "sample-state-wire", name: "State News Wire (sample)", type: "state", ownership: "Government of the Philippines (sample)", regions: ["ncr"], languages: ["en"] },
  { id: "sample-agency-press", name: "Agency Press Office (sample)", type: "government", ownership: "National government agency (sample)", regions: ["ncr"], languages: ["en", "fil"] },
  { id: "sample-lgu-pasig", name: "Pasig City Public Information Office (sample)", type: "government", ownership: "City Government of Pasig (sample)", regions: ["ncr"], languages: ["fil"] },
  { id: "sample-gazette", name: "Official Records (sample)", type: "primary", ownership: "Government of the Philippines (sample)", regions: ["ncr"], languages: ["en"], dataStatus: "link" },
  { id: "sample-investigative", name: "Investigative Desk (sample)", type: "independent", ownership: "Nonprofit media foundation (sample)", regions: ["ncr"], languages: ["en"] },
  { id: "sample-open-data", name: "Open Data Watch (sample)", type: "independent", ownership: "Nonprofit (sample)", regions: ["ncr", "r4a"], languages: ["en"] },
  { id: "sample-calabarzon", name: "Southern Tagalog Tribune (sample)", type: "regional", ownership: "Independently owned (sample)", regions: ["r4a"], languages: ["en", "fil"], dataStatus: "partner" },
  { id: "sample-central-luzon", name: "Central Luzon Courier (sample)", type: "regional", ownership: "Independently owned (sample)", regions: ["r3"], languages: ["en", "fil", "pam"] },
  { id: "sample-cebu", name: "Sugbo Daily (sample)", type: "regional", ownership: "Sample Regional Papers Group", regions: ["r7"], languages: ["en", "ceb"] },
  { id: "sample-davao", name: "Davao Chronicle (sample)", type: "regional", ownership: "Sample Regional Papers Group", regions: ["r11"], languages: ["en", "ceb"] },
  { id: "sample-iloilo", name: "Panay Examiner (sample)", type: "regional", ownership: "Independently owned (sample)", regions: ["r6"], languages: ["en", "hil"], dataStatus: "partner" },
  { id: "sample-palawan", name: "Palawan Islander (sample)", type: "regional", ownership: "Independently owned (sample)", regions: ["r4b"], languages: ["en", "fil"] },
  { id: "sample-bicol", name: "Bicol Bulletin (sample)", type: "regional", ownership: "Independently owned (sample)", regions: ["r5"], languages: ["en", "bik"] },
  { id: "sample-ilocos", name: "Amianan Weekly (sample)", type: "community", ownership: "Community cooperative (sample)", regions: ["r1", "car"], languages: ["ilo", "en"] },
  { id: "sample-laguna-radio", name: "Laguna Community Radio (sample)", type: "community", ownership: "Community radio cooperative (sample)", regions: ["r4a"], languages: ["fil"] },
  { id: "sample-rizal-campus", name: "Rizal Campus Press (sample)", type: "community", ownership: "Student publication (sample)", regions: ["r4a"], languages: ["fil", "en"] },
  { id: "sample-social", name: "Viral posts (social monitoring)", type: "social", ownership: "Not applicable — aggregated public posts", regions: [], languages: ["fil", "en"], dataStatus: "link" },
];

type A = [sourceId: string, headline: string, excerpt: string, hoursAgo: number, lang: LanguageId, region: RegionId | null];

interface StorySeed {
  id: string;
  title: string;
  summary: string;
  status: "developing" | "ongoing" | "settled";
  topic: string;
  score: number;
  articles: A[];
  emphasis?: Partial<Record<SourceTypeId, string[]>>;
  angles?: [string, number, string?][];
  blindspots?: { type: string; reason: string; example: string; linkLabel?: string; linkHref?: string }[];
  timeline?: [hoursAgo: number, label: string, type?: SourceTypeId][];
  evidence?: { kind: string; title: string; publisher: string; hoursAgo?: number }[];
}

const STORIES: StorySeed[] = [
  {
    id: "metro-manila-lgus-prepare-flooding",
    title: "Metro Manila LGUs prepare for possible flooding as rains persist",
    summary:
      "Local government units in Metro Manila are on heightened alert as the southwest monsoon continues to bring heavy rains, raising concerns about possible flooding in low-lying areas.",
    status: "developing",
    topic: "Environment",
    score: 100,
    articles: [
      ["sample-agency-press", "Weather bureau raises heavy rainfall warning over Metro Manila, nearby provinces", "The weather bureau raised an orange rainfall warning over Metro Manila and parts of Central Luzon on Friday morning.", 9, "en", "ncr"],
      ["sample-lgu-pasig", "Pasig LGU, naka-alerto sa posibleng pagbaha", "Inilagay ng pamahalaang lungsod sa blue alert ang disaster response teams nito habang patuloy ang pag-ulan.", 8, "fil", "ncr"],
      ["sample-state-wire", "MMDA deploys pumping stations, rescue teams in flood-prone areas", "The MMDA said all 71 pumping stations are operational as rains continue across the capital.", 7.5, "en", "ncr"],
      ["sample-national-daily", "Metro Manila LGUs on alert as monsoon rains persist", "Mayors across the capital suspended afternoon classes and readied evacuation centers.", 7, "en", "ncr"],
      ["sample-metro-broadcast", "Classes suspended in 9 Metro Manila cities due to heavy rains", "Nine cities have suspended classes at all levels as of noon, according to local advisories.", 6.5, "en", "ncr"],
      ["sample-balita", "Klase sa 9 na lungsod sa Metro Manila, suspendido", "Sinuspinde ang klase sa lahat ng antas sa siyam na lungsod dahil sa malakas na ulan.", 6, "fil", "ncr"],
      ["sample-business-ledger", "Flooding threat puts logistics, port operations on watch", "Port operators said cargo handling could slow if rains persist through the weekend.", 5.5, "en", "ncr"],
      ["sample-investigative", "Why the same Metro Manila barangays flood every monsoon", "A review of flood-control project records shows repeated spending in the same low-lying districts.", 5, "en", "ncr"],
      ["sample-open-data", "Rainfall data shows Marikina River basin near critical level", "Automated rain gauges in the upper Marikina watershed logged over 80mm in six hours.", 4.5, "en", "ncr"],
      ["sample-calabarzon", "Rizal towns brace for Marikina River overflow", "Officials in Rodriguez and San Mateo readied evacuation centers as upstream water levels rose.", 4, "en", "r4a"],
      ["sample-central-luzon", "Bulacan river levels rise; residents in low-lying barangays told to prepare", "The provincial disaster office said water levels in Angat and Ipo dams are being monitored hourly.", 3.5, "en", "r3"],
      ["sample-laguna-radio", "Laguna de Bay lakeshore towns, nagbabantay sa pagtaas ng tubig", "Nagbabala ang mga opisyal sa mga bayan sa baybayin ng lawa.", 3, "fil", "r4a"],
      ["sample-rizal-campus", "Students stranded as floods cut routes in Cainta", "Campus organizations set up help desks for commuting students.", 2.5, "fil", "r4a"],
      ["sample-agency-press", "Budget department releases quick response funds for flood-hit LGUs", "The funds will cover relief goods and temporary shelter, the department said.", 2.2, "en", "ncr"],
      ["sample-gazette", "Memorandum Circular on suspension of government work due to inclement weather", "Full text of the memorandum suspending work in government offices in Metro Manila.", 2.1, "en", "ncr"],
      ["sample-metro-broadcast", "Commuters stranded along EDSA as floods hit major roads", "Several segments of EDSA and España Boulevard became impassable to light vehicles.", 2, "en", "ncr"],
      ["sample-cebu", "Visayas spared but PAGASA warns of rains spreading south", "Forecasters said the monsoon trough could bring scattered rains to Western Visayas.", 1.8, "ceb", "r7"],
      ["sample-social", "Viral post claims Angat Dam gates to fully open tonight", "A widely shared post claims all Angat Dam spillway gates will open tonight; no official advisory matches the claim.", 1.5, "fil", null],
    ],
    emphasis: {
      government: ["Policy announcement", "Implementation", "Funding"],
      national: ["Political implications", "National impact", "Public response"],
      regional: ["Local implementation", "Community impact", "Regional effects"],
      independent: ["Evidence", "Accountability", "Long-term impact"],
      social: ["Dam release claim circulating without an official advisory"],
    },
    angles: [
      ["Emergency response & suspensions", 0.44, "Class/work suspensions, rescue deployments"],
      ["Infrastructure & flood control", 0.22, "Pumping stations, drainage, project spending"],
      ["Commuter & economic disruption", 0.17],
      ["Upstream / provincial impact", 0.11, "Rizal, Bulacan, Laguna lakeshore"],
      ["Climate & long-term risk", 0.06],
    ],
    blindspots: [
      {
        type: "geographic",
        reason: "13 of 18 region-tagged articles come from NCR; affected upstream provinces have 3 reports combined.",
        example: "Most coverage of the flooding story comes from Metro Manila. Few reports found from Rizal or Bulacan, which are also affected.",
        linkLabel: "See coverage by region",
        linkHref: "/story/metro-manila-lgus-prepare-flooding#coverage",
      },
      {
        type: "social",
        reason: "A dam-release claim is being shared widely; no independent outlet or fact-checker has addressed it yet.",
        example: "A post claiming Angat Dam gates will fully open tonight is spreading. No independent reporting has confirmed or debunked it yet.",
        linkLabel: "See the claim and official advisories",
        linkHref: "/story/metro-manila-lgus-prepare-flooding#blindspots",
      },
      {
        type: "language",
        reason: "Articles are English (61%) and Filipino (33%); one Cebuano report and no Kapampangan coverage despite Pampanga river warnings.",
        example: "Limited regional-language coverage of flood warnings in Central Luzon.",
      },
    ],
    timeline: [
      [9, "Rainfall warning issued by weather bureau", "government"],
      [7.5, "State wire reports pumping stations deployed", "state"],
      [7, "National outlets begin reporting", "national"],
      [5, "Independent analysis of repeat flooding published", "independent"],
      [4, "Regional reports from Rizal emerge", "regional"],
      [2.1, "Work suspension memorandum published", "primary"],
      [1.5, "Unverified dam-release claim begins circulating", "social"],
    ],
    evidence: [
      { kind: "document", title: "Memorandum Circular: Suspension of work in government offices", publisher: "Official Records (sample)", hoursAgo: 2.1 },
      { kind: "dataset", title: "Automated rain gauge readings, Marikina watershed", publisher: "Open Data Watch (sample)", hoursAgo: 4.5 },
      { kind: "statement", title: "Heavy rainfall warning bulletin", publisher: "Agency Press Office (sample)", hoursAgo: 9 },
    ],
  },
  {
    id: "doj-charges-flood-control-anomaly",
    title: "DOJ to file charges vs. former officials in flood control anomaly",
    summary: "The Justice department said it will file graft charges against former public works officials over allegedly substandard flood control projects.",
    status: "developing",
    topic: "Justice",
    score: 90,
    articles: [
      ["sample-agency-press", "DOJ to file graft raps over flood control projects", "The department said the complaints cover projects in at least four provinces.", 10, "en", "ncr"],
      ["sample-national-daily", "Ex-DPWH officials face charges over ghost flood projects", "Prosecutors found probable cause against 12 respondents, the DOJ said.", 9, "en", "ncr"],
      ["sample-metro-broadcast", "DOJ: Kaso vs dating opisyal sa flood control, isasampa", "Isasampa ang kaso sa Sandiganbayan sa susunod na linggo.", 8, "fil", "ncr"],
      ["sample-investigative", "Paper trail: how flood control funds moved through four districts", "Procurement records show the same contractors winning bids across provinces.", 7, "en", "ncr"],
      ["sample-state-wire", "Palace backs DOJ move on flood control cases", "The Palace said the administration supports accountability in public works.", 6, "en", "ncr"],
      ["sample-central-luzon", "Bulacan contractors named in flood control complaint", "Two Bulacan-based contractors are among the respondents.", 5, "en", "r3"],
      ["sample-bicol", "Albay flood dike among projects under DOJ review", "Residents said the dike was damaged within months of completion.", 4, "en", "r5"],
      ["sample-gazette", "Resolution finding probable cause (redacted)", "Resolution of the panel of prosecutors.", 3, "en", "ncr"],
      ["sample-balita", "Mga dating opisyal, kakasuhan sa anomalya sa flood control", "Kasama sa mga kakasuhan ang ilang district engineers.", 3, "fil", "ncr"],
      ["sample-business-ledger", "Contractors' shares slide on flood control probe", "Listed construction firms fell after names surfaced in the complaint.", 2, "en", "ncr"],
    ],
    emphasis: {
      government: ["Prosecution timeline", "Accountability commitment"],
      national: ["Political fallout", "Named officials"],
      regional: ["Local projects affected", "Contractor ties"],
      independent: ["Procurement records", "Pattern across districts"],
    },
    angles: [["Legal process", 0.4], ["Named officials", 0.3], ["Local project impact", 0.2], ["Market reaction", 0.1]],
    blindspots: [
      {
        type: "source",
        reason: "6 of 10 articles repeat the same DOJ statement; only one outlet cites procurement records directly.",
        example: "Coverage of the flood-control charges relies heavily on a single DOJ statement.",
        linkLabel: "See source list",
        linkHref: "/story/doj-charges-flood-control-anomaly#sources",
      },
    ],
    timeline: [[10, "DOJ announces charges", "government"], [9, "National outlets report", "national"], [7, "Independent document analysis", "independent"], [3, "Resolution published", "primary"]],
    evidence: [{ kind: "document", title: "Resolution finding probable cause", publisher: "Official Records (sample)", hoursAgo: 3 }],
  },
  {
    id: "rice-prices-high-import-order",
    title: "Rice prices remain high despite new import order",
    summary: "Retail rice prices in major markets remain above target levels weeks after the government approved additional imports.",
    status: "ongoing",
    topic: "Agriculture",
    score: 80,
    articles: [
      ["sample-agency-press", "DA: Imported rice to arrive by October", "The agriculture department said the first shipments will be distributed through accredited retailers.", 14, "en", "ncr"],
      ["sample-business-ledger", "Rice retail prices stay above ₱50/kg in NCR markets", "Price monitoring shows well-milled rice averaging ₱52 per kilo.", 12, "en", "ncr"],
      ["sample-national-daily", "Consumers feel pinch as rice prices stay high", "Households in Metro Manila said they are cutting back on other staples.", 11, "en", "ncr"],
      ["sample-iloilo", "Iloilo farmers say farmgate prices falling even as retail stays high", "Palay prices in Iloilo dropped to ₱17 per kilo, farmers' groups said.", 10, "hil", "r6"],
      ["sample-davao", "Davao rice retailers await imported stocks", "Retailers said supply remains tight ahead of the arrival of imports.", 9, "en", "r11"],
      ["sample-central-luzon", "Nueva Ecija farmers protest low palay prices", "Farmers' groups staged a caravan to the provincial capitol.", 8, "fil", "r3"],
      ["sample-open-data", "Chart: rice retail vs. farmgate price gap widens", "The spread between farmgate and retail prices reached its widest in three years.", 6, "en", null],
      ["sample-state-wire", "Rice supply sufficient, says DA", "The DA said national buffer stocks are adequate for 60 days.", 5, "en", "ncr"],
    ],
    emphasis: {
      government: ["Supply sufficiency", "Import timeline"],
      national: ["Consumer impact", "Retail prices"],
      regional: ["Farmgate prices", "Farmer protests"],
      independent: ["Price spread data"],
    },
    angles: [["Consumer prices", 0.4], ["Farmer income", 0.3], ["Import policy", 0.3]],
    blindspots: [
      {
        type: "angle",
        reason: "Most national coverage focuses on retail prices; farmgate prices appear only in regional and independent reports.",
        example: "Few national outlets mention falling farmgate prices reported by Iloilo and Nueva Ecija farmers.",
        linkLabel: "Compare coverage",
        linkHref: "/story/rice-prices-high-import-order?compare=1",
      },
    ],
    timeline: [[14, "DA import timeline announced", "government"], [12, "Price monitoring reported", "national"], [10, "Regional farmgate reports", "regional"]],
    evidence: [{ kind: "dataset", title: "Weekly rice price monitoring", publisher: "Open Data Watch (sample)", hoursAgo: 6 }],
  },
  {
    id: "coral-bleaching-palawan",
    title: "Experts warn of worsening coral bleaching in Palawan",
    summary: "Marine scientists report widespread bleaching across reef sites in northern Palawan following weeks of elevated sea temperatures.",
    status: "ongoing",
    topic: "Climate",
    score: 70,
    articles: [
      ["sample-palawan", "El Nido reefs show 60% bleaching, divers report", "Dive operators documented bleaching at most monitored sites.", 20, "en", "r4b"],
      ["sample-open-data", "Sea surface temperatures off Palawan hit record highs", "Satellite data shows temperatures 1.5°C above the seasonal average.", 18, "en", "r4b"],
      ["sample-national-daily", "Scientists sound alarm on Palawan coral bleaching", "University researchers called for temporary dive restrictions.", 16, "en", "ncr"],
      ["sample-agency-press", "DENR to assess reef damage in Palawan", "The environment department will deploy survey teams next week.", 12, "en", "ncr"],
    ],
    emphasis: { regional: ["Tourism impact", "Local fishers"], independent: ["Temperature data"], national: ["Scientific warning"], government: ["Assessment plans"] },
    angles: [["Scientific findings", 0.5], ["Tourism", 0.25], ["Fishing livelihoods", 0.25]],
    blindspots: [
      {
        type: "evidence",
        reason: "Only 1 of 4 articles links to the underlying survey data; no primary reef survey document is available yet.",
        example: "Claims about bleaching extent lack a published survey document.",
      },
    ],
    timeline: [[20, "Local divers report bleaching", "regional"], [18, "Temperature data published", "independent"], [12, "DENR announces assessment", "government"]],
  },
  {
    id: "doh-dengue-vigilance",
    title: "DOH urges continued vigilance vs. dengue cases",
    summary: "The Health department reported a rise in dengue cases in several regions and urged communities to clean up breeding sites.",
    status: "ongoing",
    topic: "Health",
    score: 60,
    articles: [
      ["sample-agency-press", "DOH: Dengue cases up 12% nationwide", "The department recorded over 90,000 cases since January.", 22, "en", "ncr"],
      ["sample-metro-broadcast", "Dengue cases rising, DOH warns", "Hospitals in Metro Manila report more admissions.", 20, "en", "ncr"],
      ["sample-cebu", "Cebu declares dengue outbreak in 3 towns", "The provincial board approved an outbreak declaration.", 18, "ceb", "r7"],
      ["sample-ilocos", "Dengue cases in Ilocos Norte climb", "Provincial health officials urged residents to use mosquito nets.", 15, "ilo", "r1"],
      ["sample-state-wire", "DOH launches 4S campaign against dengue", "The campaign encourages search-and-destroy of breeding sites.", 13, "en", "ncr"],
    ],
    emphasis: { government: ["Case counts", "Prevention campaign"], national: ["Hospital strain"], regional: ["Local outbreak declarations"], community: ["Household prevention"] },
    angles: [["Case counts", 0.5], ["Local outbreaks", 0.3], ["Prevention", 0.2]],
    timeline: [[22, "DOH releases case data", "government"], [18, "Cebu outbreak declared", "regional"]],
  },
  {
    id: "mmda-edsa-traffic-scheme",
    title: "MMDA implements new traffic scheme in EDSA",
    summary: "A revised bus lane and odd-even scheme took effect along EDSA, with mixed early reports on travel times.",
    status: "settled",
    topic: "Transport",
    score: 50,
    articles: [
      ["sample-state-wire", "New EDSA traffic scheme takes effect", "The MMDA said the scheme will be reviewed after two weeks.", 26, "en", "ncr"],
      ["sample-national-daily", "Motorists report longer queues on EDSA's first day of new scheme", "Commuters shared travel times on social media.", 24, "en", "ncr"],
      ["sample-balita", "Bagong traffic scheme sa EDSA, umarangkada", "Ilang motorista ang nahuli sa unang araw.", 23, "fil", "ncr"],
      ["sample-open-data", "GPS data: EDSA travel times mostly unchanged on day one", "Aggregated trip data shows a 3% change in average travel time.", 20, "en", "ncr"],
    ],
    emphasis: { state: ["Scheme rules", "Review period"], national: ["Commuter experience"], independent: ["Travel-time data"] },
    angles: [["Commuter experience", 0.5], ["Enforcement", 0.25], ["Data on travel times", 0.25]],
    blindspots: [
      { type: "local", reason: "No coverage from commuters in provinces feeding EDSA (Cavite, Rizal, Bulacan) despite bus route changes.", example: "Provincial commuters affected by EDSA bus route changes are largely absent from coverage." },
    ],
  },
  {
    id: "west-philippine-sea-resupply",
    title: "Coast Guard reports incident during West Philippine Sea resupply mission",
    summary: "The Philippine Coast Guard said a resupply mission near Ayungin Shoal was blocked by foreign vessels; the foreign ministry lodged a protest.",
    status: "developing",
    topic: "Foreign Affairs",
    score: 85,
    articles: [
      ["sample-agency-press", "PCG: Resupply boats blocked near Ayungin Shoal", "The Coast Guard released video of the encounter.", 5, "en", "r4b"],
      ["sample-state-wire", "DFA lodges diplomatic protest over Ayungin incident", "The protest was the third this month.", 4, "en", "ncr"],
      ["sample-national-daily", "Resupply mission blocked anew in West Philippine Sea", "Security analysts said the incident marks an escalation.", 4, "en", "ncr"],
      ["sample-metro-broadcast", "WPS: Resupply mission, hinarang muli", "Ayon sa PCG, walang nasaktan sa insidente.", 3.5, "fil", "ncr"],
      ["sample-investigative", "Satellite images show vessel build-up before Ayungin incident", "Analysis of commercial imagery shows 30 vessels in the area.", 3, "en", null],
      ["sample-palawan", "Palawan fishers report reduced catch amid sea tensions", "Fishers from Kalayaan said they avoid traditional fishing grounds.", 2.5, "en", "r4b"],
      ["sample-social", "Video claims PH vessel fired upon in WPS", "A clip claiming shots were fired has been shared widely; officials have not referenced any gunfire.", 1, "en", null],
    ],
    emphasis: {
      government: ["Incident account", "Diplomatic protest"],
      national: ["Security implications"],
      independent: ["Satellite evidence"],
      regional: ["Fishers' livelihoods"],
      social: ["Unverified gunfire claim"],
    },
    angles: [["Maritime incident", 0.45], ["Diplomacy", 0.25], ["Evidence/imagery", 0.15], ["Fishers", 0.15]],
    blindspots: [
      {
        type: "timing",
        reason: "The incident was reported 5 hours ago; only 1 independent analysis so far and no on-the-ground regional reporting from Kalayaan.",
        example: "The Ayungin story is developing faster than available independent reporting.",
      },
    ],
    timeline: [[5, "PCG releases statement and video", "government"], [4, "DFA protest", "state"], [3, "Satellite analysis published", "independent"], [1, "Unverified gunfire clip circulating", "social"]],
  },
  {
    id: "inflation-september",
    title: "Inflation eases slightly in August on lower food prices",
    summary: "Headline inflation slowed in August, though economists warned rice and utility costs could push prices up again.",
    status: "settled",
    topic: "Economy",
    score: 40,
    articles: [
      ["sample-gazette", "Summary inflation report, August", "Consumer price index statistical release.", 40, "en", "ncr"],
      ["sample-business-ledger", "August inflation eases to 3.1%", "Economists had expected a slightly higher print.", 38, "en", "ncr"],
      ["sample-national-daily", "Inflation slows, but rice remains a concern", "Food inflation decelerated for a second month.", 37, "en", "ncr"],
      ["sample-davao", "Davao inflation higher than national average", "Regional statistics show 3.8% inflation in Davao Region.", 30, "en", "r11"],
    ],
    emphasis: { primary: ["Headline figures"], national: ["Economist outlook"], regional: ["Regional divergence"] },
    angles: [["National figure", 0.6], ["Regional differences", 0.4]],
  },
  {
    id: "deped-class-schedule",
    title: "DepEd reviews class schedule changes amid heat and rain disruptions",
    summary: "The Education department is reviewing the school calendar after repeated weather-related class suspensions.",
    status: "ongoing",
    topic: "Education",
    score: 35,
    articles: [
      ["sample-agency-press", "DepEd reviewing school calendar", "Officials said the review will consider regional weather patterns.", 30, "en", "ncr"],
      ["sample-rizal-campus", "Students weigh in on shorter school year proposal", "Campus groups collected feedback from students.", 28, "fil", "r4a"],
      ["sample-bicol", "Bicol schools lost 12 days to typhoons last year", "Division offices shared make-up class plans.", 25, "en", "r5"],
    ],
    emphasis: { government: ["Calendar review"], community: ["Student feedback"], regional: ["Lost school days"] },
  },
  {
    id: "san-pablo-lakes-cleanup",
    title: "San Pablo launches Seven Lakes rehabilitation drive",
    summary: "The city government of San Pablo, Laguna began a cleanup and fish-cage regulation drive across its seven crater lakes.",
    status: "ongoing",
    topic: "Environment",
    score: 20,
    articles: [
      ["sample-calabarzon", "San Pablo begins Seven Lakes rehabilitation", "The city will cap fish cages in Sampaloc Lake.", 16, "en", "r4a"],
      ["sample-laguna-radio", "Paglilinis sa Sampaloc Lake, sinimulan", "Nakiisa ang mga residente at mangingisda.", 14, "fil", "r4a"],
    ],
    emphasis: { regional: ["Fish-cage limits"], community: ["Resident participation"] },
  },
];

const hash = (s: string) => createHash("sha1").update(s).digest("hex").slice(0, 16);

export function seed() {
  const db = getDb();
  db.exec(`DELETE FROM fact_checks; DELETE FROM evidence; DELETE FROM timeline_events; DELETE FROM blindspots;
           DELETE FROM story_angles; DELETE FROM story_emphasis; DELETE FROM articles; DELETE FROM stories;
           DELETE FROM sources WHERE id LIKE 'sample-%';`);

  const insSource = db.prepare(`INSERT OR REPLACE INTO sources
    (id,name,type,ownership,ownership_source,data_status,paywalled,homepage,feed_url,regions,languages,topics,active)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,1)`);
  for (const s of SOURCES) {
    insSource.run(
      s.id, s.name, s.type, s.ownership, "Sample data", s.dataStatus ?? "feed", s.paywalled ? 1 : 0,
      `https://example.org/${s.id}`, null, JSON.stringify(s.regions), JSON.stringify(s.languages), "[]",
    );
  }

  const insStory = db.prepare(`INSERT INTO stories (id,title,summary,status,topic,score,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)`);
  const insArticle = db.prepare(`INSERT INTO articles (id,source_id,story_id,headline,byline,url,excerpt,published_at,language,region,fetched_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)`);
  const insEmph = db.prepare(`INSERT INTO story_emphasis (story_id,source_type,points) VALUES (?,?,?)`);
  const insAngle = db.prepare(`INSERT INTO story_angles (story_id,angle,share,note) VALUES (?,?,?,?)`);
  const insBlind = db.prepare(`INSERT INTO blindspots (story_id,type,reason,example,link_label,link_href,detected_at) VALUES (?,?,?,?,?,?,?)`);
  const insTime = db.prepare(`INSERT INTO timeline_events (story_id,at,label,source_type,article_id) VALUES (?,?,?,?,?)`);
  const insEv = db.prepare(`INSERT INTO evidence (story_id,kind,title,publisher,url,published_at) VALUES (?,?,?,?,?,?)`);

  for (const s of STORIES) {
    const created = Math.max(...s.articles.map((a) => a[3]));
    const updated = Math.min(...s.articles.map((a) => a[3]));
    insStory.run(s.id, s.title, s.summary, s.status, s.topic, s.score, ago(created), ago(updated));
    for (const [src, headline, excerpt, h, lang, region] of s.articles) {
      const url = `https://example.org/${src}/${hash(headline)}`;
      insArticle.run(hash(url), src, s.id, headline, null, url, excerpt, ago(h), lang, region, ago(h));
    }
    for (const [t, pts] of Object.entries(s.emphasis ?? {})) insEmph.run(s.id, t, JSON.stringify(pts));
    for (const [angle, share, note] of s.angles ?? []) insAngle.run(s.id, angle, share, note ?? null);
    for (const b of s.blindspots ?? [])
      insBlind.run(s.id, b.type, b.reason, b.example, b.linkLabel ?? null, b.linkHref ?? null, ago(0.5));
    for (const [h, label, type] of s.timeline ?? []) insTime.run(s.id, ago(h), label, type ?? null, null);
    for (const e of s.evidence ?? [])
      insEv.run(s.id, e.kind, e.title, e.publisher, `https://example.org/evidence/${hash(e.title)}`, e.hoursAgo ? ago(e.hoursAgo) : null);
  }
  return { sources: SOURCES.length, stories: STORIES.length, articles: STORIES.reduce((a, s) => a + s.articles.length, 0) };
}

if (process.argv[1]?.endsWith("seed.ts")) {
  console.log("Seeded sample edition:", seed());
}
