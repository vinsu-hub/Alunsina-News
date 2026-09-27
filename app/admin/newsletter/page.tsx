import { listNewsletterSignups } from "@/lib/queries/admin";
import { Heading, str, date, Empty } from "@/components/admin/Fields";
import { ActionForm } from "@/components/admin/Forms";
import { submit } from "../_actions/forms";
export default async function Newsletter() {
  const rows = await listNewsletterSignups();
  return (
    <>
      <Heading title="Newsletter">
        {rows.length} signups recorded. Exporting does not send email.
      </Heading>
      <ActionForm action={submit.bind(null, "csv", "")} label="Export CSV" />
      {!rows.length && <Empty noun="newsletter signups" />}
      <div className="admin-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Email</th>
              <th>Signed up</th>
              <th>Confirmed</th>
              <th>Manage</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={str(r.email)}>
                <td>{str(r.email)}</td>
                <td>{date(r.created_at)}</td>
                <td>{r.confirmed ? "Yes" : "No"}</td>
                <td>
                  <ActionForm
                    action={submit.bind(
                      null,
                      "newsletter-delete",
                      str(r.email),
                    )}
                    label="Delete signup"
                    confirm={`Delete the signup for ${str(r.email)}?`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
