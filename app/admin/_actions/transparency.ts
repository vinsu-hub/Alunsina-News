"use server";
import { assertAdminSession } from "@/lib/admin/session";
import { saveGovernmentRequest, saveIndependenceSetting } from "@/lib/queries/admin";
import { revalidatePath } from "next/cache";
import type { Result } from "@/components/admin/Forms";
const text=(f:FormData,k:string)=>String(f.get(k) ?? '');
export async function submitGovernmentRequest(id:string|null,f:FormData):Promise<Result> {
 await assertAdminSession();
 try {
 await saveGovernmentRequest(id,{receivedAt:text(f,'receivedAt'),requestType:text(f,'requestType'),legalBasis:text(f,'legalBasis'),agency:text(f,'agency'),storyId:text(f,'storyId'),sourceId:text(f,'sourceId'),summary:text(f,'summary'),outcome:text(f,'outcome'),outcomeNote:text(f,'outcomeNote'),published:f.get('published')==='on'});
 revalidatePath('/admin/requests'); revalidatePath('/methodology'); revalidatePath('/story/[id]','page');
 return {ok:true,message:'Government request saved.'};
 } catch(e) {return {ok:false,message:e instanceof Error ? e.message : 'Unable to save request.'};}
}
export async function submitIndependenceSetting(f:FormData):Promise<Result> {
 await assertAdminSession();
 try {await saveIndependenceSetting(f.get('enabled')==='on',text(f,'reviewer'),text(f,'reviewedAt'));revalidatePath('/admin/settings');revalidatePath('/methodology');return {ok:true,message:'Setting saved.'};}
 catch(e) {return {ok:false,message:e instanceof Error ? e.message : 'Unable to save setting.'};}
}
