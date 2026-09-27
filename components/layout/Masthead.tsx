import Link from "next/link";
import { editionDate } from "@/lib/format";
import { Icon } from "@/components/ui";
import Image from "next/image";
export function Masthead() {
  return (
    <div className="mx-auto max-w-[1440px] px-4 md:px-6">
      <div className="relative grid items-center gap-3 py-3 md:min-h-[84px] md:grid-cols-[1fr_auto_1fr] md:py-4">
        <p className="hidden whitespace-nowrap text-[9px] uppercase tracking-wider xl:block">
          Philippines · Daily edition · {editionDate()}
        </p>
        <div className="text-center md:col-start-2">
          <Link href="/" aria-label="ALUNSINA NEWS — home" className="inline-flex items-center justify-center gap-3">
            <Image src="/brand/alunsina-logo-horizontal@2x.png" width={484} height={104} alt="ALUNSINA NEWS" preload className="hidden h-[52px] w-auto md:block" />
            <Image src="/brand/alunsina-emblem.png" width={512} height={512} alt="" preload className="h-9 w-9 md:hidden" />
            <Image src="/brand/alunsina-wordmark@2x.png" width={960} height={156} alt="ALUNSINA NEWS" preload className="h-6 w-auto md:hidden" />
          </Link>

        </div>
        <div className="flex min-w-0 items-center justify-center gap-2 md:col-start-3 md:justify-end">
          <form
            action="/search"
            className="flex min-w-0 flex-1 md:max-w-[220px] items-center gap-2 rounded-[2px] border border-rule px-2 py-1.5"
          >
            <Icon name="search" size={15} />
            <input
              name="q"
              aria-label="Search stories, topics, or regions"
              placeholder="Search stories, topics, or regions…"
              className="min-w-0 w-full bg-transparent text-[10px] outline-none"
            />
          </form>
          <details className="relative text-xs">
            <summary className="cursor-pointer">EN</summary>
            <div className="absolute right-0 z-20 w-36 border border-rule bg-paper p-3">
              <Link href="/settings#language">Language preferences →</Link>
            </div>
          </details>
          <Link href="/settings#notifications" aria-label="Notifications">
            <Icon name="bell" />
          </Link>
          <Link href="/contribute" className="shrink-0 border border-forest px-2 py-1.5 text-[10px] text-forest hover:bg-paper-deep">
            For contributors
          </Link>
        </div>
      </div>
    </div>
  );
}
