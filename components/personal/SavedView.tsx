"use client";
import Link from "next/link";
import { Icon, Rule, SaveButton, StoryCard } from "@/components/ui";
import { region as regionOf, sourceType } from "@/lib/taxonomy";
import type { StorySummary } from "@/lib/types";
import { useFollowing, useJson, useSaved } from "./prefs";
import { Loading, Skeleton } from "./Skeleton";

type Tab = "saved" | "following";

export function SavedView({ tab }: { tab: Tab }) {
  return (
    <div className="mx-auto max-w-[1280px] px-4 py-6 md:px-6 md:py-10">
      <Rule double />
      <h1 className="headline mt-3 text-[32px] font-semibold uppercase leading-none tracking-[0.02em] md:text-5xl">
        {tab === "saved" ? "Saved" : "Following"}
      </h1>
      <p className="mt-2 font-serif text-[16px] italic text-ink-soft">
        {tab === "saved"
          ? "Stories you've kept for later, stored on this device."
          : "Stories from the topics, regions, and source types you follow."}
      </p>
      <nav aria-label="Saved sections" className="mt-4 flex gap-6 border-b border-ink">
        <TabLink href="/saved" active={tab === "saved"}>Saved</TabLink>
        <TabLink href="/saved?tab=following" active={tab === "following"}>Following</TabLink>
      </nav>
      <div className="mt-6">{tab === "saved" ? <SavedList /> : <FollowingList />}</div>
    </div>
  );
}

function TabLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`relative -mb-px py-2 font-sans text-sm font-semibold tracking-wide ${active ? "text-forest-dark" : "text-ink-soft hover:text-ink"}`}
    >
      {children}
      {active && <span className="absolute inset-x-0 bottom-0 h-[3px] bg-forest" aria-hidden />}
    </Link>
  );
}

function StoryGrid({ stories, save = false }: { stories: StorySummary[]; save?: boolean }) {
  return (
    <ul className="grid gap-x-8 md:grid-cols-2 lg:grid-cols-3">
      {stories.map((s) => (
        <li key={s.id} className="border-t border-rule py-4">
          <StoryCard story={s} />
          {save && <SaveButton storyId={s.id} className="mt-3" />}
        </li>
      ))}
    </ul>
  );
}

function Empty({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="max-w-xl border border-ink p-5">
      <h2 className="headline text-xl font-semibold">{title}</h2>
      <div className="mt-2 font-serif text-[15px] leading-relaxed text-ink-soft">{children}</div>
    </div>
  );
}

function SavedList() {
  const [ids, , ready] = useSaved();
  const url = ready && ids.length ? `/api/stories?ids=${ids.map(encodeURIComponent).join(",")}` : null;
  const { data, error, loading } = useJson<{ stories: StorySummary[] }>(url);
  // Keep the list in sync with the pref immediately after an unsave, without refetching.
  const stories = (data?.stories ?? []).filter((s) => ids.includes(s.id));

  if (!ready) return <Skeleton lines={3} />;
  if (!ids.length)
    return (
      <Empty title="Nothing saved yet">
        <p>
          Tap <span className="inline-flex items-center gap-1 font-sans text-sm font-medium text-ink"><Icon name="bookmark" size={14} />Save</span>{" "}
          on any story to keep it here. Saved stories stay on this device only; there&rsquo;s no account.
        </p>
        <p className="mt-3">
          <Link href="/" className="font-sans text-sm font-semibold text-forest link-quiet">Browse today&rsquo;s edition →</Link>
        </p>
      </Empty>
    );
  if (error) return <p role="alert" className="font-sans text-sm text-terracotta">We couldn&rsquo;t load your saved stories. Reload to try again.</p>;
  if (loading || !data) return <Loading label="Loading saved stories" />;
  const missing = ids.length - data.stories.length;
  return (
    <>
      <p className="meta mb-2">{stories.length} saved {stories.length === 1 ? "story" : "stories"}</p>
      {stories.length ? <StoryGrid stories={stories} save /> : <p className="meta">All saved stories were removed.</p>}
      {missing > 0 && (
        <p className="meta mt-4">
          {missing === 1 ? "One saved story is" : `${missing} saved stories are`} no longer in the edition and can&rsquo;t be shown.
        </p>
      )}
    </>
  );
}

function FollowingList() {
  const [f, , ready] = useFollowing();
  const params = new URLSearchParams();
  if (f.topics.length) params.set("topics", f.topics.join(","));
  if (f.regions.length) params.set("regions", f.regions.join(","));
  if (f.sources.length) params.set("types", f.sources.join(","));
  const qs = params.toString();
  const { data, error, loading } = useJson<{ stories: StorySummary[] }>(ready && qs ? `/api/stories?${qs}` : null);

  if (!ready) return <Skeleton lines={3} />;
  if (!qs)
    return (
      <Empty title="You're not following anything yet">
        <p>Follow topics, regions, or source types and matching stories will collect here.</p>
        <p className="mt-3">
          <Link href="/settings#following" className="font-sans text-sm font-semibold text-forest link-quiet">Choose what to follow →</Link>
        </p>
      </Empty>
    );
  const chips = [
    ...f.topics,
    ...f.regions.map((r) => regionOf(r)?.label ?? r),
    ...f.sources.map((s) => sourceType(s)?.label ?? s),
  ];
  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="kicker text-ink-muted">Following</span>
        {chips.map((c) => (
          <span key={c} className="border border-rule px-2 py-0.5 font-sans text-xs text-ink-soft">{c}</span>
        ))}
        <Link href="/settings#following" className="font-sans text-xs font-semibold text-forest link-quiet">Edit</Link>
      </div>
      {error ? (
        <p role="alert" className="font-sans text-sm text-terracotta">We couldn&rsquo;t load stories you follow. Reload to try again.</p>
      ) : loading || !data ? (
        <Loading label="Loading stories you follow" />
      ) : data.stories.length ? (
        <StoryGrid stories={data.stories} />
      ) : (
        <p className="font-serif italic text-ink-muted">No current stories match what you follow.</p>
      )}
    </>
  );
}
