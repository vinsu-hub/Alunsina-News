import { listAdminAudit } from "@/lib/queries/admin";
import {
  Heading,
  str,
  date,
  Select,
  choices,
  Empty,
} from "@/components/admin/Fields";
export default async function Audit({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const p = await searchParams,
    all = await listAdminAudit(200),
    rows = all.filter((r) => !p.entity || r.entity === p.entity);
  return (
    <>
      <Heading title="Audit log">
        The latest 200 administrative events, newest first.
      </Heading>
      <form className="admin-filters">
        <Select
          name="entity"
          label="Entity"
          value={p.entity}
          options={choices([...new Set(all.map((r) => str(r.entity)))])}
          optional
        />
        <button>Filter</button>
      </form>
      {!rows.length && <Empty noun="audit entries" />}
      <div className="admin-table-wrap">
        <table>
          <thead>
            <tr>
              <th>When</th>
              <th>Action</th>
              <th>Entity</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={str(r.id)}>
                <td>{date(r.created_at)}</td>
                <td>{str(r.action)}</td>
                <td>
                  {str(r.entity)}
                  <p className="admin-muted">{str(r.entity_id)}</p>
                </td>
                <td>
                  <details>
                    <summary>View detail</summary>
                    <pre>{JSON.stringify(r.detail, null, 2)}</pre>
                  </details>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
