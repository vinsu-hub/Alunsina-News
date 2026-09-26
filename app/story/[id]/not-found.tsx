import Link from "next/link";

export default function StoryNotFound() {
  return (
    <div className="mx-auto max-w-[1280px] px-4 py-16 md:px-6">
      <p className="kicker text-terracotta">Story not found</p>
      <h1 className="headline mt-3 text-4xl font-semibold">We couldn&rsquo;t find that story.</h1>
      <p className="mt-3 max-w-prose font-serif text-lg text-ink-soft">
        It may have been merged into another story or removed after review.
      </p>
      <p className="mt-6">
        <Link href="/" className="font-sans text-sm font-semibold text-forest link-quiet">
          Back to today&rsquo;s edition →
        </Link>
      </p>
    </div>
  );
}
