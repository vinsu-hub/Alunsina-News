import {
  Field,
  Text,
  Select,
  Region,
  Check,
  choices,
  type Row,
} from "./Fields";
import { ConflictList } from "./Forms";
import { EXPERT_FIELDS } from "@/lib/taxonomy";
export function ContributorFields({ row = {} }: { row?: Row }) {
  return (
    <div className="admin-fields">
      <Field name="name" label="Name" value={row.name} maxLength={200} />
      <Select
        name="kind"
        label="Kind"
        value={row.kind || "journalist"}
        options={choices(["journalist", "expert"])}
      />
      <Select
        name="field"
        label="Expert field"
        value={row.field}
        options={choices([...EXPERT_FIELDS])}
        optional
      />
      <Field name="credentials" label="Credentials" value={row.credentials} />
      <Field
        name="affiliation"
        label="Affiliation"
        value={row.affiliation}
        required={false}
      />
      <Region value={row.region} />
      <Field
        name="portfolioUrl"
        label="Portfolio URL"
        value={row.portfolio_url}
        type="url"
        required={false}
        maxLength={2048}
      />
      <Check
        name="active"
        label="Active contributor"
        value={row.active ?? true}
      />
      <ConflictList
        values={Array.isArray(row.conflicts) ? row.conflicts.map(String) : []}
      />
      <Text name="bio" label="Biography" value={row.bio} />
    </div>
  );
}
