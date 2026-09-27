/** Run on an isolated seeded DB with NODE_OPTIONS=--conditions=react-server.
 * Uses Next's request store to exercise real cookie assertions without an HTTP server.
 */
import "next/dist/server/node-environment";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { createRequestStoreForAPI } from "next/dist/server/async-storage/request-store";
import { workAsyncStorage, type WorkStore } from "next/dist/server/app-render/work-async-storage.external";
import { workUnitAsyncStorage } from "next/dist/server/app-render/work-unit-async-storage.external";
import { getDb } from "../db/client";
import { listPublicPitches, getPitchesForContributor, suggestBlindspotsForPitch } from "../lib/queries/pitches";
import * as admin from "../lib/queries/admin";
import { listStories, search, getStory } from "../lib/queries";
import { prescreen, parseLayaResponse, rescreenPending } from "../lib/prescreen";
import { ADMIN_COOKIE, createSession, validSession, passwordMatches, takeLoginAttempt } from "../lib/admin/session";
import { cluster, loadWindow } from "../ingest/cluster";
async function main() {
  assert.equal(process.env.DATABASE_URL, "", "DATABASE_URL must be explicitly empty");
  assert(process.env.ALUNSINA_PGLITE_DIR?.includes("w2a"), "Use an isolated w2a DB");
  delete process.env.LAYA_URL;
  process.env.ADMIN_PASSWORD="smoke-password"; process.env.ADMIN_SESSION_SECRET="smoke-secret";
  const db=await getDb();
  try {
    assert.deepEqual(await prescreen("A public official is named in reporting", "pitch"), { status: "pending", categories: [], screenedAt: null });
    assert.equal(parseLayaResponse({pass:true}).status,'pending');
    assert.equal(parseLayaResponse({pass:false,categories:['threat']}).status,'flagged');
    assert.equal(passwordMatches('wrong'),false); assert.equal(passwordMatches('smoke-password'),true);
    const cookie=createSession(); assert(validSession(cookie)); assert(!validSession(cookie+'x'));
    for (let i=0;i<5;i++) assert(takeLoginAttempt('smoke')); assert(!takeLoginAttempt('smoke'));
    const list=await listPublicPitches({limit:100});
    assert(list.some(p=>p.pitchId==='sample-pitch-cebu')); assert(list.some(p=>p.pitchId==='sample-pitch-zamboanga'));
    assert(!list.some(p=>['sample-pitch-pending','sample-pitch-flagged'].includes(p.pitchId)));
    await db.tx(async t=> {
      await t.execute(`UPDATE contributors SET verified_at=NULL WHERE id='sample-journalist-cebu'`);
    });
    assert(!(await listPublicPitches()).some(p=>p.reporterId==='sample-journalist-cebu'));
    await db.execute(`UPDATE contributors SET verified_at=now(),active=false WHERE id='sample-journalist-cebu'`);
    assert.equal((await getPitchesForContributor('sample-journalist-cebu')).length,0);
    await db.execute(`UPDATE contributors SET active=true WHERE id='sample-journalist-cebu'`);
    await suggestBlindspotsForPitch('Flooding recovery','r9');
    for (const call of [()=>admin.getDashboardStats(),()=>admin.listAdminContributors(),()=>admin.listAdminPitches(),()=>admin.publishPitch('sample-pitch-cebu',{url:'https://example.org/x',headline:'x',excerpt:'x'}),()=>admin.triggerIngest(),()=>admin.exportNewsletterCsv()]) await assert.rejects(call);
    const request=new NextRequest('https://localhost/admin',{headers:{cookie:`${ADMIN_COOKIE}=${cookie}`}});
    const store=createRequestStoreForAPI(request,{pathname:'/admin'},{tags:[],expirationsByCacheKind:new Map()},undefined,undefined,undefined);
    await workAsyncStorage.run({ route: "/admin", isStaticGeneration: false } as WorkStore, () => workUnitAsyncStorage.run(store,async()=> {
      const contributor=await admin.createContributor({name:'Smoke journalist',kind:'journalist',credentials:'Sample portfolio',bio:'Sample biography',region:'r7'});
      const cid=String(contributor.id);
      const verified=await admin.setContributorVerified(cid,true); assert(verified?.source_id);
      const sourceId=verified.source_id;
      await admin.setContributorVerified(cid,false);
      const reverified=await admin.setContributorVerified(cid,true); assert.equal(reverified?.source_id,sourceId);
      await admin.deleteContributor(cid); await db.execute(`DELETE FROM sources WHERE id=$1`,[sourceId]);
      const pitch=await admin.createPitch({reporterId:'sample-journalist-cebu',topic:'smokew2a unique harbour recovery',angle:'Local reporting',timeframe:'today'});
      assert(pitch); const id=String(pitch.pitch_id);
      const pub=await admin.publishPitch(id,{url:`https://example.org/smokew2a-${id}`,headline:'smokew2a unique harbour recovery',excerpt:'Sample reporting from the harbour.'});
      assert(pub); assert.equal(pub.screening_status,'pending');
      const article=await db.one(`SELECT a.*,s.type FROM articles a JOIN sources s ON s.id=a.source_id WHERE a.id=$1`,[pub.article_id]); assert.equal(article?.type,'journalist');
      assert(!(await loadWindow(db,Date.now())).some(a=>a.id===pub.article_id));
      const sid=`smoke-${id}`;
      await db.execute(`INSERT INTO stories(id,title,topic,created_at,updated_at) VALUES ($1,$2,'Transport',now(),now())`,[sid,'smokew2a unique harbour recovery']);
      await db.execute(`UPDATE articles SET story_id=$1 WHERE id=$2`,[sid,pub.article_id]);
      assert(!(await listStories()).some(s=>s.id===sid)); assert.equal((await search('smokew2a')).length,0); assert.equal(await getStory(sid),null);
      await db.execute(`UPDATE pitch_publications SET screening_status='passed',screened_at=now() WHERE pitch_id=$1`,[id]);
      assert((await listStories()).some(s=>s.id===sid)); assert((await search('smokew2a')).some(s=>s.id===sid));
      await cluster(db); // normal journalist pipeline synchronizes pitch story links
      await admin.getDashboardStats(); await admin.listAdminAudit();
      await admin.updateStory(sid,{title:'smokew2a unique harbour recovery',summary:'Sample.',hidden:true});
      assert.equal(await getStory(sid),null); assert(!(await search('smokew2a')).some(s=>s.id===sid));
      await admin.rerunScreen('pitch','sample-pitch-flagged');
      assert.equal((await db.one(`SELECT screening_status FROM pitches WHERE pitch_id='sample-pitch-flagged'`))?.screening_status,'pending');
      await rescreenPending(50,db);
      const audit=await admin.listAdminAudit(); assert(audit.length>=4);
      await admin.deletePitch(id); await db.execute(`DELETE FROM stories WHERE id=$1`,[sid]);
    }));
    console.log('Pitch smoke passed: visibility, identity gates, journalist publishing, clustering, screening holds, auth, audit and hidden stories.');
  } finally { await db.close(); }
}
main().catch(error=> { console.error(error); process.exitCode=1; });
