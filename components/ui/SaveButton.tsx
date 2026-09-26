"use client";
import { PREF_KEYS, usePref } from "@/lib/prefs";
import { Icon } from "./Icon";

export function SaveButton({ storyId, className = "" }: { storyId: string; className?: string }) {
  const [saved, setSaved] = usePref<string[]>(PREF_KEYS.saved, []);
  const on = saved.includes(storyId);
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={on ? "Remove story from saved stories" : "Save story"}
      onClick={() => setSaved(on ? saved.filter((id) => id !== storyId) : [storyId, ...saved])}
      className={`inline-flex min-h-9 items-center gap-1.5 font-sans text-xs font-medium ${on ? "text-forest" : "text-ink-soft hover:text-ink"} ${className}`}
    >
      <Icon name="bookmark" size={16} className={on ? "fill-current" : ""} />
      {on ? "Saved" : "Save"}
    </button>
  );
}
