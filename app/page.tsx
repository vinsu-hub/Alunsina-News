import { getEdition } from "@/lib/queries";
import { StoryCard } from "@/components/ui";

// Placeholder front page — replaced by the Homepage build (Phase 02).
export default function Home() {
  const e = getEdition();
  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 md:px-6">
      <div className="grid gap-8 md:grid-cols-3">
        {e.briefing.map((s) => (
          <StoryCard key={s.id} story={s} />
        ))}
      </div>
    </div>
  );
}
