import assert from "node:assert/strict";
import test from "node:test";
import { candidateTerms, rankTrendingTerms, type TrendArticle } from "./trends";
const now = Date.UTC(2026, 8, 27);
const row = (id: number, headline: string, source = `source-${id}`, story = `story-${id % 2}`, age = 1): TrendArticle => ({ id: String(id),headline,source_id:source,story_id:story,published_at:new Date(now-age*86400_000).toISOString() });
test("excludes outlets, generic places and weekdays", () => {
 for (const headline of ["Reports from Manila Standard on Monday in Philippines", "Updates in Metro Manila on Tuesday", "News from GMA Network on Friday"]) {
  const terms = candidateTerms(headline);
  for (const term of ["manila standard","philippines","metro manila","monday","tuesday","friday","gma network"]) assert.equal(terms.has(term),false,term);
 }
});
test("requires three distinct sources and two stories", () => {
 assert.equal(rankTrendingTerms([row(1,"BSKE starts"),row(2,"BSKE delayed")],now).length,0);
 assert.equal(rankTrendingTerms([1,2,3].map((i)=>row(i,"BSKE starts",undefined,"one-story")),now).length,0);
 assert.equal(rankTrendingTerms([1,2,3].map((i)=>row(i,"BSKE starts","one-source")),now).length,0);
 const [term] = rankTrendingTerms([1,2,3].map((i)=>row(i,"BSKE starts")),now);
 assert.equal(term.term,"BSKE"); assert.equal(term.sources,3); assert.equal(term.stories,2);
});
test("merges case and possessives, counts previous window and deduplicates articles",()=>{
 const rows=[row(1,"Mary Jane Veloso’s appeal"),row(2,"Mary Jane Veloso returns"),row(3,"MARY JANE VELOSO returns"),row(4,"Mary Jane Veloso appeal",undefined,undefined,9)];
 const terms=rankTrendingTerms([...rows,rows[0]],now);
 const term=terms.find((t)=>t.slug==='mary-jane-veloso');
 assert.ok(term); assert.equal(term.articles,3); assert.equal(term.prev_articles,1);
});
