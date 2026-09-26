"use client";
// Compare-coverage mode state (§20). The URL (`?compare=1`) is the durable source of
// truth for deep links and browser navigation.
import { createContext, useContext, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Icon } from "@/components/ui";

const Ctx = createContext<{ on: boolean; toggle: () => void } | null>(null);

export function CompareProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const on = params.get("compare") === "1";
  const toggle = () => {
    const next = !on;
    const q = new URLSearchParams(params.toString());
    if (next) q.set("compare", "1");
    else q.delete("compare");
    const qs = q.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  };
  return <Ctx.Provider value={{ on, toggle }}>{children}</Ctx.Provider>;
}

function useCompare() {
  const c = useContext(Ctx);
  if (!c) throw new Error("CompareProvider missing");
  return c;
}

export function CompareToggle() {
  const { on, toggle } = useCompare();
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-controls="compare"
      onClick={toggle}
      className={`inline-flex items-center gap-2 border px-3 py-1.5 font-sans text-xs font-semibold uppercase tracking-wide transition-colors ${
        on ? "border-forest bg-forest text-paper hover:bg-forest-dark" : "border-ink text-ink hover:bg-ink hover:text-paper"
      }`}
    >
      <Icon name="columns" size={16} />
      {on ? "Comparing coverage" : "Compare coverage"}
    </button>
  );
}

/** Renders its children only while compare mode is on. */
export function CompareSlot({ children }: { children: ReactNode }) {
  const { on, toggle } = useCompare();
  return (
    <section id="compare" aria-label="Compare coverage" hidden={!on} className="mt-8 scroll-mt-4 border-b border-ink pb-6">
      {on && (
        <>
          {children}
          <div className="mt-3 flex justify-end">
            <button type="button" onClick={toggle} className="meta inline-flex items-center gap-1 hover:text-ink">
              <Icon name="close" size={14} /> Close comparison
            </button>
          </div>
        </>
      )}
    </section>
  );
}
