/**
 * Potential-blindspot detectors. Each rule implements exactly the threshold
 * published in lib/thresholds.ts (BLINDSPOT_RULES), which the Methodology page
 * renders verbatim. Every flag carries a concrete, numeric reason and a link
 * into the story. A Social blindspot is suppressed once a fact-check is linked.
 */
import { replaceRows } from "./perf";
import type { Db } from "../db/client";
import { BLINDSPOT_RULES as R } from "../lib/thresholds";
import { REGIONS, type BlindspotTypeId } from "../lib/taxonomy";
import { anglesFor, loadMembers, type MemberRow } from "./derive";
import { regionMentions } from "./normalize";

interface Flag {
  type: BlindspotTypeId;
  reason: string;
  example: string;
  linkLabel: string;
  linkHref: string;
}

const REGIONAL_LANGS = new Set(["ceb", "ilo", "hil", "pam", "war", "bik", "other"]);
const label = (id: string) => REGIONS.find((r) => r.id === id)?.label ?? id;
const short = (t: string) => (t.length > 70 ? t.slice(0, 67).replace(/\s+\S*$/, "") + "…" : t);
const list = (xs: string[]) => (xs.length <= 2 ? xs.join(" and ") : `${xs.slice(0, -1).join(", ")} and ${xs.at(-1)}`);

