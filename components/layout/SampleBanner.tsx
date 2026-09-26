import Link from "next/link";
import { getLastIngest } from "@/lib/queries";

/** Shown until the first live ingest completes, so demo data is never mistaken for real reporting. */
export function SampleBanner() {
  if (getLastIngest()) return null;
  return (
    <div className="bg-ochre/25 text-center font-sans text-xs text-ink">
      <p className="mx-auto max-w-[1280px] px-4 py-1.5">
        Sample edition: publishers and headlines below are fictional demo data. Run <code>npm run ingest</code> to load live feeds.{" "}
        <Link href="/methodology" className="underline underline-offset-2">How ALUNSINA works</Link>
      </p>
    </div>
  );
}
