import type { ReactNode } from "react";

export const CONTAINER = "mx-auto max-w-[1280px] px-4 md:px-6";

/** Broadsheet section-front header: kicker, large serif title, italic dek. */
export function PageHeader({
  kicker,
  title,
  dek,
  aside,
}: {
  kicker?: ReactNode;
  title: ReactNode;
  dek?: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <header className="border-b border-ink pb-5 pt-8 md:pt-10">
      {kicker && <p className="kicker mb-2 text-forest">{kicker}</p>}
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
        <div className="min-w-0">
          <h1 className="headline break-words text-4xl font-semibold leading-[1.05] md:text-6xl">{title}</h1>
          {dek && (
            <p className="mt-3 max-w-2xl font-serif text-lg italic leading-snug text-ink-soft md:text-xl">{dek}</p>
          )}
        </div>
        {aside && <div className="meta">{aside}</div>}
      </div>
    </header>
  );
}
