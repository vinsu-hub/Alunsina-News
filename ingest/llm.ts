/**
 * Optional LLM pass (runs only when ANTHROPIC_API_KEY or another Anthropic
 * credential is configured and ALUNSINA_LLM !== "off"). For the top stories it
 * rewrites the extractive summary into a neutral two-sentence "what happened"
 * and the per-source-type emphasis bullets. Any failure leaves the heuristic
 * output in place.
 */
import Anthropic from "@anthropic-ai/sdk";
import type { Db } from "../db/client";
import { SOURCE_TYPE_IDS, sourceType, type SourceTypeId } from "../lib/taxonomy";
import { loadMembers } from "./derive";

const MODEL = process.env.ALUNSINA_LLM_MODEL ?? "claude-sonnet-5";
const MAX_STORIES = 15;

const SYSTEM = `You summarize clusters of Philippine news reports for ALUNSINA NEWS, a news-comparison service.
Rules:
- Describe only what the provided headlines and excerpts report. Do not add facts, speculation, or background.
- Neutral, plain language. No political judgments, no adjectives that take sides, no claims about who is right.
- Attribute contested or unverified claims to their source ("according to…", "officials said…").
- Items from "Social / Viral" are unverified; never state them as fact.
- "emphasis": for each source type present, 2-3 short noun phrases (2-5 words each) describing what that group of sources focuses on. Descriptive, not evaluative.`;

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "emphasis"],
  properties: {
    summary: { type: "string", description: "Two neutral sentences, at most 320 characters total." },
    emphasis: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["source_type", "points"],
        properties: {
          source_type: { type: "string", enum: SOURCE_TYPE_IDS },
          points: { type: "array", items: { type: "string" } },
        },
      },
    },
  },
} as const;

interface LlmOut {
  summary: string;
  emphasis: { source_type: SourceTypeId; points: string[] }[];
}

export const llmEnabled = () =>
  process.env.ALUNSINA_LLM !== "off" && Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);

export async function llmPass(db: Db, storyIds: string[]): Promise<{ updated: number; errors: string[] }> {
  if (!llmEnabled() || !storyIds.length) return { updated: 0, errors: [] };
  const client = new Anthropic();
  const top = (
    (await db.query(`SELECT id FROM stories WHERE id IN (${storyIds.map((_, i) => `$${i + 1}`).join(",")}) ORDER BY score DESC LIMIT $${storyIds.length + 1}`, [...storyIds, MAX_STORIES])) as { id: string }[]
  ).map((r) => r.id);
  let updated = 0;
  const errors: string[] = [];
  for (const id of top) {
    const ms = await loadMembers(db, id);
    const byType = new Map<SourceTypeId, string[]>();
    for (const m of ms.slice(-40)) {
      const lines = byType.get(m.sourceType) ?? [];
      lines.push(`- ${m.sourceName}: ${m.headline}${m.excerpt ? ` — ${m.excerpt}` : ""}`);
      byType.set(m.sourceType, lines);
    }
    const input = [...byType].map(([t, lines]) => `## ${sourceType(t).label}\n${lines.join("\n")}`).join("\n\n");
    try {
      const res = await client.beta.messages.create({
        model: MODEL,
        max_tokens: 2000,
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        output_config: { effort: "low", format: { type: "json_schema", schema: SCHEMA } },
        system: SYSTEM,
        messages: [{ role: "user", content: `Reports in this story cluster:\n\n${input}` }],
      } as unknown as Anthropic.Beta.MessageCreateParamsNonStreaming);
      if (res.stop_reason === "refusal") {
        errors.push(`${id}: refusal`);
        continue;
      }
      const text = res.content.find((b) => b.type === "text");
      if (!text || text.type !== "text") continue;
      const out = JSON.parse(text.text) as LlmOut;
      if (out.summary?.trim()) await db.execute(`UPDATE stories SET summary = $1 WHERE id = $2`, [out.summary.trim().slice(0, 400), id]);
      const present = new Set(byType.keys());
          for (const e of out.emphasis ?? [])
        if (present.has(e.source_type) && e.points?.length) await db.execute(`INSERT INTO story_emphasis (story_id, source_type, points) VALUES ($1,$2,$3) ON CONFLICT(story_id,source_type) DO UPDATE SET points=excluded.points`, [id, e.source_type, JSON.stringify(e.points.slice(0, 3))]);
      updated++;
    } catch (e) {
      errors.push(`${id}: ${e instanceof Anthropic.APIError ? `API ${e.status}` : e instanceof Error ? e.message : String(e)}`.slice(0, 200));
    }
  }
  return { updated, errors };
}
