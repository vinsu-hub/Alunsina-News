import Link from "next/link";
import { getLastIngest, getPlatformStats } from "@/lib/queries";
import { timeAgo } from "@/lib/format";

export function Footer() {
  const stats = getPlatformStats();
  const last = getLastIngest();
  return (
    <footer className="mt-16 border-t-[3px] border-ink bg-forest-dark pb-[calc(4.5rem+env(safe-area-inset-bottom))] text-paper md:pb-0">
      <div className="mx-auto grid max-w-[1280px] grid-cols-2 gap-x-6 gap-y-8 px-4 py-8 md:py-10 md:grid-cols-[2fr_1fr_1fr_1fr] md:px-6">
        <div className="col-span-2 md:col-span-1">
          <p className="font-serif text-3xl font-semibold tracking-tight">ALUNSINA NEWS</p>
          <p className="mt-2 font-serif text-lg italic text-paper/80">Truth has more than one source.</p>
          <p className="mt-1 text-sm text-paper/75">More context. A clearer picture.</p>
          {/* Platform-wide stat lives here, never beside the briefing count (§14). */}
          <p className="mt-6 font-sans text-xs text-paper/75 tabular-nums">
            About today&rsquo;s edition: {stats.articlesToday.toLocaleString()} articles analyzed in the last 24 hours across{" "}
            {stats.sources} sources{last ? ` · last updated ${timeAgo(last.finishedAt)}` : ""}.
          </p>
        </div>
        <FooterCol
          title="Read"
          links={[
            ["/", "Today's edition"],
            ["/explore", "Explore"],
            ["/blindspots", "Potential blindspots"],
            ["/my-area", "My Area"],
          ]}
        />
        <FooterCol
          title="Sources"
          links={[
            ["/sources", "Source index"],
            ["/methodology", "Methodology & trust"],
            ["/methodology#corrections", "Report a correction"],
          ]}
        />
        <FooterCol
          title="About"
          links={[
            ["/methodology#linking", "We link out, not republish"],
            ["/settings", "Preferences"],
          ]}
        />
      </div>
      <div className="border-t border-paper/15">
        <p className="mx-auto max-w-[1280px] px-4 py-4 font-sans text-[11px] text-paper/75 md:px-6">
          ALUNSINA NEWS shows headlines, short excerpts, and links. Full reporting stays on each publisher&rsquo;s site.
        </p>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <p className="kicker text-ochre">{title}</p>
      <ul className="mt-3 space-y-2 font-sans text-sm">
        {links.map(([href, label]) => (
          <li key={href}>
            <Link href={href} className="text-paper/85 hover:text-paper hover:underline underline-offset-4">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
