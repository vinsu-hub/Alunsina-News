import type {
  BlindspotTypeId,
  DataStatusId,
  IslandGroupId,
  LanguageId,
  RegionId,
  SourceTypeId,
  StoryStatus,
} from "./taxonomy";

export interface Source {
  id: string;
  name: string;
  type: SourceTypeId;
  ownership: string;
  ownershipSource: string | null;
  dataStatus: DataStatusId;
  paywalled: boolean;
  homepage: string;
  feedUrl: string | null;
  regions: RegionId[];
  languages: LanguageId[];
  topics: string[];
}

export interface Article {
  id: string;
  sourceId: string;
  storyId: string | null;
  headline: string;
  byline: string | null;
  url: string;
  excerpt: string;
  publishedAt: string; // ISO
  language: LanguageId;
  region: RegionId | null;
  source: Source;
}

/** Compact counts shown on every story card: "18 sources · 7 regions · 3 languages". */
export interface StoryStats {
  sources: number;
  articles: number;
  regions: number;
  languages: number;
  byType: Partial<Record<SourceTypeId, number>>; // distinct sources per type
}

export interface StorySummary {
  id: string;
  title: string;
  summary: string;
  status: StoryStatus;
  topic: string;
  updatedAt: string;
  stats: StoryStats;
  leadSource: Source | null;
}

export interface Emphasis {
  sourceType: SourceTypeId;
  points: string[];
}

export interface Angle {
  angle: string;
  share: number;
  note: string | null;
}

export interface Blindspot {
  id: number;
  storyId: string;
  storyTitle: string;
  type: BlindspotTypeId;
  reason: string;
  example: string;
  linkLabel: string | null;
  linkHref: string | null;
  detectedAt: string;
}

export interface TimelineEvent {
  at: string;
  label: string;
  sourceType: SourceTypeId | null;
  articleId: string | null;
}

export interface Evidence {
  kind: "document" | "statement" | "dataset" | "study" | "report";
  title: string;
  publisher: string;
  url: string;
  publishedAt: string | null;
}

export interface FactCheck {
  claim: string;
  org: string;
  rating: string | null;
  url: string;
  publishedAt: string;
  storyId: string | null;
}

export interface RegionCoverage {
  regionId: RegionId;
  articles: number;
  share: number; // of all region-tagged articles in scope
}

export interface IslandCoverage {
  island: IslandGroupId;
  articles: number;
  share: number;
  regions: RegionCoverage[];
}

export interface StoryDetail extends StorySummary {
  createdAt: string;
  articles: Article[];
  emphasis: Emphasis[];
  angles: Angle[];
  blindspots: Blindspot[];
  timeline: TimelineEvent[];
  evidence: Evidence[];
  factChecks: FactCheck[];
  coverage: IslandCoverage[];
  languages: { language: LanguageId; articles: number }[];
}

export interface Edition {
  date: string; // ISO date of the edition
  briefing: StorySummary[]; // top 5
  lead: StoryDetail | null;
  featured: StorySummary[];
  topStories: StorySummary[];
  blindspots: Blindspot[]; // one current example per type at most
  coverage: IslandCoverage[]; // platform-wide, today
  trendingTopics: { topic: string; stories: number }[];
  platformStats: { articlesToday: number; sources: number; stories: number };
}

export interface SourceProfile extends Source {
  articleCount: number;
  storyCount: number;
  recentArticles: Article[];
  stories: StorySummary[];
  coverage: RegionCoverage[];
}
