/** Neutral placeholder shown until client prefs are readable (avoids hydration flashes). */
export function Skeleton({ lines = 3, className = "" }: { lines?: number; className?: string }) {
  return (
    <div className={`animate-pulse space-y-3 ${className}`} aria-hidden>
      {Array.from({ length: lines }, (_, i) => (
        <div key={i} className="space-y-2 border-t border-rule pt-3">
          <div className="h-2.5 w-20 bg-paper-deep" />
          <div className="h-5 w-11/12 bg-paper-deep" />
          <div className="h-3 w-2/3 bg-paper-deep" />
        </div>
      ))}
    </div>
  );
}

export function Loading({ label, lines = 3, className = "" }: { label: string; lines?: number; className?: string }) {
  return (
    <div role="status" aria-live="polite" className={className}>
      <span className="sr-only">{label}</span>
      <Skeleton lines={lines} />
    </div>
  );
}
