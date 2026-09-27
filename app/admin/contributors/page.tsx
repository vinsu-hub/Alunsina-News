import Link from "next/link";
import { listAdminContributors } from "@/lib/queries/admin";
import {
  Heading,
  Select,
  choices,
  str,
  Empty,
  Badge,
} from "@/components/admin/Fields";
import { ActionForm } from "@/components/admin/Forms";
import { ContributorFields } from "@/components/admin/ContributorFields";
import { submit } from "../_actions/forms";
export default async function Contributors({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const p = await searchParams,
    rows = (await listAdminContributors()).filter(
      (r) =>
        (!p.kind || r.kind === p.kind) &&
        (!p.verified || !!r.verified_at === (p.verified === "yes")) &&
        (!p.active || !!r.active === (p.active === "yes")),
    );
  return (
    <>
      <Heading title="Contributors">
        Verification is a one-time identity &amp; expertise check, never a
        viewpoint check. A verified contributor does not need permission for
        each story.
      </Heading>
      <details className="admin-panel">
        <summary>Create contributor</summary>
        <ActionForm
          action={submit.bind(null, "contributor", "")}
          label="Create contributor"
        >
          <ContributorFields />
        </ActionForm>
      </details>
      <form className="admin-filters">
        <Select
          name="kind"
          label="Kind"
          value={p.kind}
          options={choices(["journalist", "expert"])}
          optional
        />
        <Select
          name="verified"
          label="Verified"
          value={p.verified}
          options={choices(["yes", "no"])}
          optional
        />
        <Select
          name="active"
          label="Active"
          value={p.active}
          options={choices(["yes", "no"])}
          optional
        />
        <button>Filter</button>
      </form>
      <p className="admin-muted">{rows.length} contributors</p>
      {!rows.length && <Empty noun="contributors" />}
      {rows.map((r) => (
        <article className="admin-row" key={str(r.id)}>
          <div className="admin-row-head">
            <div>
              <h2>{str(r.name)}</h2>
              <p className="admin-muted">
                {str(r.kind)} · {str(r.credentials)}
              </p>
            </div>
            <Badge status={r.verified_at ? "Verified" : "Unverified"} />
          </div>
          <div className="admin-actions">
            <Link href={`/contributors/${r.id}`}>Public profile ↗</Link>
            <ActionForm
              action={submit.bind(null, "verify", str(r.id))}
              label={r.verified_at ? "Unverify" : "Verify"}
              confirm={
                r.verified_at
                  ? "Unverify this contributor? Their pitches will no longer be public."
                  : "Confirm that identity and expertise have been checked. This does not assess viewpoint."
              }
            >
              <input
                type="hidden"
                name="verified"
                value={r.verified_at ? "false" : "true"}
              />
            </ActionForm>
          </div>
          <details className="admin-panel">
            <summary>Edit {str(r.name)}</summary>
            <ActionForm action={submit.bind(null, "contributor", str(r.id))}>
              <ContributorFields row={r} />
            </ActionForm>
          </details>
        </article>
      ))}
    </>
  );
}
