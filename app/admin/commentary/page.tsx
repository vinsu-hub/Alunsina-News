import {
  listAdminCommentary,
  listAdminContributors,
  listAdminStories,
} from "@/lib/queries/admin";
import {
  Heading,
  str,
  Field,
  Select,
  Empty,
  type Row,
} from "@/components/admin/Fields";
import { ActionForm, Counter } from "@/components/admin/Forms";
import { submit } from "../_actions/forms";
export default async function Commentary() {
  const [rows, c, s] = await Promise.all([
      listAdminCommentary(),
      listAdminContributors(),
      listAdminStories(200),
    ]),
    experts = c
      .filter((r) => r.kind === "expert" && r.verified_at && r.active)
      .map((r) => ({ id: str(r.id), label: str(r.name) })),
    stories = s.map((r) => ({ id: str(r.id), label: str(r.title) }));
  function fields(row: Row = {}) {
    return (
      <div className="admin-fields">
        <Select
          name="contributorId"
          label="Verified expert"
          value={row.contributor_id}
          options={experts}
        />
        <Select
          name="storyId"
          label="Story (latest 200)"
          value={row.story_id}
          options={stories}
        />
        <Field name="title" label="Title" value={row.title} maxLength={500} />
        <Counter name="body" label="Commentary body" value={str(row.body)} />
      </div>
    );
  }
  return (
    <>
      <Heading title="Commentary">
        Analysis — Not Reporting. Commentary offers expert context and never
        counts as a reporting source.
      </Heading>
      <details className="admin-panel">
        <summary>Create commentary</summary>
        <ActionForm
          action={submit.bind(null, "commentary", "")}
          label="Publish commentary"
        >
          {fields()}
        </ActionForm>
      </details>
      {!rows.length && <Empty noun="commentary entries" />}
      {rows.map((r) => (
        <article className="admin-row" key={str(r.id)}>
          <h2>{str(r.title)}</h2>
          <p className="admin-muted">
            Analysis — Not Reporting ·{" "}
            {str(c.find((x) => x.id === r.contributor_id)?.name)}
          </p>
          <details className="admin-panel">
            <summary>Edit commentary</summary>
            <ActionForm action={submit.bind(null, "commentary", str(r.id))}>
              {fields(r)}
            </ActionForm>
          </details>
          <ActionForm
            action={submit.bind(null, "unpublish", str(r.id))}
            label="Unpublish commentary"
            confirm="Remove this commentary from the public story? This deletes the commentary record."
          />
        </article>
      ))}
    </>
  );
}
