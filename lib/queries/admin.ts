import "server-only";
import { randomUUID } from "node:crypto";
import { getDb, type Db, type Row } from "@/db/client";
import { assertAdminSession } from "@/lib/admin/session";
import * as v from "@/lib/admin/validation";
import { prescreen, rescreenPending } from "@/lib/prescreen";
import { runIngest } from "@/ingest/pipeline";
import { articleId } from "@/ingest/normalize";
import type { PitchStatus } from "./pitches";

async function audit(db: Db, action: string, entity: string, id: string | null, detail: unknown = {}) {
  await db.execute(`INSERT INTO admin_audit(action,entity,entity_id,detail) VALUES ($1,$2,$3,$4)`, [action,entity,id,JSON.stringify(detail)]);
}
async function mutate<T>(action: string, entity: string, id: string | null, detail: unknown, fn: (db: Db) => Promise<T>): Promise<T> {
  await assertAdminSession();
  return (await getDb()).tx(async (db) => { const result=await fn(db); await audit(db,action,entity,id,detail); return result; });
}
async function required(db: Db, table: string, column: string, id: string): Promise<Row> {
  const row=await db.one(`SELECT * FROM ${table} WHERE ${column}=$1 FOR UPDATE`,[id]);
  if (!row) throw new Error(`${table} not found`); return row;
}
const bounded = (n=50) => Math.max(1,Math.min(200,Math.floor(n)));
export async function getDashboardStats() {
  await assertAdminSession(); const db=await getDb();
  return { counts: await db.one(`SELECT (SELECT COUNT(*)::int FROM contributors) contributors,(SELECT COUNT(*)::int FROM pitches) pitches,(SELECT COUNT(*)::int FROM stories) stories,(SELECT COUNT(*)::int FROM sources) sources,(SELECT COUNT(*)::int FROM newsletter_signups) newsletter`),
    ingestRuns: await db.query(`SELECT * FROM ingest_runs ORDER BY id DESC LIMIT 10`),
    pendingScreens: await db.one(`SELECT (SELECT COUNT(*)::int FROM pitches WHERE screening_status='pending') pitches,(SELECT COUNT(*)::int FROM pitch_publications WHERE screening_status='pending') publications`),
    openFlags: Number((await db.one<{ n: number }>(`SELECT COUNT(*)::int n FROM flags WHERE status='open'`))!.n) };
}
export async function listAdminContributors() { await assertAdminSession(); return (await getDb()).query(`SELECT * FROM contributors ORDER BY name`); }
export async function getAdminContributor(id: string) { await assertAdminSession(); return (await getDb()).one(`SELECT * FROM contributors WHERE id=$1`,[v.text(id,"id")]); }
export interface ContributorInput { name: string; kind: "journalist" | "expert"; field?: string | null; credentials: string; affiliation?: string | null; conflicts?: string[]; bio: string; portfolioUrl?: string | null; region?: string | null; active?: boolean }
function contributorValues(input: ContributorInput) {
  const kind=v.choice(input.kind,["journalist","expert"],"kind");
  return [v.text(input.name,"name",200),kind,input.field ? v.choice(input.field,v.EXPERT_FIELDS,"field") : null,v.text(input.credentials,"credentials"),v.optionalText(input.affiliation,"affiliation"),JSON.stringify(v.strings(input.conflicts ?? [])),v.text(input.bio,"bio",5000),input.portfolioUrl ? v.url(input.portfolioUrl) : null,v.region(input.region),input.active === undefined ? true : v.bool(input.active,"active")];
}
export async function createContributor(input: ContributorInput) {
  await assertAdminSession(); const values=contributorValues(input), id=randomUUID();
  return mutate("create","contributor",id,{},async db => (await db.one(`INSERT INTO contributors(id,name,kind,field,credentials,affiliation,conflicts,bio,portfolio_url,region,active) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,[id,...values]))!);
}
export async function updateContributor(id: string, input: ContributorInput) {
  await assertAdminSession(); const values=contributorValues(input); id=v.text(id,"id");
  return mutate("update","contributor",id,{},async db => {
    const row=await required(db,"contributors","id",id);
    if (row.verified_at && row.kind!==input.kind) throw new Error("Unverify before changing contributor kind");
    return db.one(`UPDATE contributors SET name=$2,kind=$3,field=$4,credentials=$5,affiliation=$6,conflicts=$7,bio=$8,portfolio_url=$9,region=$10,active=$11 WHERE id=$1 RETURNING *`,[id,...values]);
  });
}
export async function deleteContributor(id: string) { await assertAdminSession(); id=v.text(id,"id"); return mutate("delete","contributor",id,{},async db => { await required(db,"contributors","id",id); await db.execute(`DELETE FROM articles WHERE id IN (SELECT pp.article_id FROM pitch_publications pp JOIN pitches p ON p.pitch_id=pp.pitch_id WHERE p.reporter_id=$1)`,[id]); return db.execute(`DELETE FROM contributors WHERE id=$1`,[id]); }); }
export async function setContributorVerified(id: string, verified: boolean) {
  await assertAdminSession(); id=v.text(id,"id"); v.bool(verified,"verified");
  return mutate(verified?"verify":"unverify","contributor",id,{},async db => {
    const c=await required(db,"contributors","id",id); let sourceId=c.source_id;
    if (verified && c.kind==='journalist') {
      if (sourceId) { const source=await required(db,"sources","id",String(sourceId)); if (source.type!=='journalist') throw new Error("Contributor source must be a journalist source"); }
      else {
        const existing=await db.one<{id:string}>(`SELECT id FROM sources WHERE type='journalist' AND id IN ($1,$2) ORDER BY id LIMIT 1`,[id,`journalist-${id}`]);
        sourceId=existing?.id ?? `journalist-${id}`;
        if (!existing) await db.execute(`INSERT INTO sources(id,name,type,ownership,data_status,homepage,regions,languages,topics,active) VALUES ($1,$2,'journalist',$3,'link',$4,$5,'["en"]','[]',1)`,[sourceId,c.name,`Individually owned by ${c.name}`,c.portfolio_url ?? '',JSON.stringify(c.region?[c.region]:[])]);
      }
    }
    return db.one(`UPDATE contributors SET verified_at=CASE WHEN $2::boolean THEN COALESCE(verified_at,now()) ELSE NULL END,source_id=$3 WHERE id=$1 RETURNING *`,[id,verified,sourceId]);
  });
}
export async function listAdminPitches(limit=100) { await assertAdminSession(); return (await getDb()).query(`SELECT p.*,c.name reporter_name,pp.article_id,pp.screening_status publication_screening_status,pp.screening_categories publication_screening_categories FROM pitches p JOIN contributors c ON c.id=p.reporter_id LEFT JOIN pitch_publications pp ON pp.pitch_id=p.pitch_id ORDER BY p.updated_at DESC LIMIT $1`,[bounded(limit)]); }
export async function getAdminPitch(id: string) { await assertAdminSession(); const db=await getDb(); return { pitch: await db.one(`SELECT * FROM pitches WHERE pitch_id=$1`,[v.text(id,"id")]), publication: await db.one(`SELECT * FROM pitch_publications WHERE pitch_id=$1`,[id]) }; }
export interface PitchInput { reporterId: string; topic: string; region?: string | null; angle: string; timeframe: string; status?: PitchStatus; linkedBlindspotId?: number | null; linkedStoryId?: string | null }
function pitchValues(input: PitchInput) {
  const blindspot=input.linkedBlindspotId ?? null;
  if (blindspot !== null && (!Number.isInteger(blindspot) || blindspot<1)) throw new Error("Invalid blindspot");
  return [v.text(input.reporterId,"reporterId"),v.text(input.topic,"topic",500),v.region(input.region),v.text(input.angle,"angle",3000),v.text(input.timeframe,"timeframe",200),v.choice(input.status ?? 'pitched',['pitched','in_progress','published'],"status"),blindspot,v.optionalText(input.linkedStoryId,"storyId")];
}
async function verifiedReporter(db: Db, id: string) { const c=await required(db,"contributors","id",id); if (!c.verified_at || !c.active) throw new Error("Contributor must be verified and active"); return c; }
export async function createPitch(input: PitchInput) {
  await assertAdminSession(); const values=pitchValues(input),id=randomUUID();
  if (values[5]==='published' || values[7]) throw new Error("Publish using publishPitch");
  const screen=await prescreen(`${values[1]}\n${values[3]}\n${values[4]}`,"pitch");
  return mutate("create","pitch",id,{},async db => { await verifiedReporter(db,String(values[0])); return db.one(`INSERT INTO pitches(pitch_id,reporter_id,topic,region,angle,timeframe,status,linked_blindspot_id,linked_story_id,screening_status,screening_categories,screened_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,[id,...values,screen.status,JSON.stringify(screen.categories),screen.screenedAt]); });
}
export async function updatePitch(id: string, input: PitchInput) {
  await assertAdminSession(); id=v.text(id,"id"); const values=pitchValues(input);
  return mutate("update","pitch",id,{},async db => {
    const old=await required(db,"pitches","pitch_id",id); await verifiedReporter(db,String(values[0]));
    if (old.reporter_id!==values[0]) throw new Error("Pitch reporter cannot change");
    if (values[5]==='published' && !(await db.one(`SELECT 1 FROM pitch_publications WHERE pitch_id=$1`,[id]))) throw new Error("Publish using publishPitch");
    if (values[7]!==old.linked_story_id && values[7]!==null) throw new Error("Story link is set by clustering");
    const changed=old.topic!==values[1] || old.angle!==values[3] || old.timeframe!==values[4] || old.region!==values[2];
    // Save first as pending; network work happens after the transaction.
    return db.one(`UPDATE pitches SET topic=$3,region=$4,angle=$5,timeframe=$6,status=$7,linked_blindspot_id=$8,
      status_changed_at=CASE WHEN status<>$7 THEN now() ELSE status_changed_at END,updated_at=now(),
      screening_status=CASE WHEN $9 THEN 'pending' ELSE screening_status END,
      screening_categories=CASE WHEN $9 THEN '[]'::jsonb ELSE screening_categories END,screened_at=CASE WHEN $9 THEN NULL ELSE screened_at END
      WHERE pitch_id=$1 AND reporter_id=$2 RETURNING *`,[id,...values.slice(0,7),changed]);
  }).then(async row => { if (row?.screening_status==='pending') await rescreenPending(1,undefined,{kind:'pitch',id}); return (await getDb()).one(`SELECT * FROM pitches WHERE pitch_id=$1`,[id]); });
}
export async function deletePitch(id: string) { await assertAdminSession(); id=v.text(id,"id"); return mutate("delete","pitch",id,{},async db => {
  await required(db,"pitches","pitch_id",id);
  await db.execute(`DELETE FROM articles WHERE id IN (SELECT article_id FROM pitch_publications WHERE pitch_id=$1)`,[id]);
  return db.execute(`DELETE FROM pitches WHERE pitch_id=$1`,[id]);
}); }
export async function publishPitch(id: string, input: { url: string; headline: string; excerpt: string }) {
  await assertAdminSession(); id=v.text(id,"id"); const url=v.url(input.url),headline=v.text(input.headline,"headline",500),excerpt=v.excerpt(input.excerpt);
  const screen=await prescreen(`${headline}\n${excerpt}`,"publication");
  return mutate("publish","pitch",id,{url},async db => {
    const p=await required(db,"pitches","pitch_id",id),c=await verifiedReporter(db,String(p.reporter_id));
    if (c.kind!=='journalist' || !c.source_id) throw new Error("Publication requires a verified journalist source");
    const source=await required(db,"sources","id",String(c.source_id)); if (source.type!=='journalist') throw new Error("Invalid journalist source");
    const previous=await db.one(`SELECT * FROM pitch_publications WHERE pitch_id=$1 FOR UPDATE`,[id]);
    if (previous) throw new Error('Pitch already has a publication; use Re-run screen for screening retries');
    const aid=articleId(url);
    await db.execute(`INSERT INTO articles(id,source_id,headline,byline,url,excerpt,published_at,region,fetched_at) VALUES ($1,$2,$3,$4,$5,$6,now(),$7,now())`,[aid,c.source_id,headline,c.name,url,excerpt,p.region]);
    await db.execute(`INSERT INTO pitch_publications(pitch_id,article_id,url,headline,excerpt,screening_status,screening_categories,screened_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      ON CONFLICT(pitch_id) DO UPDATE SET url=excluded.url,headline=excluded.headline,excerpt=excluded.excerpt,screening_status=excluded.screening_status,screening_categories=excluded.screening_categories,screened_at=excluded.screened_at`,[id,aid,url,headline,excerpt,screen.status,JSON.stringify(screen.categories),screen.screenedAt]);
    await db.execute(`UPDATE pitches SET status='published',status_changed_at=CASE WHEN status<>'published' THEN now() ELSE status_changed_at END,updated_at=now(),linked_story_id=NULL WHERE pitch_id=$1`,[id]);
    return db.one(`SELECT * FROM pitch_publications WHERE pitch_id=$1`,[id]);
  });
}
export async function rerunScreen(kind: "pitch" | "publication", id: string) {
  await assertAdminSession(); v.choice(kind,['pitch','publication'],"kind"); id=v.text(id,"id");
  await mutate("rescreen","pitch",id,{kind},async db => { await required(db,kind==='pitch'?'pitches':'pitch_publications','pitch_id',id); return null; });
  return rescreenPending(1,undefined,{kind,id});
}
export async function listAdminCommentary() { await assertAdminSession(); return (await getDb()).query(`SELECT * FROM commentary ORDER BY published_at DESC`); }
export async function saveCommentary(id: string | null, input: { storyId: string; contributorId: string; title: string; body: string }) {
  await assertAdminSession(); const values=[v.text(input.storyId,'storyId'),v.text(input.contributorId,'contributorId'),v.text(input.title,'title',500),v.text(input.body,'body',1200)]; const key=id ? v.text(id,'id') : randomUUID();
  return mutate(id?'update':'create','commentary',key,{},async db => { await verifiedReporter(db,values[1]); if (id) await required(db,'commentary','id',key); return db.one(`INSERT INTO commentary(id,story_id,contributor_id,title,body) VALUES ($1,$2,$3,$4,$5) ON CONFLICT(id) DO UPDATE SET story_id=excluded.story_id,contributor_id=excluded.contributor_id,title=excluded.title,body=excluded.body RETURNING *`,[key,...values]); });
}
export async function deleteCommentary(id: string) { await assertAdminSession(); id=v.text(id,'id'); return mutate('delete','commentary',id,{},async db => { await required(db,'commentary','id',id); return db.execute(`DELETE FROM commentary WHERE id=$1`,[id]); }); }
export async function listAdminFlags(status?: 'open'|'resolved'|'dismissed') { await assertAdminSession(); if (status) v.choice(status,['open','resolved','dismissed'],'status'); return (await getDb()).query(`SELECT * FROM flags WHERE ($1::text IS NULL OR status=$1) ORDER BY created_at DESC`,[status ?? null]); }
export async function resolveFlag(id: number, status: 'resolved'|'dismissed', note: string) {
  await assertAdminSession(); if (!Number.isInteger(id)||id<1) throw new Error('Invalid flag id'); v.choice(status,['resolved','dismissed'],'status'); note=v.text(note,'resolution note',2000);
  return mutate(status,'flag',String(id),{note},async db => { await required(db,'flags','id',String(id)); return db.one(`UPDATE flags SET status=$2,resolved_at=now(),resolution_note=$3 WHERE id=$1 RETURNING *`,[id,status,note]); });
}
export async function listAdminSources() { await assertAdminSession(); return (await getDb()).query(`SELECT * FROM sources ORDER BY name`); }
export async function updateSource(id: string, input: { type: string; ownership: string; ownershipSource?: string | null; dataStatus: string; paywalled: boolean; active: boolean }) {
  await assertAdminSession(); id=v.text(id,'id'); const values=[v.choice(input.type,v.SOURCE_TYPE_IDS,'type'),v.text(input.ownership,'ownership'),v.optionalText(input.ownershipSource,'ownershipSource',2048),v.choice(input.dataStatus,['feed','partner','link'],'dataStatus'),Number(v.bool(input.paywalled,'paywalled')),Number(v.bool(input.active,'active'))];
  return mutate('update','source',id,{},async db => { await required(db,'sources','id',id); if (values[0]!=='journalist' && await db.one(`SELECT 1 FROM contributors WHERE source_id=$1`,[id])) throw new Error('A contributor source must remain journalist type'); return db.one(`UPDATE sources SET type=$2,ownership=$3,ownership_source=$4,data_status=$5,paywalled=$6,active=$7 WHERE id=$1 RETURNING *`,[id,...values]); });
}
export async function listAdminStories(limit=100) { await assertAdminSession(); return (await getDb()).query(`SELECT * FROM stories ORDER BY updated_at DESC LIMIT $1`,[bounded(limit)]); }
export async function updateStory(id: string, input: { title: string; summary: string; hidden: boolean }) {
  await assertAdminSession(); id=v.text(id,'id'); const title=v.text(input.title,'title',500), summary=v.optionalText(input.summary,'summary',10000) ?? '',hidden=v.bool(input.hidden,'hidden');
  return mutate('update','story',id,{hidden},async db => { await required(db,'stories','id',id); return db.one(`UPDATE stories SET title=$2,summary=$3,hidden=$4 WHERE id=$1 RETURNING *`,[id,title,summary,hidden]); });
}
export async function listNewsletterSignups() { await assertAdminSession(); return (await getDb()).query(`SELECT * FROM newsletter_signups ORDER BY created_at DESC`); }
export async function deleteNewsletterSignup(email: string) { await assertAdminSession(); email=v.text(email,'email',254).toLowerCase(); return mutate('delete','newsletter',email,{},db => db.execute(`DELETE FROM newsletter_signups WHERE email=$1`,[email])); }
export async function exportNewsletterCsv() {
  await assertAdminSession(); const rows=await listNewsletterSignups();
  const cell=(value: unknown) => { let s=String(value ?? ''); if (/^[=+@\-\t\r]/.test(s)) s="'"+s; return '"'+s.replaceAll('"','""')+'"'; };
  const csv=['email,created_at,confirmed',...rows.map(r=>[r.email,r.created_at,r.confirmed].map(cell).join(','))].join('\r\n');
  await mutate('export','newsletter',null,{rows:rows.length},async () => null); return csv;
}
export async function triggerIngest() { await assertAdminSession(); const db=await getDb(); await audit(db,'trigger','ingest',null); return runIngest(db); }
export async function listAdminAudit(limit=100) { await assertAdminSession(); return (await getDb()).query(`SELECT * FROM admin_audit ORDER BY id DESC LIMIT $1`,[bounded(limit)]); }
