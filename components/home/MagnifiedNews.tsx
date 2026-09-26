"use client";
import Link from "next/link";
import { useId, useState } from "react";
import { IslandTabs } from "@/components/ui/IslandTabs";
import { StoryImage } from "@/components/ui/StoryImage";
import { CoverageChip } from "@/components/ui/CoverageChip";
import type { IslandGroupId } from "@/lib/taxonomy";
import type { MagnifiedNewsEntry } from "@/lib/types";
export function MagnifiedNews({
  entries,
}: {
  entries: Record<IslandGroupId, MagnifiedNewsEntry[]>;
}) {
  const [island, setIsland] = useState<IslandGroupId>("luzon");
  const id = useId();
  return (
    <section className="min-w-0 border border-rule p-3">
      <h2 className="font-serif text-[18px] uppercase">Magnified News</h2>
      <IslandTabs
        value={island}
        onChange={setIsland}
        label="Magnified news island"
        panelId={id}
      />
      <div role="tabpanel" id={id} aria-label={`${island} top five`}>
        <ol className="no-scrollbar flex gap-4 overflow-x-auto sm:block">
          {entries[island].map((s, i) => (
            <li
              key={s.id}
              className="w-[260px] shrink-0 border-b border-rule py-2 sm:w-auto"
            >
              {i === 0 && (
                <StoryImage image={s.leadImage} alt={s.title} topic={s.topic} />
              )}
              <h3
                className={`headline mt-1 leading-snug ${i === 0 ? "text-[17px]" : "text-[14px] line-clamp-2"}`}
              >
                <Link href={`/story/${s.id}`}>
                  {i + 1}. {s.title}
                </Link>
              </h3>
              <p className="meta mt-1 text-[9px]">{s.byline}</p>
              <CoverageChip
                storyId={s.id}
                stats={s.coverageChip}
                className="mt-1 flex-wrap text-[9px]"
              />
              {i === 0 && (
                <Link
                  href={`/story/${s.id}`}
                  className="mt-2 block text-xs text-forest"
                >
                  View details →
                </Link>
              )}
            </li>
          ))}
        </ol>
        {!entries[island].length && (
          <p className="meta py-4">No qualifying local reporting yet.</p>
        )}
      </div>
    </section>
  );
}
