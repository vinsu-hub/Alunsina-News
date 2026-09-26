/**
 * Normalizes raw feed items into article rows: canonical URL, HTML-free text,
 * a <=2-sentence excerpt (§5A — we never store full text), language detection
 * (Philippine function-word scoring, franc as backup), and region tagging via
 * the gazetteer.
 */
import { createHash } from "node:crypto";
import { franc } from "franc-min";
import { PLACES } from "../lib/gazetteer";
import { splitSentences, stripLead } from "./text";
import type { LanguageId, RegionId, SourceTypeId } from "../lib/taxonomy";

export const EXCERPT_MAX_CHARS = 300;
export const EXCERPT_MAX_SENTENCES = 2;

export function canonicalUrl(raw: string): string {
  try {
    const u = new URL(raw.trim());
    u.hash = "";
    for (const k of [...u.searchParams.keys()])
      if (/^(utm_|fbclid|gclid|mc_|ref$|source$|amp$)/i.test(k)) u.searchParams.delete(k);
    u.hostname = u.hostname.toLowerCase();
    return u.toString().replace(/\?$/, "");
  } catch {
    return raw.trim();
  }
}

export const articleId = (url: string) => createHash("sha1").update(url).digest("hex").slice(0, 16);

const NAMED: Record<string, string> = {
  amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", nbsp: " ", ndash: "–", mdash: "—", hellip: "…",
  rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", ntilde: "ñ", Ntilde: "Ñ",
};

export function stripHtml(s: string): string {
  return s
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, n) => NAMED[n] ?? m)
    .replace(/\s+/g, " ")
    .trim();
}

/** First two sentences, hard-capped. Drops WordPress "The post … appeared first on …" tails. */
export function makeExcerpt(text: string): string {
  const clean = stripLead(text)
    .replace(/The post .+? appeared first on .+?$/i, "")
    .replace(/\s*\[(…|\.\.\.)\]\s*$/, "…")
    .replace(/\s*(Read more|Continue reading)\b.*$/i, "")
    .trim();
  let out = splitSentences(clean).slice(0, EXCERPT_MAX_SENTENCES).join(" ").trim();
  if (out.length > EXCERPT_MAX_CHARS) out = out.slice(0, EXCERPT_MAX_CHARS - 1).replace(/\s+\S*$/, "") + "…";
  return out;
}

/* ---------- language ---------- */

// Distinctive function words per language. Words shared across Philippine
// languages (ang, sa, mga, siya…) are deliberately left out.
const MARKERS: Record<Exclude<LanguageId, "other">, string[]> = {
  en: ["the", "of", "and", "to", "is", "for", "with", "that", "was", "are", "from", "will", "has", "have", "their"],
  fil: ["ng", "ay", "hindi", "nang", "ito", "naman", "na", "si", "niya", "ayon", "dahil", "pero", "kanilang", "ngayong", "rin", "din"],
  ceb: ["nga", "og", "ug", "dili", "karon", "adunay", "gikan", "niini", "usab", "kini", "kaayo", "mao", "nila", "wala'y"],
  ilo: ["ti", "iti", "dagiti", "ken", "ket", "saan", "isuna", "idiay", "manipud", "daytoy", "kadagiti"],
  hil: ["sang", "kag", "indi", "subong", "gid", "halin", "sini", "ini", "man"],
  war: ["han", "ngan", "hin", "dida", "waray", "hiya", "didto"],
  pam: ["ing", "king", "keng", "deng", "karing", "ngeni", "ala", "bang", "ning"],
  bik: ["kan", "nin", "dai", "iyo", "ngonyan", "sinda", "digdi"],
};

const FRANC_MAP: Record<string, LanguageId> = {
  eng: "en", tgl: "fil", fil: "fil", ceb: "ceb", ilo: "ilo", hil: "hil", war: "war", pam: "pam", bik: "bik", bcl: "bik",
};

