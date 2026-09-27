import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { editionBoundary, scorePlacement, runEditorialEdition, type PlacementInput } from "./placement";

const now = Date.parse('2026-09-28T02:00:00Z');
const input = (outlets: PlacementInput['outlets'], age=0): PlacementInput => ({ id: 'a', updatedAt: new Date(now-age*3600_000).toISOString(), outlets, related: false });
const outlet = (id: string, type='national') => ({ id, type, region: 'ncr' });

test('reporting-only input contract and implementation exclude engagement', async () => {
  type Expected = 'id' | 'updatedAt' | 'outlets' | 'related';
  const exact: Exclude<keyof PlacementInput, Expected> extends never ? true : false = true;
  assert.equal(exact, true);
  assert.doesNotMatch(await readFile(new URL('./placement.ts', import.meta.url),'utf8'), /click|timeOnPage|engagement|virality|views/i);
});
test('distinct outlets, log scaling, normalized signals and social exclusion', () => {
  const copies = scorePlacement(input(Array.from({length:5},()=>outlet('one'))),5,now);
  const five = scorePlacement(input(Array.from({length:5},(_,i)=>outlet(String(i)))),5,now);
  assert.ok(copies.subscores.sources < five.subscores.sources);
  assert.equal(copies.subscores.sources, Math.log(2)/Math.log(6));
  assert.equal(five.subscores.sources,1);
  const social = scorePlacement(input([outlet('one'),outlet('social','social')]),5,now);
  assert.deepEqual(social,copies);
  for (const n of Object.values(five.subscores)) assert.ok(n>=0 && n<=1);
});
test('diverse source types beat higher same-type volume', () => {
  const diverse=scorePlacement(input(['national','regional','independent','community'].map((type,i)=>outlet(String(i),type))),5,now);
  const volume=scorePlacement(input(Array.from({length:5},(_,i)=>outlet(String(i)))),5,now);
  assert.ok(diverse.score>volume.score);
});
test('recency decays exponentially and related chain adds one fifth', () => {
  const fresh=scorePlacement(input([outlet('a')]),1,now);
  const older=scorePlacement(input([outlet('a')],24),1,now);
  assert.equal(older.subscores.recency,Math.exp(-1));
  assert.ok(older.score<fresh.score);
  assert.ok(Math.abs(scorePlacement({...input([outlet('a')]),related:true},1,now).score-fresh.score-0.2)<1e-10);
});
test('Manila 06:00 and 18:00 boundaries include exact transitions and midnight', () => {
  for (const [date,expected] of [
    ['2026-09-27T21:59:59Z','2026-09-27T10:00:00.000Z'],
    ['2026-09-27T22:00:00Z','2026-09-27T22:00:00.000Z'],
    ['2026-09-28T09:59:59Z','2026-09-27T22:00:00.000Z'],
    ['2026-09-28T10:00:00Z','2026-09-28T10:00:00.000Z'],
    ['2026-09-28T16:00:00Z','2026-09-28T10:00:00.000Z'],
  ]) assert.equal(editionBoundary(Date.parse(date)),expected);
});
test('isolated editorial runs freeze all slots, log all candidates and are idempotent', async () => {
  assert.equal(process.env.DATABASE_URL,'');
  const dir=await mkdtemp(path.join(tmpdir(),'alunsina-placement-'));
  process.env.ALUNSINA_PGLITE_DIR=dir;
  const {getDb}=await import('../db/client');
  const db=await getDb();
  try {
    await db.exec(`INSERT INTO sources(id,name,type,ownership,data_status,homepage) VALUES ('one','One','national','Test','rss','https://one.test'),('two','Two','regional','Test','rss','https://two.test');`);
    for(let i=0;i<18;i++) {
      await db.execute(`INSERT INTO stories(id,title,topic,created_at,updated_at) VALUES($1,$1,'Politics',$2,$3)`,['story'+i,new Date(now-24*3600_000).toISOString(),new Date(now).toISOString()]);
      for(const source of ['one','two']) await db.execute(`INSERT INTO articles(id,source_id,story_id,headline,url,published_at,region,fetched_at) VALUES($1,$2,$3,'Test',$4,$5,'ncr',$5)`,[source+i,source,'story'+i,`https://${source}.test/${i}`,new Date(now).toISOString()]);
    }
    await db.execute(`UPDATE stories SET hidden=true WHERE id='story17'`);
    await db.execute(`INSERT INTO story_links(story_id,related_story_id,relation,confidence) VALUES('story1','story2','later',0.7)`);
    const first=await db.tx(t=>runEditorialEdition(t,now));
    assert.equal(first!.scores.length,17);
    assert.equal(first!.scores[0].id,'story1');
    assert.equal((await db.one<{n:number}>(`SELECT COUNT(*)::int n FROM story_scores`))!.n,17);
    assert.equal((await db.one<{n:number}>(`SELECT COUNT(*)::int n FROM edition_placements`))!.n,21);
    await db.execute(`UPDATE stories SET updated_at=$1 WHERE id='story0'`,[new Date(now+3600_000).toISOString()]);
    assert.equal(await db.tx(t=>runEditorialEdition(t,now+3600_000)),null);
    assert.equal((await db.one<{n:number}>(`SELECT COUNT(*)::int n FROM editions`))!.n,1);
    assert.equal((await db.one<{status:string}>(`SELECT status FROM stories WHERE id='story0'`))!.status,'ongoing');
    assert.equal((await db.one<{status:string}>(`SELECT status FROM stories WHERE id='story1'`))!.status,'developing');
    await db.tx(t=>runEditorialEdition(t,Date.parse('2026-09-28T10:00:00Z')));
    assert.equal((await db.one<{n:number}>(`SELECT COUNT(*)::int n FROM editions`))!.n,2);
    assert.equal((await db.one<{n:number}>(`SELECT COUNT(*)::int n FROM story_scores`))!.n,34);
    await db.execute(`DELETE FROM stories WHERE id='story1'`);
    assert.equal((await db.one<{n:number}>(`SELECT COUNT(*)::int n FROM story_scores`))!.n,34);
    assert.equal((await db.one<{n:number}>(`SELECT COUNT(*)::int n FROM edition_placements`))!.n,42);
    await db.tx(t=>runEditorialEdition(t,now+61*86400_000));
    assert.equal((await db.one<{n:number}>(`SELECT COUNT(*)::int n FROM story_scores`))!.n,0);
  } finally { await db.close(); await rm(dir,{recursive:true,force:true}); }
});
