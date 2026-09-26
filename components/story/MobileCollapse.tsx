"use client";
import { useId, useState, type ReactNode } from "react";

/**
 * Collapsed behind a button below 768px (§24: keep the phone page short);
 * always expanded on desktop.
 */
export function MobileCollapse({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className="w-full border border-ink py-2 font-sans text-xs font-semibold uppercase tracking-wide text-ink md:hidden"
      >
        {open ? `Hide ${label}` : `Show ${label}`}
      </button>
      <div id={id} className={open ? "mt-4 md:mt-0" : "hidden md:block"}>
        {children}
      </div>
    </>
  );
}
