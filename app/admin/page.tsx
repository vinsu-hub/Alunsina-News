import {
  getDashboardStats,
  listAdminContributors,
  listAdminSources,
} from "@/lib/queries/admin";
import { Heading, date, str } from "@/components/admin/Fields";
import { ActionForm } from "@/components/admin/Forms";
import { submit } from "./_actions/forms";
export const maxDuration = 300;
export default async function AdminPage() {
  const [d, c, s] = await Promise.all([
    getDashboardStats(),
    listAdminContributors(),
    listAdminSources(),
  ]);
  const stats = [
    ["Stories", d.counts?.stories],
    ["Articles today (Manila)", d.counts?.articles_today],
    ["Sources active", s.filter((r) => r.active).length],
    ["Contributors verified", c.filter((r) => r.verified_at).length],
    ["Pitched", d.counts?.pitched],
    ["In progress", d.counts?.in_progress],
    ["Published", d.counts?.published],
    [
      "Pending screens",
      Number(d.pendingScreens?.pitches ?? 0) +
        Number(d.pendingScreens?.publications ?? 0),
    ],
    ["Open flags", d.openFlags],
    ["Newsletter signups", d.counts?.newsletter],
  ];
  return (
    <>
      <Heading title="Overview">
        The edition at a glance. Manage reporting, review corrections, and
        monitor the daily feed.
      </Heading>
      <div className="admin-stats">
        {stats.map(([label, count]) => (
          <div className="admin-stat" key={str(label)}>
            <span className="admin-muted">{str(label)}</span>
            <strong>{str(count)}</strong>
          </div>
        ))}
      </div>
      <section className="admin-panel">
        <h2>Edition operations</h2>
        <p>
          Laya pre-screen:{" "}
          <strong>
            {process.env.LAYA_URL ? "configured" : "not configured"}
          </strong>
        </p>
        <p className="admin-muted">
          Pending and flagged content is held from the public board. Re-runs
          never override a screening decision.
        </p>
        <div className="admin-actions">
          <ActionForm
            action={submit.bind(null, "pending", "")}
            label="Re-run pending screens"
          />
          <ActionForm
            action={submit.bind(null, "ingest", "")}
            label="Run ingest now"
            confirm="Run ingestion now? This can take several minutes. Keep this page open until the result appears."
          />
        </div>
        <p className="admin-muted mt-3">
          Ingest can take several minutes. Pending-screen retries process up to
          50 items per run.
        </p>
      </section>
      <h2>Last 10 ingest runs</h2>
      <div className="admin-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Started</th>
              <th>State</th>
              <th>Seen / new</th>
              <th>Stories</th>
              <th>Feed errors</th>
            </tr>
          </thead>
          <tbody>
            {d.ingestRuns.map((r) => (
              <tr key={str(r.id)}>
                <td>{date(r.started_at)}</td>
                <td>{r.finished_at ? "Finished" : "Running"}</td>
                <td>
                  {str(r.articles_seen)} / {str(r.articles_new)}
                </td>
                <td>{str(r.stories)}</td>
                <td>
                  <details>
                    <summary>
                      {Array.isArray(r.errors) ? r.errors.length : 0} errors
                    </summary>
                    <pre>{JSON.stringify(r.errors, null, 2)}</pre>
                  </details>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!d.ingestRuns.length && (
          <p className="admin-panel">No ingest runs recorded.</p>
        )}
      </div>
    </>
  );
}
