import { listAdminGovernmentRequests, searchGovernmentRequestTargets } from "@/lib/queries/admin";
import { submitGovernmentRequest } from "@/app/admin/_actions/transparency";
import { ActionForm } from "@/components/admin/Forms";
import type { GovernmentRequest } from "@/lib/queries/transparency";
function RequestForm({row,targets}:{row?:GovernmentRequest;targets:Awaited<ReturnType<typeof searchGovernmentRequestTargets>>}) {
 const select=(name:string,label:string,options:string[],value?:string)=><label>{label}<select name={name} defaultValue={value ?? options[0]}>{options.map(x=><option key={x} value={x}>{x.replaceAll('_',' ')}</option>)}</select></label>;
 return <ActionForm action={submitGovernmentRequest.bind(null,row?.id ?? null)} label={row ? 'Save request' : 'Log request'} reset={!row}>
 <div className="admin-fields">
 <label>Received date<input type="date" name="receivedAt" required defaultValue={row?.received_at.slice(0,10)} /></label>
 {select('requestType','Request type',['removal','takedown_notice','data_request','other'],row?.request_type)}
 {select('legalBasis','Legal basis',['informal_request','court_order','letter','other'],row?.legal_basis)}
 <label>Requesting agency<input name="agency" maxLength={500} defaultValue={row?.agency ?? ''} /></label>
 <label>Story (search by title or ID above)<input name="storyId" list="request-stories" defaultValue={row?.story_id ?? ''} placeholder="Optional story ID" /></label>
 <label>Source (search by name or ID above)<input name="sourceId" list="request-sources" defaultValue={row?.source_id ?? ''} placeholder="Optional source ID" /></label>
 <datalist id={row ? undefined : 'request-stories'}>{!row && targets.stories.map(s=><option key={s.id} value={s.id}>{s.title}</option>)}</datalist>
 <datalist id={row ? undefined : 'request-sources'}>{!row && targets.sources.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</datalist>
 <label className="wide">Summary<textarea name="summary" maxLength={500} required defaultValue={row?.summary} /></label>
 {select('outcome','Outcome',['pending','not_actioned','removed_per_court_order','partially_actioned','withdrawn'],row?.outcome)}
 <label className="wide">Outcome note<textarea name="outcomeNote" maxLength={500} defaultValue={row?.outcome_note} /></label>
 <label><input type="checkbox" name="published" defaultChecked={row?.published ?? false} /> Publish in the public log</label>
 </div></ActionForm>;
}
export default async function RequestsPage({searchParams}:{searchParams:Promise<{q?:string}>}) {
 const {q=''}=await searchParams; const [rows,targets]=await Promise.all([listAdminGovernmentRequests(),searchGovernmentRequestTargets(q)]);
 return <><h1>Government requests</h1><p className="admin-intro">Removal only under valid legal process (court order). Criticism of a public official is never, by itself, grounds for removal.</p><p className="admin-muted">Unpublished entries are drafts while being evaluated. Only published entries appear in the Government Request Log and Story banner.</p>
 <form method="get"><label>Search stories and sources<input name="q" defaultValue={q} maxLength={200} /></label><button type="submit">Search</button></form>
 <h2>Log a request</h2><RequestForm targets={targets} />
 <h2>Request entries</h2>{rows.length===0 && <p>No requests logged.</p>}{rows.map(row=><details key={row.id} className="admin-panel"><summary>{row.received_at.slice(0,10)} · {row.agency ?? 'Agency not recorded'} · {row.published ? 'Published' : 'Draft'}</summary><RequestForm row={row} targets={targets} /></details>)}</>;
}
