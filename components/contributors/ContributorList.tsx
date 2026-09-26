import Link from "next/link";
import type { Contributor } from "@/lib/types";

export function ContributorList({ contributors }: { contributors: Contributor[] }) {
  return contributors.length ? <ul className="grid gap-x-8 md:grid-cols-2">{contributors.map((c) => <li key={c.id} className="min-w-0 border-t border-rule py-4">
    <p className="kicker text-forest">{c.kind === "expert" ? c.field : "Independent Journalist"}{c.isSample && <span className="ml-2 text-ink-muted">· Sample profile</span>}</p>
    <h3 className="headline mt-1 text-2xl"><Link href={`/contributors/${c.id}`} className="link-quiet">{c.name}</Link></h3>
    <p className="mt-1 font-sans text-sm text-ink-soft">{c.credentials}{c.affiliation && ` · ${c.affiliation}`}</p>
    <p className="mt-2 font-sans text-xs text-ink-soft"><strong>Declared conflicts:</strong> {c.conflicts.length ? c.conflicts.join("; ") : "None declared"}</p>
  </li>)}</ul> : <p className="border-t border-rule py-4 font-serif italic text-ink-muted">No contributors in this field yet.</p>;
}
