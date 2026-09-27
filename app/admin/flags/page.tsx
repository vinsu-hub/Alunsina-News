import { timeAgo } from "@/lib/format";
import Link from "next/link";
import { listAdminFlags } from "@/lib/queries/admin";
import {
  Heading,
  str,
  Text,
  Select,
  choices,
  date,
  Empty,
} from "@/components/admin/Fields";
import { ActionForm } from "@/components/admin/Forms";
import { submit } from "../_actions/forms";
export default async function Flags({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const p = await searchParams,
    status =
      p.status === "resolved" || p.status === "dismissed" ? p.status : "open",
    rows = await listAdminFlags(status);
  return (
    <>
      <Heading title="Flags">
        Reader corrections and concerns. Record a resolution note so every
        decision has a clear trail.
      </Heading>
      <nav className="admin-tabs" aria-label="Flag status">
        {["open", "resolved", "dismissed"].map((s) => (
          <Link
            key={s}
            href={`/admin/flags?status=${s}`}
            aria-current={s === status ? "page" : undefined}
          >
            {s[0].toUpperCase() + s.slice(1)}
          </Link>
        ))}
      </nav>
      {!rows.length && <Empty noun={`${status} flags`} />}
      {rows.map((r) => (
        <article className="admin-row" key={str(r.id)}>
          <h2>{str(r.kind)}</h2>
          <p className="admin-muted">
            Target: {str(r.target_id)} · {timeAgo(str(r.created_at))} ·{" "}
            {date(r.created_at)}
          </p>
          {r.story_id ? (
            <Link href={`/story/${r.story_id}`}>View story ↗</Link>
          ) : null}
          <p className="my-3">{str(r.note)}</p>
          {status === "open" ? (
            <ActionForm
              action={submit.bind(null, "flag", str(r.id))}
              label="Record resolution"
              confirm="Close this flag with the selected resolution and note?"
            >
              <div className="admin-fields">
                <Select
                  name="status"
                  label="Resolution"
                  options={choices(["resolved", "dismissed"])}
                />
                <Text name="note" label="Resolution note" maxLength={2000} />
              </div>
            </ActionForm>
          ) : (
            <p>Resolution: {str(r.resolution_note)}</p>
          )}
        </article>
      ))}
    </>
  );
}
