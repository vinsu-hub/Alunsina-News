import type { StoryStatus } from "@/lib/taxonomy";

export function Kicker({ children, tone = "ink" }: { children: React.ReactNode; tone?: "ink" | "terracotta" | "forest" | "muted" }) {
  const color = { ink: "text-ink", terracotta: "text-terracotta", forest: "text-forest", muted: "text-ink-muted" }[tone];
  return <span className={`kicker ${color}`}>{children}</span>;
}

/** DEVELOPING / ONGOING status label. Settled stories show nothing. */
export function StatusKicker({ status }: { status: StoryStatus }) {
  if (status === "settled") return null;
  return (
    <span className="kicker inline-flex items-center gap-1.5 text-terracotta">
      {status === "developing" && <span className="size-1.5 rounded-full bg-terracotta" aria-hidden />}
      {status === "developing" ? "Developing" : "Ongoing"}
    </span>
  );
}
