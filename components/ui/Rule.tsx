import type { ReactNode } from "react";

/** Thin horizontal divider. `double` gives the newspaper thick-over-thin rule. */
export function Rule({ double = false, className = "" }: { double?: boolean; className?: string }) {
  if (double)
    return (
      <div className={className} aria-hidden>
        <div className="border-t-[3px] border-ink" />
        <div className="mt-[2px] border-t border-ink" />
      </div>
    );
  return <hr className={`border-0 border-t border-rule ${className}`} />;
}

/** Section header: rule + kicker label + optional subtitle and right-side action. */
export function SectionHead({
  title,
  sub,
  action,
  id,
  as: As = "h2",
}: {
  title: string;
  sub?: ReactNode;
  action?: ReactNode;
  id?: string;
  as?: "h2" | "h3";
}) {
  return (
    <header className="section-head mb-4" id={id}>
      <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <As className="kicker text-ink">{title}</As>
        {action && <div className="meta shrink-0">{action}</div>}
      </div>
      {sub && <div className="mt-1 font-serif text-[15px] italic text-ink-soft">{sub}</div>}
    </header>
  );
}
