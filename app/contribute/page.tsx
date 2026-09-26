import type { Metadata } from "next";
import Link from "next/link";
import { CONTAINER, PageHeader } from "@/components/explore/PageHeader";
import { EXPERT_FIELDS } from "@/lib/taxonomy";

export const metadata: Metadata = { title: "Become a contributor" };
export default function ContributePage() {
  const control = "mt-1 w-full border border-rule bg-paper px-3 py-2 text-ink focus-visible:outline-2 focus-visible:outline-forest";
  return <div className={CONTAINER}><PageHeader kicker="Contributors" title="Bring your expertise. Declare your interests." dek="Independent reporting and expert analysis, with identity and context readers can inspect." />
    <div className="grid gap-10 pt-8 lg:grid-cols-2"><div className="space-y-6 font-serif text-lg text-ink-soft">
      <section><h2 className="headline text-2xl font-semibold text-ink">Two ways to contribute</h2><p className="mt-3"><strong>Independent Journalists</strong> bring original reporting, supported by a portfolio and byline history. Their reporting can appear in a Story’s source list.</p><p className="mt-3"><strong>Experts</strong> bring context in their field. Expert Commentary is always labeled “Analysis — Not Reporting” and never counts as a reporting source.</p></section>
      <section><h2 className="headline text-2xl font-semibold text-ink">Identity, expertise, and disclosure</h2><p className="mt-3">Applications will collect real identity, expertise or portfolio, affiliation, and declared conflicts such as paid consulting, party membership, board seats, or government appointments. Review checks identity and expertise only, never political alignment. Contributors use real names.</p></section>
      <section><h2 className="headline text-2xl font-semibold text-ink">Privacy before applications</h2><p className="mt-3">Handling under RA 10173 (Data Privacy Act), including consent, retention, access, and deletion arrangements, is to be finalized before applications open.</p><Link href="/methodology#contributors" className="link-quiet">Read the contributor methodology →</Link></section>
    </div>
    <section aria-labelledby="application"><h2 id="application" className="section-head">Application preview</h2><p id="application-notice" className="mt-3 border-l-2 border-ochre bg-paper-deep p-4 font-sans text-sm"><strong>Applications open soon.</strong> Submission is not processed yet. These fields are a display-only preview: no data is sent or stored.</p>
      <div role="group" aria-describedby="application-notice" className="mt-5 space-y-4 font-sans text-sm">
        <fieldset disabled className="space-y-4"><legend className="sr-only">Application fields (unavailable until applications open)</legend>
          <label className="block">Contributor type<select className={control} defaultValue="expert"><option value="expert">Expert</option><option value="journalist">Independent Journalist</option></select></label>
          <label className="block">Real name<input className={control} type="text" autoComplete="off" /></label>
          <label className="block">Contact email<input className={control} type="email" autoComplete="off" /></label>
          <label className="block">Field of expertise<select className={control}>{EXPERT_FIELDS.map((f) => <option key={f}>{f}</option>)}</select></label>
          <label className="block">Credentials / expertise<textarea className={control} rows={3} /></label>
          <label className="block">Institutional affiliation (if any)<input className={control} type="text" /></label>
          <label className="block">Portfolio / byline history<input className={control} type="url" /></label>
          <label className="block">Declared conflicts of interest<textarea className={control} rows={3} /></label>
        </fieldset>
        <button type="submit" disabled aria-describedby="application-notice" className="border border-rule bg-paper-deep px-4 py-3 text-ink-muted">Applications open soon</button>
      </div>
    </section></div></div>;
}
