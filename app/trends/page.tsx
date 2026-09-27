import Link from "next/link";
import { CONTAINER, PageHeader } from "@/components/explore/PageHeader";
import { getTrendingTerms } from "@/lib/queries/trends";
export const metadata = { title: "Trending this week" };
export default async function TrendsPage() {
 const terms = await getTrendingTerms();
 return <main id="main" className={CONTAINER}><PageHeader kicker="Across the news market" title="Trending this week" dek="Ranked by reporting volume, source breadth and growth over the previous week. Coverage is not an endorsement or a measure of political sentiment." /><ol>{terms.map((t,i) => <li key={t.slug} className="flex items-baseline gap-4 border-t border-rule py-5"><span className="font-sans text-sm text-ink-muted">{String(i+1).padStart(2,"0")}</span><div><Link href={`/trends/${t.slug}`} className="font-serif text-2xl hover:underline">{t.term} {t.change === "new" ? "NEW" : t.change === "up" ? "↑" : ""}</Link><p className="meta mt-2">{t.sources} sources · {t.stories} stories this week</p></div></li>)}</ol><Link href="/topics" className="link-quiet">Browse all topics →</Link></main>;
}
