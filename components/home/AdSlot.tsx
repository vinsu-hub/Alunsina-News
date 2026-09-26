/** Clearly labeled ad placeholder. Only ever placed in the main column between sections, never in the right rail (§13). */
export function AdSlot({ className = "" }: { className?: string }) {
  return (
    <aside aria-label="Advertisement" className={className}>
      <p className="kicker mb-1 text-center text-[10px] text-ink-muted">Advertisement</p>
      <div className="flex h-[90px] items-center justify-center border border-rule bg-paper-deep/60">
        <span className="meta">Ad space</span>
      </div>
    </aside>
  );
}
