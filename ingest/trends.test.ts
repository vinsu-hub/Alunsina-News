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
test("rejects all calendar tokens and vague institutions, retaining useful acronyms", () => {
 for (const token of "Jan January Feb February Mar March Apr April May Jun June Jul July Aug August Sep Sept September Oct October Nov November Dec December Monday Tuesday Wednesday Thursday Friday Saturday Sunday Today Yesterday Tomorrow Palace Senate House Court Government Police".split(" ")) {
  assert.equal(candidateTerms(`${token}. announces developments`).has(token.toLowerCase()), false, token);
 }
 for (const token of ["DPWH", "PNP", "DepEd", "COMELEC", "BSKE", "NFA", "DOH", "PAGASA", "MMDA"]) assert.ok(candidateTerms(`${token} announces developments`).has(token.toLowerCase()), token);
 assert.ok(candidateTerms("Senate Impeachment Trial resumes").has("senate impeachment trial"));
});
test("live-list regression merges Sara into Sara Duterte and removes date and generic trends", () => {
 const rows = [1,2,3].flatMap((i) => [row(i,"Sara Duterte visits China"), row(i+10,"Sara asks Palace on Sept. 27"), row(i+20,"Sara Duterte speaks on Monday"), row(i+30,"Marcos directs DPWH",undefined,`works-${i%2}`), row(i+40,"PNP announces operations",undefined,`police-${i%2}`)]);
 const terms = rankTrendingTerms(rows, now);
 for (const slug of ["sara-duterte", "china", "marcos", "dpwh", "pnp"]) assert.ok(terms.some((t) => t.slug === slug), slug);
 for (const slug of ["sept", "sara", "palace"]) assert.equal(terms.some((t) => t.slug === slug), false, slug);
 assert.equal(terms.find((t) => t.slug === "sara-duterte")?.articles, 9);
});
test("drops a subterm at 60 percent mention containment but retains independent mentions", () => {
 const make = (inside: number) => Array.from({length:5}, (_,i) => row(i, i < inside ? "South China Sea dispute" : "China speaks"));
 assert.equal(rankTrendingTerms(make(3), now).some((t) => t.slug === "china"), false);
 assert.equal(rankTrendingTerms(make(2), now).some((t) => t.slug === "china"), true);
 const independent = [...make(3), row(10,"China speaks"), row(11,"China speaks")];
 assert.ok(rankTrendingTerms(independent, now).some((t) => t.slug === "china"));
});
test("ambiguous first names are not merged and aliases preserve previous-window counts", () => {
 const ambiguous = [1,2,3].flatMap((i) => [row(i,"Sara Duterte speaks"),row(i+10,"Sara Garcia speaks",undefined,`other-${i}`),row(i+20,"Sara speaks",undefined,`solo-${i}`)]);
 assert.equal(rankTrendingTerms(ambiguous,now).find((t) => t.slug === "sara-duterte")?.articles,3);
 const rows = [row(1,"Sara Duterte speaks"),row(2,"Sara speaks"),row(3,"Sara speaks"),row(4,"Sara speaks",undefined,undefined,9)];
 const term = rankTrendingTerms([...rows,rows[1]],now).find((t) => t.slug === "sara-duterte");
 assert.ok(term); assert.equal(term.articles,3); assert.equal(term.prev_articles,1);
});
test("caps the ticker at ten and allows at most two heavily overlapping terms", () => {
 const shared = [1,2,3].map((i) => row(i,"China backs Marcos alongside DPWH and PNP"));
 assert.equal(rankTrendingTerms(shared,now).length,2);
 const rows = ["China","Marcos","DPWH","PNP","DepEd","COMELEC","BSKE","NFA","DOH","PAGASA","MMDA"].flatMap((name,j) => [1,2,3].map((i) => row(j*10+i,`${name} announces plans`,undefined,`topic-${j}-${i%2}`)));
 assert.equal(rankTrendingTerms(rows,now).length,10);
});
test("production names normalize roles and possessives without guessing bare Duterte", () => {
 for (const headline of ["Sara Duterte itinangging kilala si Gracioso, tumanggap ng pera mula rito", "Palace tells Sara Duterte: Defend with proof, not fallacies", "Pagpapardon kay Mary Jane Veloso, nasa executive power ni Pres. Marcos – VP Sara", "Vice President Sara Duterte’s response"]) {
  assert.equal(candidateTerms(headline).get("sara duterte"), "Sara Duterte");
  assert.equal(candidateTerms(headline).has("duterte"), false);
 }
 for (const headline of ["Ex-President Duterte faces trial", "FPRRD faces trial", "Former President Rodrigo Duterte faces trial"]) assert.equal(candidateTerms(headline).get("rodrigo duterte"), "Rodrigo Duterte");
 assert.equal(candidateTerms("Duterte counsel seeks limit").has("duterte"), false);
});
test("production geographic suffixes and generic categories never trend alone", () => {
 for (const headline of ["DepEd-Davao City recommends transparent school bags for students, but safety measure mandatory’", "₱3.7M worth of suspected marijuana seized in Cebu City", "Mental Health and Surveys: We Cannot Help What We Do Not Measure", "DOH health advisory", "Weather Economy Prices Province Island Shoal Sur Norte"]) {
  const terms = candidateTerms(headline);
  for (const word of ["city", "province", "island", "health", "weather", "economy", "prices", "shoal", "sur", "norte"]) assert.equal(terms.has(word), false, word);
 }
 assert.ok(candidateTerms("DepEd-Davao City recommends transparent school bags for students").has("davao city"));
 assert.ok(candidateTerms("₱3.7M worth of suspected marijuana seized in Cebu City").has("cebu city"));
 assert.ok(candidateTerms("DOH health advisory").has("doh"));
});
test("production El Niño variants share a diacritic-preserving display and slug", () => {
 const headlines = ["El Niño affecting 14 regions, agriculture sustains P6.87-B damage", "Presyo ng palay inaasahang tataas ang presyo kapag tumama ang severe El Nino – NFA", "NFA expects palay prices to rise to P30/kg as severe El Niño looms"];
 for (const headline of headlines) {
  assert.equal(candidateTerms(headline).get("el nino"), "El Niño");
  assert.equal(candidateTerms(headline).has("nino"), false);
 }
 const term = rankTrendingTerms(headlines.map((headline, i) => row(i, headline)), now).find((term) => term.slug === "el-nino");
 assert.equal(term?.term, "El Niño");
});
