import { assertAdminSession } from "@/lib/admin/session";
export const maxDuration = 300;
export default async function AdminPage() {
  await assertAdminSession();
  return <main className="mx-auto max-w-5xl px-4 py-12"><h1 className="font-serif text-3xl">Admin</h1><p className="mt-4">Contributor, pitch and edition management is ready for the admin interface.</p><form action="/api/admin/logout" method="post"><button className="mt-6 border border-ink p-2">Sign out</button></form></main>;
}
