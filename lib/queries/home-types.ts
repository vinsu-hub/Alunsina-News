// Client-safe types for /api/area/[region] (no server-only import).
import type { StoryStatus } from "@/lib/taxonomy";

export interface AreaSummary {
  region: { id: string; label: string; name: string; island: string };
  counts: { local: number; regional: number; government: number; community: number; sources: number };
  stories: { id: string; title: string; topic: string; status: StoryStatus; updatedAt: string; sources: number }[];
}
