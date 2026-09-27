import Link from "next/link";
import { listAdminStories } from "@/lib/queries/admin";
import {
  Heading,
  str,
  Field,
  Text,
  Check,
  Empty,
  Badge,
} from "@/components/admin/Fields";
import { ActionForm } from "@/components/admin/Forms";
import { submit } from "../_actions/forms";
export default async function Stories({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const p = await searchParams,
    rows = (await listAdminStories(200)).filter(
      (r) =>
        !p.q ||
        `${r.title} ${r.summary}`.toLowerCase().includes(p.q.toLowerCase()),
    );
  return (
    <>
      <Heading title="Stories">
        Edit the edition’s story summaries and control public visibility.
      </Heading>
      <form className="admin-filters">
        <Field
          name="q"
          label="Search latest 200 stories"
          value={p.q}
          required={false}
        />
        <button>Search</button>
      </form>
      {!rows.length && <Empty noun="stories" />}
      {rows.map((r) => (
        <article className="admin-row" key={str(r.id)}>
          <div className="admin-row-head">
            <h2>{str(r.title)}</h2>
            <Badge status={r.hidden ? "Hidden" : "Public"} />
          </div>
          <Link href={`/story/${r.id}`}>Public story ↗</Link>
          <div className="admin-actions">
            <ActionForm
              action={submit.bind(null, "story", str(r.id))}
              label={r.hidden ? "Unhide story" : "Hide story"}
              confirm={
                r.hidden
                  ? undefined
                  : "Hide this story from the public edition?"
              }
            >
              <input type="hidden" name="title" value={str(r.title)} />
              <input type="hidden" name="summary" value={str(r.summary)} />
              {!r.hidden && <input type="hidden" name="hidden" value="on" />}
            </ActionForm>
          </div>
          <details className="admin-panel">
            <summary>Edit title and summary</summary>
            <ActionForm
              action={submit.bind(null, "story", str(r.id))}
              confirm="Save these story changes and visibility settings?"
            >
              <div className="admin-fields">
                <Field
                  name="title"
                  label="Title"
                  value={r.title}
                  maxLength={500}
                />
                <Check
                  name="hidden"
                  label="Hidden from public edition"
                  value={r.hidden}
                />
                <Text
                  name="summary"
                  label="Summary"
                  value={r.summary}
                  maxLength={10000}
                  required={false}
                />
              </div>
            </ActionForm>
          </details>
        </article>
      ))}
    </>
  );
}
