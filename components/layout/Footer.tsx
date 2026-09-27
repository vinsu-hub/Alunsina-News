import Link from "next/link";
import { getLastIngest, getPlatformStats } from "@/lib/queries";
import { timeAgo } from "@/lib/format";
import Image from "next/image";
import { NewsletterForm } from "./NewsletterForm";
export async function Footer() {
  const [stats, last] = await Promise.all([
    getPlatformStats(),
    getLastIngest(),
  ]);
  return (
    <footer className="mx-auto mt-10 max-w-[1440px] border-t border-rule px-4 pb-[calc(5rem+env(safe-area-inset-bottom))] pt-6 md:px-6 md:pb-5">
      <div className="grid gap-6 sm:grid-cols-3 lg:grid-cols-[1.3fr_.7fr_.7fr_.7fr_.8fr_1.4fr]">
        <div>
          <Link href="/" aria-label="ALUNSINA NEWS — home">
            <Image src="/brand/alunsina-logo-full.png" width={480} height={474} alt="ALUNSINA NEWS" className="h-[110px] w-auto" />
          </Link>
          <p className="mt-2 font-serif">Truth has more than one source.</p>
          <p className="mt-1 font-serif italic text-ink-soft">
            More context. A clearer picture.
          </p>
          <div className="mt-5 flex gap-4">
            {[
              ["Facebook", "f"],
              ["X", "𝕏"],
              ["Instagram", "◎"],
              ["YouTube", "▷"],
            ].map(([label, glyph]) => (
              <a
                key={label}
                href="#"
                aria-label={label}
                className="text-forest"
              >
                {glyph}
              </a>
            ))}
          </div>
        </div>
        <FooterCol
          title="News"
          items={[
            ["Philippines", "/"],
            ["Metro Manila", "/regions/ncr"],
            ["Regions", "/regions"],
            ["World"],
            ["Business", "/topics/business"],
            ["Technology", "/topics/technology"],
            ["Health", "/topics/health"],
            ["Environment", "/topics/environment"],
            ["Sports"],
            ["Lifestyle"],
          ]}
        />
        <FooterCol
          title="Opinion"
          items={[
            ["Today's Opinion"],
            ["Columnists"],
            ["Editorials"],
            ["Letters"],
            ["Guest Writers", "/experts"],
            ["Fact Checks", "/methodology#corrections"],
            ["The Next Philippines"],
          ]}
        />
        <FooterCol
          title="Most Popular"
          items={[
            ["Art & Design"],
            ["World"],
            ["Blog"],
            ["Business", "/topics/business"],
            ["Culture"],
            ["Lifestyle"],
            ["Newsletter", "#newsletter"],
            ["Photos"],
          ]}
        />
        <FooterCol title="About" items={[["Methodology", "/methodology"], ["For contributors", "/contribute"], ["Preferences", "/settings"]]} />
        <div className="sm:col-span-2 lg:col-span-1">
          <NewsletterForm />
        </div>
      </div>
      <div className="mt-6 border-t border-rule pt-3 text-center">
        <p className="meta text-[10px]">
          {stats.articlesToday.toLocaleString()} articles analyzed in the last
          24 hours · {stats.sources} sources
          {last ? ` · updated ${timeAgo(last.finishedAt)}` : ""}
        </p>
        <p className="mt-2 text-[10px] text-ink-muted">
          ALUNSINA NEWS shows headlines, short excerpts, and links. Full
          reporting stays on each publisher&apos;s site.
        </p>
      </div>
    </footer>
  );
}
function FooterCol({
  title,
  items,
}: {
  title: string;
  items: [string, string?][];
}) {
  return (
    <div className="border-l border-rule pl-4">
      <h2 className="mb-2 text-[11px] uppercase">{title}</h2>
      <ul className="space-y-1 font-serif text-sm text-ink-soft">
        {items.map(([label, href]) => (
          <li key={label}>
            {href ? (
              <Link href={href} className="hover:underline">
                {label}
              </Link>
            ) : (
              <span>{label}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
