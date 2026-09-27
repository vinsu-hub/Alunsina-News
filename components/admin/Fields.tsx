import type { ReactNode } from "react";
import { REGIONS } from "@/lib/taxonomy";
export type Row = Record<string, unknown>;
export const str = (value: unknown) => (value == null ? "" : String(value));
export function Field({
  name,
  label,
  value,
  required = true,
  type = "text",
  maxLength = 1000,
}: {
  name: string;
  label: string;
  value?: unknown;
  required?: boolean;
  type?: string;
  maxLength?: number;
}) {
  return (
    <label>
      {label}
      <input
        name={name}
        defaultValue={str(value)}
        required={required}
        type={type}
        maxLength={maxLength}
      />
    </label>
  );
}
export function Text({
  name,
  label,
  value,
  required = true,
  maxLength = 5000,
}: {
  name: string;
  label: string;
  value?: unknown;
  required?: boolean;
  maxLength?: number;
}) {
  return (
    <label className="wide">
      {label}
      <textarea
        name={name}
        defaultValue={str(value)}
        required={required}
        maxLength={maxLength}
      />
    </label>
  );
}
export function Select({
  name,
  label,
  value,
  options,
  optional = false,
}: {
  name: string;
  label: string;
  value?: unknown;
  options: readonly { id: string; label: string }[];
  optional?: boolean;
}) {
  return (
    <label>
      {label}
      <select name={name} defaultValue={str(value)} required={!optional}>
        {optional && <option value="">Any / not specified</option>}
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
export function Region({
  value,
  name = "region",
  label = "Region (optional)",
}: {
  value?: unknown;
  name?: string;
  label?: string;
}) {
  return (
    <Select
      name={name}
      label={label}
      value={value}
      options={REGIONS}
      optional
    />
  );
}
export function Check({
  name,
  label,
  value,
}: {
  name: string;
  label: string;
  value?: unknown;
}) {
  return (
    <label>
      <input type="checkbox" name={name} defaultChecked={!!value} /> {label}
    </label>
  );
}
export function Heading({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <>
      <p className="admin-kicker">Edition desk / {title}</p>
      <h1>{title}</h1>
      {children && <p className="admin-intro">{children}</p>}
    </>
  );
}
export function Badge({
  status,
  categories,
}: {
  status: unknown;
  categories?: unknown;
}) {
  return (
    <span className="admin-badge">
      {str(status).replaceAll("_", " ") || "pending"}
      {Array.isArray(categories) && categories.length
        ? ` · ${categories.join(", ")}`
        : ""}
    </span>
  );
}
export function Empty({ noun }: { noun: string }) {
  return (
    <p className="admin-panel admin-muted">No {noun} match these filters.</p>
  );
}
export const choices = (values: string[]) =>
  values.map((id) => ({ id, label: id.replaceAll("_", " ") }));
export function date(value: unknown) {
  const d = new Date(str(value));
  return Number.isNaN(d.valueOf())
    ? "—"
    : d.toLocaleString("en-PH", {
        timeZone: "Asia/Manila",
        dateStyle: "medium",
        timeStyle: "short",
      });
}
