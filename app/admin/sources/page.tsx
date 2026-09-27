import { listAdminSources } from "@/lib/queries/admin";
import { SOURCE_TYPES, DATA_STATUSES } from "@/lib/taxonomy";
import { Heading, str, Field, Select, Check } from "@/components/admin/Fields";
import { ActionForm } from "@/components/admin/Forms";
import { submit } from "../_actions/forms";
export default async function Sources() {
  const rows = await listAdminSources();
  return (
    <>
      <Heading title="Sources">
        Publisher metadata and factual ownership disclosures. Source types
        describe provenance, never political alignment.
      </Heading>
      <div className="admin-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Source</th>
              <th>Type</th>
              <th>Availability</th>
              <th>Manage</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={str(r.id)}>
                <td>{str(r.name)}</td>
                <td>{SOURCE_TYPES.find((t) => t.id === r.type)?.label}</td>
                <td>
                  {r.active ? "Active" : "Inactive"}
                  {r.paywalled ? " · Subscription required" : ""}
                </td>
                <td>
                  <details>
                    <summary>Edit source</summary>
                    <ActionForm action={submit.bind(null, "source", str(r.id))}>
                      <div className="admin-fields" style={{ minWidth: 240 }}>
                        <Select
                          name="type"
                          label="Source type"
                          value={r.type}
                          options={SOURCE_TYPES}
                        />
                        <Select
                          name="dataStatus"
                          label="Data status"
                          value={r.data_status}
                          options={DATA_STATUSES}
                        />
                        <Field
                          name="ownership"
                          label="Ownership"
                          value={r.ownership}
                        />
                        <Field
                          name="ownershipSource"
                          label="Ownership source"
                          value={r.ownership_source}
                          required={false}
                          maxLength={2048}
                        />
                        <Check
                          name="paywalled"
                          label="Paywalled"
                          value={r.paywalled}
                        />
                        <Check
                          name="active"
                          label="Active source"
                          value={r.active}
                        />
                      </div>
                    </ActionForm>
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
