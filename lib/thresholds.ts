// Detection thresholds. Ingestion (ingest/blindspots.ts) implements these and the
// Methodology page (§8) displays them verbatim — change them here only.

export const CLUSTERING = {
  windowHours: 48, // articles further apart than this never join the same Story
  similarity: 0.32, // TF-IDF cosine on normalized headline+excerpt tokens
  minSourcesForStory: 2, // single-source clusters stay as articles, not Stories
  frontPageMinSources: 2,
} as const;

export const BLINDSPOT_RULES = {
  geographic: {
    minRegionTagged: 6, // need at least this many region-tagged articles to judge
    ncrShareAbove: 0.65, // NCR share of region-tagged articles
    text: "At least 6 region-tagged articles, and more than 65% of them come from or are about NCR while the story mentions places outside NCR.",
  },
  language: {
    minArticles: 6,
    englishShareAbove: 0.8,
    text: "At least 6 articles and more than 80% in English, or no regional-language article when regional sources are covering it.",
  },
  source: {
    minArticles: 5,
    topPublisherShareAbove: 0.5,
    officialShareAbove: 0.6,
    text: "One publisher accounts for more than 50% of articles, or government statements and state-run media account for more than 60%.",
  },
  evidence: {
    minArticles: 6,
    maxPrimaryDocs: 0,
    text: "At least 6 articles and no linked primary document (law, filing, dataset, official record).",
  },
  timing: {
    maxAgeHours: 6,
    maxIndependentOrRegional: 1,
    text: "The story is under 6 hours old and has at most 1 independent or regional report so far.",
  },
  local: {
    minArticles: 5,
    maxLocalReports: 0,
    text: "At least 5 articles naming a province or city outside NCR, but no regional or community outlet from that region has reported.",
  },
  angle: {
    minAngles: 2,
    topAngleShareAbove: 0.6,
    text: "A single coverage angle accounts for more than 60% of articles while other angles appear only in a few sources.",
  },
  social: {
    minSocialMentions: 1,
    maxIndependentReports: 0,
    text: "A claim is tracked as circulating on social media and no independent outlet or fact-checker has addressed it. Suppressed as soon as a fact-check is linked.",
  },
} as const;