export function detectLanguage(text: string, sourceLanguages: LanguageId[]): LanguageId {
  const words = text.toLowerCase().split(/[^a-zñ']+/).filter(Boolean);
  const scores = new Map<LanguageId, number>();
  for (const [lang, marks] of Object.entries(MARKERS) as [LanguageId, string[]][]) {
    const set = new Set(marks);
    scores.set(lang, words.filter((w) => set.has(w)).length);
  }
  const ranked = [...scores].sort((a, b) => b[1] - a[1]);
  const [top, second] = ranked;
  if (top[1] >= 2 && top[1] > second[1]) return top[0];
  if (top[1] >= 2 && top[1] === second[1]) {
    // Tie: prefer a language the source publishes in.
    const tied = ranked.filter((r) => r[1] === top[1]).map((r) => r[0]);
    return tied.find((l) => sourceLanguages.includes(l)) ?? tied[0];
  }
  const f = FRANC_MAP[franc(text, { minLength: 20 })];
  if (f) return f;
  return sourceLanguages[0] ?? "en";
}

/* ---------- regions ---------- */

// Names that are also common surnames or words: only accepted when the
// place's province is also named in the same text.
const AMBIGUOUS = new Set(["Santiago", "Valencia", "Roxas", "Rodriguez", "Aurora", "Quirino", "San Pedro", "Alaminos", "Victoria", "Antique", "Tanauan", "San Juan"]);
// Aliases too generic to tag on their own.
const SKIP_ALIASES = new Set(["Quezon", "Malay", "General Luna", "UPLB", "QC"]);
const EXTRA: [string, RegionId][] = [
  ["Davao", "r11"], ["Zamboanga", "r9"], ["Bicol", "r5"], ["Cordillera", "car"], ["Bangsamoro", "barmm"],
  ["Central Luzon", "r3"], ["CALABARZON", "r4a"], ["Calabarzon", "r4a"], ["MIMAROPA", "r4b"], ["Mimaropa", "r4b"],
  ["Ilocos", "r1"], ["Caraga", "r13"], ["SOCCSKSARGEN", "r12"], ["Soccsksargen", "r12"], ["Western Visayas", "r6"],
  ["Central Visayas", "r7"], ["Eastern Visayas", "r8"], ["Negros", "nir"], ["Northern Mindanao", "r10"],
  ["Zamboanga Peninsula", "r9"], ["Cagayan Valley", "r2"], ["Ilocos Region", "r1"], ["NCR", "ncr"],
];

interface Pattern { name: string; region: RegionId; province: string; ambiguous: boolean; re: RegExp }

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const PATTERNS: Pattern[] = (() => {
  const out: Pattern[] = [];
  const add = (name: string, region: RegionId, province: string) => {
    if (name.includes("(") || SKIP_ALIASES.has(name)) return;
    // Case-sensitive: place names are proper nouns. Rizal the person/landmark is excluded.
    const guard = name === "Rizal" ? "(?<!Jose )(?<!José )" : "";
    const tail = name === "Rizal" ? "(?!\\s+(Park|Memorial|Avenue|Monument|Day|Stadium|Street))" : "";
    out.push({ name, region, province, ambiguous: AMBIGUOUS.has(name), re: new RegExp(`${guard}\\b${esc(name)}\\b${tail}`, "g") });
  };
  for (const p of PLACES) {
    add(p.name, p.region, p.province);
    for (const a of p.aliases ?? []) add(a, p.region, p.province);
  }
  for (const [n, r] of EXTRA) add(n, r, n);
  return out.sort((a, b) => b.name.length - a.name.length); // longest match wins
})();

/** Weighted region mentions; headline counts double. */
export function regionMentions(headline: string, excerpt: string, stripNames: string[] = []): Map<RegionId, number> {
  const counts = new Map<RegionId, number>();
  const scan = (raw: string, weight: number) => {
    let text = raw;
    for (const n of stripNames) text = text.split(n).join(" ");
    for (const p of PATTERNS) {
      if (!p.re.test(text)) continue;
      p.re.lastIndex = 0;
      if (p.ambiguous && !text.includes(p.province.replace(" Province", ""))) {
        text = text.replace(p.re, " ");
        continue;
      }
      const n = (text.match(p.re) ?? []).length;
      counts.set(p.region, (counts.get(p.region) ?? 0) + n * weight);
      text = text.replace(p.re, " "); // consume so shorter names don't double count
    }
  };
  scan(headline, 2);
  scan(excerpt, 1);
  return counts;
}

export function tagRegion(
  headline: string,
  excerpt: string,
  source: { name: string; type: SourceTypeId; regions: RegionId[] },
): RegionId | null {
  // Strip publisher names ("Manila Bulletin", "Mindanao Times") so they don't count as places.
  const counts = regionMentions(headline, excerpt, [source.name, "Manila Bulletin", "Manila Times", "Manila Standard", "Philippine Star"]);
  if (counts.size) return [...counts].sort((a, b) => b[1] - a[1])[0][0];
  if ((source.type === "regional" || source.type === "community") && source.regions.length === 1) return source.regions[0];
  return null;
}
