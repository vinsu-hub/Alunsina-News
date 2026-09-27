import { getAdminIndependenceSetting } from "@/lib/queries/admin";
import { submitIndependenceSetting } from "@/app/admin/_actions/transparency";
import { ActionForm } from "@/components/admin/Forms";
export default async function SettingsPage() {
 const setting=await getAdminIndependenceSetting();
 return <><h1>Settings</h1><h2>Editorial Independence Pledge</h2><p className="admin-intro">Not legally reviewed. Enable only after PH media-law counsel approves the text (spec §17).</p>
 <ActionForm action={submitIndependenceSetting}><div className="admin-fields">
 <label><input type="checkbox" name="enabled" defaultChecked={setting.enabled} /> Publish Editorial Independence Pledge</label>
 <label>PH media-law counsel reviewer<input name="reviewer" maxLength={200} defaultValue={setting.reviewer ?? ''} /></label>
 <label>Legal review date<input type="date" name="reviewedAt" defaultValue={setting.reviewedAt ?? ''} /></label>
 </div></ActionForm></>;
}