export function detect(ms: MemberRow[], storyId: string, title: string, ctx: { hasFactCheck: boolean; now: number }): Flag[] {
  const flags: Flag[] = [];
  const socialPosts = ms.filter((m) => m.sourceType === "social");
  ms = ms.filter((m) => m.sourceType !== "social");
  const n = ms.length;
  const q = `“${short(title)}”`;
  const href = (anchor: string) => `/story/${storyId}${anchor}`;

  // Geographic
  const tagged = ms.filter((m) => m.region);
  const ncr = tagged.filter((m) => m.region === "ncr").length;
  const mentionedOutside = new Set<string>();
  for (const m of ms) for (const r of regionMentions(m.headline, m.excerpt).keys()) if (r !== "ncr") mentionedOutside.add(r);
  if (tagged.length >= R.geographic.minRegionTagged && ncr / tagged.length > R.geographic.ncrShareAbove && mentionedOutside.size) {
    const others = [...mentionedOutside].map(label);
    flags.push({
      type: "geographic",
      reason: `${ncr} of ${tagged.length} region-tagged articles come from or are about NCR, while the reporting also mentions ${list(others.slice(0, 4))}.`,
      example: `Most coverage of ${q} comes from Metro Manila. Few reports found from ${list(others.slice(0, 3))}.`,
      linkLabel: "See coverage by region",
      linkHref: href("#coverage"),
    });
  }

  // Language
  const en = ms.filter((m) => m.language === "en").length;
  const regionalLang = ms.filter((m) => REGIONAL_LANGS.has(m.language)).length;
  const regionalSourcesPresent = ms.some((m) => m.sourceType === "regional" || m.sourceType === "community");
  if (n >= R.language.minArticles && (en / n > R.language.englishShareAbove || (regionalSourcesPresent && regionalLang === 0))) {
    const fil = ms.filter((m) => m.language === "fil").length;
    flags.push({
      type: "language",
      reason: `${en} of ${n} articles are in English, ${fil} in Filipino, and ${regionalLang} in a regional language.`,
      example: `Limited Filipino and regional-language coverage of ${q}.`,
      linkLabel: "See languages",
      linkHref: href("#coverage"),
    });
  }

  // Source concentration
  if (n >= R.source.minArticles) {
    const bySource = new Map<string, { name: string; c: number }>();
    for (const m of ms) bySource.set(m.sourceId, { name: m.sourceName, c: (bySource.get(m.sourceId)?.c ?? 0) + 1 });
    const top = [...bySource.values()].sort((a, b) => b.c - a.c)[0];
    const official = ms.filter((m) => m.sourceType === "government" || m.sourceType === "state").length;
    if (top.c / n > R.source.topPublisherShareAbove)
      flags.push({
        type: "source",
        reason: `${top.c} of ${n} articles come from a single publisher (${top.name}).`,
        example: `Coverage of ${q} relies heavily on one publisher.`,
        linkLabel: "See source list",
        linkHref: href("#sources"),
      });
    else if (official / n > R.source.officialShareAbove)
      flags.push({
        type: "source",
        reason: `${official} of ${n} articles are government statements or state-run media.`,
        example: `Coverage of ${q} relies heavily on official statements.`,
        linkLabel: "See source list",
        linkHref: href("#sources"),
      });
  }

  // Evidence
  const primary = ms.filter((m) => m.sourceType === "primary").length;
  if (n >= R.evidence.minArticles && primary <= R.evidence.maxPrimaryDocs)
    flags.push({
      type: "evidence",
      reason: `${n} articles, but no linked primary document (law, filing, dataset, or official record) yet.`,
      example: `Claims in ${q} lack linked primary-source documentation so far.`,
      linkLabel: "See evidence",
      linkHref: href("#evidence"),
    });

  // Timing
  const first = Math.min(...ms.map((m) => Date.parse(m.publishedAt)));
  const indepRegional = ms.filter((m) => m.sourceType === "independent" || m.sourceType === "regional").length;
  const distinctSources = new Set(ms.map((m) => m.sourceId)).size;
  if ((ctx.now - first) / 3600_000 < R.timing.maxAgeHours && distinctSources >= R.timing.minSources && indepRegional <= R.timing.maxIndependentOrRegional)
    flags.push({
      type: "timing",
      reason: `First reported ${Math.max(1, Math.round((ctx.now - first) / 3600_000))}h ago with ${indepRegional} independent or regional report${indepRegional === 1 ? "" : "s"} so far.`,
      example: `${q} is developing faster than available independent and regional reporting.`,
      linkLabel: "See timeline",
      linkHref: href("#timeline"),
    });

  // Local
  const outside = ms.filter((m) => m.region && m.region !== "ncr");
  if (outside.length >= R.local.minArticles) {
    const regions = new Set(outside.map((m) => m.region!));
    const localReports = ms.filter(
      (m) => (m.sourceType === "regional" || m.sourceType === "community") && m.sourceRegions.some((r) => regions.has(r)),
    ).length;
    if (localReports <= R.local.maxLocalReports) {
      const names = [...regions].map(label);
      flags.push({
        type: "local",
        reason: `${outside.length} articles name places in ${list(names.slice(0, 4))}, but no regional or community outlet from there has reported.`,
        example: `Few reports from local outlets in ${list(names.slice(0, 3))} on ${q}.`,
        linkLabel: "See source list",
        linkHref: href("#sources"),
      });
    }
  }

  // Angle
  const angles = anglesFor(ms).filter((a) => a.angle !== "General reporting");
  if (angles.length >= R.angle.minAngles && angles[0].share > R.angle.topAngleShareAbove) {
    const others = angles.slice(1).map((a) => `${a.angle.toLowerCase()} (${Math.round(a.share * n)})`);
    flags.push({
      type: "angle",
      reason: `${Math.round(angles[0].share * 100)}% of articles focus on ${angles[0].angle.toLowerCase()}; ${list(others)} appear in few articles.`,
      example: `Coverage of ${q} centers on ${angles[0].angle.toLowerCase()}; other angles get little attention.`,
      linkLabel: "Compare coverage",
      linkHref: href("?compare=1"),
    });
  }

  // Social / misinformation
  const reddit = socialPosts.filter((m) => m.sourceId === "social-reddit").length;
  const x = socialPosts.filter((m) => m.sourceId === "social-x").length;
  const social = reddit + x;
  const independent = ms.filter((m) => m.sourceType === "independent").length;
  if (social >= R.social.minSocialMentions && independent <= R.social.maxIndependentReports && !ctx.hasFactCheck)
    flags.push({
      type: "social",
      reason: `${reddit} Reddit post${reddit === 1 ? "" : "s"}, ${x} X post${x === 1 ? "" : "s"}, and no independent reporting yet.`,
      example: `A claim related to ${q} is circulating online. No independent outlet has reported on it yet.`,
      linkLabel: "See the claim and official statements",
      linkHref: href("#blindspots"),
    });

  return flags;
}

export async function detectBlindspots(db: Db, storyId: string, now = Date.now(), cached?: { members: MemberRow[]; title: string; hasFactCheck: boolean }): Promise<number> {
  const story = cached ?? (await db.one(`SELECT title FROM stories WHERE id = $1`, [storyId])) as { title: string } | undefined;
  if (!story) return 0;
  const ms = cached?.members ?? await loadMembers(db, storyId);
  const hasFactCheck = cached?.hasFactCheck ?? Boolean(await db.one(`SELECT 1 FROM fact_checks WHERE story_id = $1 LIMIT 1`, [storyId]));
  const flags = detect(ms, storyId, story.title, { hasFactCheck, now });
  const at = new Date(now).toISOString();
  await replaceRows(db, "blindspots", ["story_id", "type", "reason", "example", "link_label", "link_href", "detected_at"], storyId, flags.map((f) => [storyId, f.type, f.reason, f.example, f.linkLabel, f.linkHref, at]));
  return flags.length;
}
