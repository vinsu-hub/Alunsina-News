/**
 * Text utilities shared by clustering and derivation: tokenization with
 * English + Filipino stopwords, TF-IDF vectors, cosine similarity, and
 * capitalized-phrase (entity) extraction.
 */
const STOP = new Set(
  `a about above after again against all also am an and any are as at be because been before being below between both but by can could
  did do does doing down during each few for from further had has have having he her here hers him his how i if in into is it its itself
  just me more most my no nor not now of off on once only or other our out over own same she should so some such than that the their them
  then there these they this those through to too under until up very was we were what when where which while who whom why will with would
  you your said says say new amid over after says per via ang ng mga sa na si ay at kay nang ni para mula hindi siya sila kami tayo ito iyon
  din rin lang po naman pa ba may mayroon wala kung dahil pero kasi niya nila namin natin ating kanilang nito noon ngayon bilang upang ayon
  nga og kag sang ug ti iti dagiti ken ket year years day days week today yesterday tomorrow monday tuesday wednesday thursday friday
  almost also already still yung nung ngayon bringing saturday sunday philippines philippine filipino filipinos news update updates report reports official officials government`.split(/\s+/),
);

export const normalize = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function tokenize(s: string): string[] {
  return normalize(s)
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 3 && !STOP.has(t) && !/^\d+$/.test(t))
    .map((t) => (t.length > 4 && t.endsWith("s") && !t.endsWith("ss") ? t.slice(0, -1) : t));
}

/** Adjacent non-stopword pairs, for phrase extraction. */
export function bigrams(s: string): string[] {
  const words = normalize(s).split(/[^a-z0-9]+/);
  const out: string[] = [];
  for (let i = 0; i < words.length - 1; i++) {
    const a = words[i], b = words[i + 1];
    if (a.length >= 3 && b.length >= 3 && !STOP.has(a) && !STOP.has(b) && !/^\d+$/.test(a) && !/^\d+$/.test(b))
      out.push(`${a} ${b}`);
  }
  return out;
}

export type Vec = Map<string, number>;

export function termFreq(tokens: string[], weight = 1, into: Vec = new Map()): Vec {
  for (const t of tokens) into.set(t, (into.get(t) ?? 0) + weight);
  return into;
}

export function idfFrom(docs: Vec[]): Map<string, number> {
  const df = new Map<string, number>();
  for (const d of docs) for (const t of d.keys()) df.set(t, (df.get(t) ?? 0) + 1);
  const n = docs.length || 1;
  const idf = new Map<string, number>();
  for (const [t, c] of df) idf.set(t, Math.log(1 + n / c));
  return idf;
}

export function tfidf(tf: Vec, idf: Map<string, number>): Vec {
  const v: Vec = new Map();
  let norm = 0;
  for (const [t, c] of tf) {
    const w = (1 + Math.log(c)) * (idf.get(t) ?? Math.log(2));
    v.set(t, w);
    norm += w * w;
  }
  norm = Math.sqrt(norm) || 1;
  for (const [t, w] of v) v.set(t, w / norm);
  return v;
}

export function cosine(a: Vec, b: Vec): number {
  const [s, l] = a.size < b.size ? [a, b] : [b, a];
  let dot = 0;
  for (const [t, w] of s) {
    const o = l.get(t);
    if (o) dot += w * o;
  }
  return dot;
}

/** Sum of unit vectors, re-normalized. */
export function centroid(vs: Vec[]): Vec {
  const c: Vec = new Map();
  for (const v of vs) for (const [t, w] of v) c.set(t, (c.get(t) ?? 0) + w);
  let norm = 0;
  for (const w of c.values()) norm += w * w;
  norm = Math.sqrt(norm) || 1;
  for (const [t, w] of c) c.set(t, w / norm);
  return c;
}

/** Capitalized multi-word phrases and acronyms in a headline ("Ayungin Shoal", "DOJ"). */
export function entities(headline: string): Set<string> {
  const out = new Set<string>();
  const words = headline.replace(/[‘’“”"(),:;!?]/g, " ").split(/\s+/).filter(Boolean);
  let run: string[] = [];
  const flush = () => {
    if (run.length) {
      const phrase = run.join(" ").toLowerCase();
      if (run.length > 1 || phrase.length >= 4) out.add(phrase);
    }
    run = [];
  };
  words.forEach((w, i) => {
    const acronym = /^[A-Z]{2,6}$/.test(w);
    const cap = /^[A-Z][a-zñ]+/.test(w) && i > 0; // skip sentence-initial capital
    if (acronym) {
      flush();
      if (!STOP.has(w.toLowerCase())) out.add(w.toLowerCase());
    } else if (cap && !STOP.has(w.toLowerCase())) run.push(w);
    else flush();
  });
  flush();
  return out;
}

export const jaccard = (a: Set<string>, b: Set<string>) => {
  if (!a.size || !b.size) return 0;
  let n = 0;
  for (const x of a) if (b.has(x)) n++;
  return n / (a.size + b.size - n);
};

export function slugify(s: string, max = 64) {
  return normalize(s).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, max).replace(/-[^-]*$/, "");
}

const ABBREV = /\b(?:[A-Z]|Jr|Sr|Dr|Mr|Mrs|Ms|Gen|Sen|Rep|Gov|Atty|Sec|St|No|Nos|Pres|Col|Lt|Sgt|Brig|Maj|Capt|Supt|Engr|Hon|Rev|Fr|vs|Inc|Corp|Co|Jan|Feb|Mar|Apr|Aug|Sept|Sep|Oct|Nov|Dec|Mt|Brgy|Ave|Blvd|Cong|Usec|Asec|Dir|Supt|Adm|Vice|Ph|P)\.$/;

/** Sentence splitter that doesn't break on initials or common PH abbreviations (Jr., Sen., Brgy., P.). */
export function splitSentences(text: string): string[] {
  const parts = text.split(/(?<=[.!?]["”’]?)\s+(?=["“‘]?[A-Z0-9])/);
  const out: string[] = [];
  for (const p of parts) {
    if (out.length && ABBREV.test(out[out.length - 1])) out[out.length - 1] += " " + p;
    else out.push(p);
  }
  return out.map((s) => s.trim()).filter(Boolean);
}

/** Removes datelines ("MANILA, Philippines —") and bylines ("By Juan Dela Cruz") from the start of feed text. */
export function stripLead(text: string): string {
  return text
    .replace(/^\s*By\s+[A-Z][\w.'-]*(\s+[A-Z][\w.'-]*){0,4}\s*(,\s*[A-Z][\w ]{0,30})?[\s|:–—-]+/, "")
    .replace(/^\s*[A-Z][A-Z .'-]{2,30}(,\s*[A-Z][A-Za-z ]{2,30})?\s*(\([A-Z]{2,6}\))?\s*[—–-]{1,2}\s*/, "")
    .trim();
}
