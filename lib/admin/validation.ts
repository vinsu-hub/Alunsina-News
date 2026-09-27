import { REGIONS, SOURCE_TYPE_IDS, EXPERT_FIELDS } from "@/lib/taxonomy";
export function text(value: unknown, field: string, max = 1000): string {
  if (typeof value !== "string" || !value.trim() || value.trim().length > max) throw new Error(`Invalid ${field}`);
  return value.trim();
}
export function optionalText(value: unknown, field: string, max = 1000): string | null {
  return value == null || value === "" ? null : text(value, field, max);
}
export function bool(value: unknown, field: string): boolean {
  if (typeof value !== "boolean") throw new Error(`Invalid ${field}`); return value;
}
export function choice<T extends string>(value: unknown, values: readonly T[], field: string): T {
  if (typeof value !== "string" || !values.includes(value as T)) throw new Error(`Invalid ${field}`); return value as T;
}
export function region(value: unknown) { const v = optionalText(value, "region"); if (v && !REGIONS.some((r) => r.id === v)) throw new Error("Invalid region"); return v; }
export function url(value: unknown): string { const v=text(value,"URL",2048); const u=new URL(v); if (!["https:","http:"].includes(u.protocol) || u.username || u.password) throw new Error("Invalid URL"); return u.href; }
export function excerpt(value: unknown): string { const v=text(value,"excerpt",1200); if ((v.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g) ?? []).length > 2) throw new Error("Excerpt must contain at most two sentences"); return v; }
export function strings(value: unknown): string[] { if (!Array.isArray(value) || value.length > 30 || !value.every((v)=>typeof v === 'string' && v.length<=500)) throw new Error("Invalid conflicts"); return value; }
export { SOURCE_TYPE_IDS, EXPERT_FIELDS };
