"use client";
import { useId } from "react";
import { ISLAND_GROUPS, type IslandGroupId } from "@/lib/taxonomy";
export function IslandTabs({
  value,
  onChange,
  label,
  panelId,
}: {
  value: IslandGroupId;
  onChange: (v: IslandGroupId) => void;
  label: string;
  panelId: string;
}) {
  const id = useId();
  return (
    <div
      role="tablist"
      aria-label={label}
      className="mb-3 flex border-b border-rule"
    >
      {ISLAND_GROUPS.map((g, i) => (
        <button
          key={g.id}
          id={`${id}-${g.id}`}
          role="tab"
          aria-selected={value === g.id}
          aria-controls={panelId}
          tabIndex={value === g.id ? 0 : -1}
          className={`flex-1 border-b-2 py-2 text-[11px] ${value === g.id ? "border-forest text-forest" : "border-transparent text-ink-soft"}`}
          onClick={() => onChange(g.id)}
          onKeyDown={(e) => {
            const next =
              e.key === "ArrowRight"
                ? (i + 1) % 3
                : e.key === "ArrowLeft"
                  ? (i + 2) % 3
                  : e.key === "Home"
                    ? 0
                    : e.key === "End"
                      ? 2
                      : -1;
            if (next >= 0) {
              e.preventDefault();
              onChange(ISLAND_GROUPS[next].id);
              document
                .getElementById(`${id}-${ISLAND_GROUPS[next].id}`)
                ?.focus();
            }
          }}
        >
          {g.label}
        </button>
      ))}
    </div>
  );
}
