import type { SourceTypeId } from "../taxonomy";
import type { StoryStats } from "../types";
export interface ReportingArticleRow { story_id: string; source_id: string; type: string; region: string | null; language: string }
/** Compute story counts from reporting publishers only; social posts stay signals. */
export function summarizeStoryStats(rows: ReportingArticleRow[], storyIds: string[]): Map<string, StoryStats> {
  const acc = new Map<string, { n: number; src: Map<string,string>; reg: Set<string>; lang: Set<string> }>();
  for (const row of rows) {
    if (row.type === "social") continue;
    let a = acc.get(row.story_id);
    if (!a) { a = { n: 0, src: new Map(), reg: new Set(), lang: new Set() }; acc.set(row.story_id,a); }
    a.n++;
    a.src.set(row.source_id,row.type);
    if (row.region) a.reg.add(row.region);
    a.lang.add(row.language);
  }
  const out = new Map<string,StoryStats>();
  for (const id of storyIds) {
    const a=acc.get(id), byType: StoryStats["byType"]={};
    a?.src.forEach((type) => { byType[type as SourceTypeId]=(byType[type as SourceTypeId] ?? 0)+1; });
    out.set(id,{sources:a?.src.size ?? 0,articles:a?.n ?? 0,regions:a?.reg.size ?? 0,languages:a?.lang.size ?? 0,byType});
  }
  return out;
}
