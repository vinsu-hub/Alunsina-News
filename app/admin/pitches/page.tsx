import { listAdminPitches, listAdminContributors } from "@/lib/queries/admin";
import { suggestBlindspotsForPitch } from "@/lib/queries/pitches";
import {
  Heading,
  Field,
  Text,
  Select,
  Region,
  choices,
  str,
  Badge,
  Empty,
  date,
  type Row,
} from "@/components/admin/Fields";
import { ActionForm, Counter } from "@/components/admin/Forms";
import { submit } from "../_actions/forms";
function PitchFields({ row = {} }: { row?: Row }) {
  return (
    <>
      <Field name="topic" label="Topic" value={row.topic} maxLength={500} />
      <Region value={row.region} />
      <Text
        name="angle"
        label="Reporting angle"
        value={row.angle}
        maxLength={3000}
      />
      <Field
        name="timeframe"
        label="Timeframe"
        value={row.timeframe}
        maxLength={200}
      />
    </>
  );
}
export default async function Pitches({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const p = await searchParams,
    [all, contributors, suggestions] = await Promise.all([
      listAdminPitches(200),
      listAdminContributors(),
      suggestBlindspotsForPitch(p.topic || "", p.suggestRegion),
    ]);
  const rows = all.filter(
    (r) =>
      (!p.status || r.status === p.status) &&
      (!p.screen ||
        r.screening_status === p.screen ||
        r.publication_screening_status === p.screen) &&
      (!p.contributor || r.reporter_id === p.contributor) &&
      (!p.region || r.region === p.region),
  );
  const reporters = contributors
    .filter((c) => c.verified_at && c.active)
    .map((c) => ({ id: str(c.id), label: str(c.name) }));
  return (
    <>
      <Heading title="Pitches">
        Status is recorded as reported by the journalist. Screening checks
        injection and harmful conduct patterns, never topic or viewpoint. Only
        passed content is public; there is no manual approval or override.
      </Heading>
      <details className="admin-panel">
        <summary>Create pitch</summary>
        <form className="admin-filters">
          <Field
            name="topic"
            label="Topic for blindspot suggestions"
            value={p.topic}
            required={false}
          />
          <Region name="suggestRegion" value={p.suggestRegion} />
          <button>Find suggestions</button>
        </form>
        <ActionForm
          action={submit.bind(null, "pitch", "")}
          label="Create pitch"
        >
          <div className="admin-fields">
            <Select
              name="reporterId"
              label="Verified, active contributor"
              options={reporters}
            />
            <PitchFields row={{ topic: p.topic, region: p.suggestRegion }} />
            <Select
              name="linkedBlindspotId"
              label="Potential Blindspot link — optional, informational only"
              options={suggestions.map((s) => ({
                id: String(s.id),
                label: `${s.storyTitle} · ${s.type} — ${s.reason}`,
              }))}
              optional
            />
          </div>
          {!reporters.length && (
            <p className="admin-feedback">
              Verify and activate a contributor before creating a pitch.
            </p>
          )}
        </ActionForm>
      </details>
      <form className="admin-filters">
        <Select
          name="status"
          label="Status"
          value={p.status}
          options={choices(["pitched", "in_progress", "published"])}
          optional
        />
        <Select
          name="screen"
          label="Screening status"
          value={p.screen}
          options={choices(["pending", "passed", "flagged"])}
          optional
        />
        <Select
          name="contributor"
          label="Contributor"
          value={p.contributor}
          options={contributors.map((c) => ({
            id: str(c.id),
            label: str(c.name),
          }))}
          optional
        />
        <Region value={p.region} label="Region" />
        <button>Filter</button>
      </form>
      <p className="admin-muted">{rows.length} pitches · latest 200 records</p>
      {!rows.length && <Empty noun="pitches" />}
      {rows.map((r) => (
        <article className="admin-row" key={str(r.pitch_id)}>
          <div className="admin-row-head">
            <div>
              <h2>{str(r.topic)}</h2>
              <p className="admin-muted">
                {str(r.reporter_name)} ·{" "}
                {str(r.region) || "No region specified"} · {date(r.updated_at)}
              </p>
            </div>
            <Badge status={r.status} />
          </div>
          <p className="my-3">{str(r.angle)}</p>
          <p className="admin-muted">Timeframe: {str(r.timeframe)}</p>
          <div className="admin-actions">
            <span>Pitch screen</span>
            <Badge
              status={r.screening_status}
              categories={r.screening_categories}
            />
            <ActionForm
              action={submit.bind(null, "screen", str(r.pitch_id))}
              label="Re-run screen"
            >
              <input type="hidden" name="kind" value="pitch" />
            </ActionForm>
          </div>
          {r.article_id ? (
            <div className="admin-actions">
              <span>Publication screen</span>
              <Badge
                status={r.publication_screening_status}
                categories={r.publication_screening_categories}
              />
              <ActionForm
                action={submit.bind(null, "screen", str(r.pitch_id))}
                label="Re-run publication screen"
              >
                <input type="hidden" name="kind" value="publication" />
              </ActionForm>
            </div>
          ) : null}
          <details className="admin-panel">
            <summary>Edit pitch / record status</summary>
            <ActionForm action={submit.bind(null, "pitch", str(r.pitch_id))}>
              <input
                type="hidden"
                name="reporterId"
                value={str(r.reporter_id)}
              />
              <input
                type="hidden"
                name="linkedBlindspotId"
                value={str(r.linked_blindspot_id)}
              />
              <div className="admin-fields">
                <PitchFields row={r} />
                <Select
                  name="status"
                  label="Status reported by journalist"
                  value={r.status}
                  options={choices(
                    r.article_id
                      ? ["pitched", "in_progress", "published"]
                      : ["pitched", "in_progress"],
                  )}
                />
              </div>
              <p className="admin-muted mb-3">
                Text changes trigger screening again. Publication is recorded
                using the publish form.
              </p>
            </ActionForm>
          </details>
          {!r.article_id && (
            <details className="admin-panel">
              <summary>Record publication</summary>
              <ActionForm
                action={submit.bind(null, "publish", str(r.pitch_id))}
                label="Record publication"
              >
                <div className="admin-fields">
                  <Field
                    name="url"
                    label="Published URL"
                    type="url"
                    maxLength={2048}
                  />
                  <Field name="headline" label="Headline" maxLength={500} />
                  <Counter
                    name="excerpt"
                    label="Excerpt — at most two sentences"
                    sentences
                  />
                </div>
              </ActionForm>
            </details>
          )}
        </article>
      ))}
    </>
  );
}
