import Link from "next/link";
import { notFound } from "next/navigation";
import { CONTAINER, PageHeader } from "@/components/explore/PageHeader";
import { StoryList } from "@/components/explore/StoryList";
import { getTrend } from "@/lib/queries/trends";
export default async function TrendPage({ params }: { params: Promise<{slug:string}> }) {
 const {slug} = await params;
 const trend = await getTrend(slug);
 if (!trend) notFound();
 return <main id="main" className={CONTAINER}><PageHeader kicker={<Link href="/trends" className="link-quiet">Trending this week</Link>} title={trend.term.term} dek={`${trend.term.sources} sources · ${trend.term.stories} stories this week`} /><StoryList stories={trend.stories} columns={2} empty="No reporting mentioning this term this week." /></main>;
}
