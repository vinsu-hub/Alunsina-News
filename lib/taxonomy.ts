// Single source of truth for ALUNSINA NEWS vocabulary (spec §6, §7, §17, §19).
// UI, ingestion, and the Methodology page all read from here.

export const SOURCE_TYPES = [
  {
    id: "primary",
    label: "Primary Document",
    short: "Primary",
    description:
      "A law, court filing, budget line item, dataset, or official record. Not authored editorially; closest thing to raw evidence.",
  },
  {
    id: "government",
    label: "Government Statement",
    short: "Government",
    description:
      "A press release or official statement from an agency or LGU. Attributable to a specific office.",
  },
  {
    id: "state",
    label: "State-Run Media",
    short: "State-Run",
    description:
      "Outlets with formal government affiliation (e.g. PTV, PNA). Distinct from an independent outlet covering a government statement.",
  },
  {
    id: "national",
    label: "National Media",
    short: "National",
    description: "Outlets with nationwide reach, typically headquartered in Metro Manila.",
  },
  {
    id: "regional",
    label: "Regional Media",
    short: "Regional",
    description: "Outlets whose newsroom and primary audience sit in a specific region or province.",
  },
  {
    id: "independent",
    label: "Independent",
    short: "Independent",
    description:
      "Non-conglomerate newsrooms, investigative centers, and nonprofit journalism outfits.",
  },
  {
    id: "community",
    label: "Community",
    short: "Community",
    description: "Hyperlocal papers, campus press, radio, and community newsletters.",
  },
  {
    id: "social",
    label: "Social / Viral",
    short: "Social",
    description:
      "A claim or clip circulating on Facebook, X, or TikTok with no editorial reporting behind it yet.",
  },
] as const;

export type SourceTypeId = (typeof SOURCE_TYPES)[number]["id"];
export const SOURCE_TYPE_IDS = SOURCE_TYPES.map((t) => t.id) as SourceTypeId[];
export const sourceType = (id: SourceTypeId) => SOURCE_TYPES.find((t) => t.id === id)!;

// Non-political, editorial palette for source types. Ordered roughly from
// "closest to raw evidence" to "least verified". Never red/blue party coding.
export const SOURCE_TYPE_COLORS: Record<SourceTypeId, string> = {
  primary: "#092D27",
  government: "#123F35",
  state: "#4E6B5E",
  national: "#8A8F7A",
  regional: "#C49A45",
  independent: "#B4513D",
  community: "#7A4B3A",
  social: "#C9C5B9",
};

export const BLINDSPOT_TYPES = [
  {
    id: "geographic",
    label: "Geographic",
    description:
      "Heavy coverage from Metro Manila while affected provinces receive little reporting.",
  },
  {
    id: "language",
    label: "Language",
    description: "Covered extensively in English or Filipino while regional-language reporting is limited.",
  },
  {
    id: "source",
    label: "Source",
    description:
      "Many articles originate from a small number of publishers or repeat the same official statement.",
  },
  {
    id: "evidence",
    label: "Evidence",
    description: "Many reports but limited links to primary documentation.",
  },
  {
    id: "timing",
    label: "Timing",
    description: "The story is developing faster than the available reporting.",
  },
  {
    id: "local",
    label: "Local",
    description: "A national story with little reporting from the communities directly affected.",
  },
  {
    id: "angle",
    label: "Topic / Angle",
    description: "Most sources focus on one aspect while another relevant aspect receives little attention.",
  },
  {
    id: "social",
    label: "Social / Misinformation",
    description:
      "A claim is circulating widely on social media with little or no independent reporting confirming or debunking it yet.",
  },
] as const;

export type BlindspotTypeId = (typeof BLINDSPOT_TYPES)[number]["id"];
export const blindspotType = (id: BlindspotTypeId) => BLINDSPOT_TYPES.find((t) => t.id === id)!;

export const TOPICS = [
  "Government",
  "Economy",
  "Education",
  "Health",
  "Environment",
  "Transport",
  "Business",
  "Agriculture",
  "Technology",
  "Climate",
  "Justice",
  "Foreign Affairs",
] as const;
export type Topic = (typeof TOPICS)[number];
export const topicSlug = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-");

export const ISLAND_GROUPS = [
  { id: "luzon", label: "Luzon" },
  { id: "visayas", label: "Visayas" },
  { id: "mindanao", label: "Mindanao" },
] as const;
export type IslandGroupId = (typeof ISLAND_GROUPS)[number]["id"];

// The 17 administrative regions. `id` is the stable key used everywhere.
export const REGIONS = [
  { id: "ncr", label: "NCR", name: "National Capital Region", island: "luzon" },
  { id: "car", label: "CAR", name: "Cordillera Administrative Region", island: "luzon" },
  { id: "r1", label: "Region I", name: "Ilocos Region", island: "luzon" },
  { id: "r2", label: "Region II", name: "Cagayan Valley", island: "luzon" },
  { id: "r3", label: "Region III", name: "Central Luzon", island: "luzon" },
  { id: "r4a", label: "CALABARZON", name: "Region IV-A", island: "luzon" },
  { id: "r4b", label: "MIMAROPA", name: "Region IV-B", island: "luzon" },
  { id: "r5", label: "Region V", name: "Bicol Region", island: "luzon" },
  { id: "r6", label: "Region VI", name: "Western Visayas", island: "visayas" },
  { id: "nir", label: "NIR", name: "Negros Island Region", island: "visayas" },
  { id: "r7", label: "Region VII", name: "Central Visayas", island: "visayas" },
  { id: "r8", label: "Region VIII", name: "Eastern Visayas", island: "visayas" },
  { id: "r9", label: "Region IX", name: "Zamboanga Peninsula", island: "mindanao" },
  { id: "r10", label: "Region X", name: "Northern Mindanao", island: "mindanao" },
  { id: "r11", label: "Region XI", name: "Davao Region", island: "mindanao" },
  { id: "r12", label: "Region XII", name: "SOCCSKSARGEN", island: "mindanao" },
  { id: "r13", label: "Caraga", name: "Region XIII", island: "mindanao" },
  { id: "barmm", label: "BARMM", name: "Bangsamoro Autonomous Region", island: "mindanao" },
] as const;
export type RegionId = (typeof REGIONS)[number]["id"];
export const region = (id: RegionId) => REGIONS.find((r) => r.id === id)!;
export const regionsIn = (island: IslandGroupId) => REGIONS.filter((r) => r.island === island);

export const LANGUAGES = [
  { id: "en", label: "English" },
  { id: "fil", label: "Filipino" },
  { id: "ceb", label: "Cebuano" },
  { id: "ilo", label: "Ilocano" },
  { id: "hil", label: "Hiligaynon" },
  { id: "pam", label: "Kapampangan" },
  { id: "war", label: "Waray" },
  { id: "bik", label: "Bikol" },
  { id: "other", label: "Other Philippine Languages" },
] as const;
export type LanguageId = (typeof LANGUAGES)[number]["id"];
export const language = (id: LanguageId) => LANGUAGES.find((l) => l.id === id)!;

export const DATA_STATUSES = [
  { id: "partner", label: "Data Partner", description: "Direct data-sharing agreement." },
  {
    id: "feed",
    label: "Public feed",
    description: "Headline + excerpt from the publisher's public feed, link to full article.",
  },
  { id: "link", label: "Headline + link only", description: "Headline and outbound link only." },
] as const;
export type DataStatusId = (typeof DATA_STATUSES)[number]["id"];
export const dataStatus = (id: DataStatusId) => DATA_STATUSES.find((d) => d.id === id)!;

export type StoryStatus = "developing" | "ongoing" | "settled";
