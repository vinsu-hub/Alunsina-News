import Link from "next/link";

export function ExpertTabs({ active }: { active: "commentary" | "reporting" }) {
  return <nav aria-label="Experts and reporting" className="border-b border-rule">
    <ul className="flex gap-6 overflow-x-auto">
      {([{ id: "commentary", href: "/experts", label: "Experts & Commentary" }, { id: "reporting", href: "/experts/reporting", label: "Reporting in Progress" }] as const).map((tab) => <li key={tab.id} className="shrink-0"><Link href={tab.href} aria-current={active === tab.id ? "page" : undefined} className={`block border-b-2 py-3 font-sans text-sm focus-visible:outline-2 focus-visible:outline-offset-[-2px] ${active === tab.id ? "border-forest font-semibold text-forest" : "border-transparent text-ink-soft hover:text-ink"}`}>{tab.label}</Link></li>)}
    </ul>
  </nav>;
}
