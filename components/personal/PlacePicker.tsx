"use client";
import { useEffect, useId, useRef, useState } from "react";
import { Icon } from "@/components/ui";
import { region as regionOf } from "@/lib/taxonomy";
import { useJson, type AreaPlace } from "./prefs";

type Found = AreaPlace & { kind: "city" | "municipality" | "province" };

const GEO_ERRORS: Record<number, string> = {
  1: "Location permission was denied. Search for your city or municipality instead.",
  2: "Your location isn't available right now. Search for your city or municipality instead.",
  3: "Finding your location took too long. Search for your city or municipality instead.",
};

/**
 * City/municipality picker (§18): ARIA 1.2 combobox over /api/places, plus an
 * optional "Use my current location" that maps coordinates to the nearest known
 * city. Only the city/municipality is kept — never coordinates.
 */
export function PlacePicker({
  onSelect,
  onCancel,
  autoFocus = false,
}: {
  onSelect: (p: AreaPlace) => void;
  onCancel?: () => void;
  autoFocus?: boolean;
}) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [geo, setGeo] = useState<{ state: "idle" | "locating" | "error"; message?: string }>({ state: "idle" });

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 150);
    return () => clearTimeout(t);
  }, [q]);
  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  const { data, loading, error } = useJson<{ places: Found[] }>(debounced ? `/api/places?q=${encodeURIComponent(debounced)}` : null);
  const results = debounced && q.trim() === debounced ? (data?.places ?? []) : [];
  const expanded = open && q.trim().length > 0;
  const listId = `${id}-list`;
  const optId = (i: number) => `${id}-opt-${i}`;

  const choose = (p: Found) => {
    onSelect({ key: p.key, name: p.name, province: p.province, region: p.region });
    setOpen(false);
    setQ("");
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => (results.length ? (i + 1) % results.length : -1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => (results.length ? (i <= 0 ? results.length - 1 : i - 1) : -1));
    } else if (e.key === "Enter") {
      const pick = results[active >= 0 ? active : 0];
      if (expanded && pick) {
        e.preventDefault();
        choose(pick);
      }
    } else if (e.key === "Escape") {
      if (expanded) {
        e.preventDefault();
        setOpen(false);
        setActive(-1);
      } else if (onCancel) {
        e.preventDefault();
        onCancel();
      }
    }
  };

  const locate = () => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setGeo({ state: "error", message: "Location isn't available in this browser. Search for your city or municipality instead." });
      inputRef.current?.focus();
      return;
    }
    setGeo({ state: "locating" });
    const fail = (message: string) => {
      setGeo({ state: "error", message });
      inputRef.current?.focus();
    };
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        // Coordinates are used once, rounded, to find the nearest city; they are never stored.
        const lat = pos.coords.latitude.toFixed(2);
        const lng = pos.coords.longitude.toFixed(2);
        fetch(`/api/places?lat=${lat}&lng=${lng}`)
          .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
          .then((d: { place: Found | null; reason?: string }) => {
            if (d.place) {
              setGeo({ state: "idle" });
              choose(d.place);
            } else
              fail(
                d.reason === "outside"
                  ? "Your location appears to be outside the Philippines. Search for a city or municipality instead."
                  : "We couldn't match your location to a city. Search for your city or municipality instead.",
              );
          })
          .catch(() => fail("We couldn't match your location to a city. Search for your city or municipality instead."));
      },
      (err) => fail(GEO_ERRORS[err.code] ?? GEO_ERRORS[2]),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 600_000 },
    );
  };

  return (
    <div className="max-w-xl">
      <label htmlFor={`${id}-input`} className="kicker block text-ink">
        City or municipality
      </label>
      <div className="relative mt-2">
        <div className="flex items-center gap-2 border border-ink bg-paper px-3 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-forest">
          <Icon name="search" size={16} className="shrink-0 text-ink-muted" />
          <input
            ref={inputRef}
            id={`${id}-input`}
            type="text"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={expanded}
            aria-controls={listId}
            aria-activedescendant={expanded && active >= 0 && results[active] ? optId(active) : undefined}
            autoComplete="off"
            spellCheck={false}
            placeholder="e.g. San Pablo, Cebu City, Tacloban"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setOpen(true);
              setActive(-1);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 120)}
            onKeyDown={onKeyDown}
            className="min-w-0 flex-1 bg-transparent py-2.5 font-serif text-lg text-ink placeholder:text-ink-muted/70 focus:outline-none"
          />
        </div>
        <ul
          id={listId}
          role="listbox"
          aria-label="Matching places"
          hidden={!expanded}
          className="absolute inset-x-0 top-full z-30 max-h-72 overflow-y-auto border border-t-0 border-ink bg-paper"
        >
          {results.map((p, i) => (
            <li
              key={p.key}
              id={optId(i)}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(p)}
              onMouseEnter={() => setActive(i)}
              className={`flex cursor-pointer flex-col gap-0.5 border-b border-rule px-3 py-2 last:border-b-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3 ${i === active ? "bg-paper-deep" : ""}`}
            >
              <span className="font-serif text-[17px] text-ink">
                {p.name}
                <span className="text-ink-soft"> · {p.province}</span>
              </span>
              <span className="meta shrink-0">{regionOf(p.region).label}</span>
            </li>
          ))}
          {expanded && !results.length && (
            <li role="presentation" className="meta px-3 py-2">
              {loading || q.trim() !== debounced ? "Searching…" : error ? "We couldn't load matching places. Try searching again." : `No city or municipality matches “${q.trim()}”.`}
            </li>
          )}
        </ul>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        <button
          type="button"
          onClick={locate}
          disabled={geo.state === "locating"}
          className="inline-flex items-center gap-1.5 font-sans text-sm font-medium text-forest underline decoration-forest/30 underline-offset-4 hover:decoration-forest disabled:opacity-60"
        >
          <Icon name="locate" size={16} />
          {geo.state === "locating" ? "Finding your location…" : "Use my current location"}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="font-sans text-sm text-ink-soft underline decoration-rule underline-offset-4 hover:decoration-ink">
            Cancel
          </button>
        )}
      </div>
      <p role="status" aria-live="polite" className={geo.state === "error" ? "mt-2 font-sans text-sm text-terracotta" : "sr-only"}>
        {geo.state === "error" ? geo.message : ""}
      </p>
      <p className="meta mt-3">We only store your city or municipality, on this device.</p>
    </div>
  );
}
