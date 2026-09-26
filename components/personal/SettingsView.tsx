"use client";
import Link from "next/link";
import { useState } from "react";
import { Rule, SectionHead } from "@/components/ui";
import { PREF_KEYS } from "@/lib/prefs";
import { LANGUAGES, REGIONS, SOURCE_TYPES, TOPICS, region as regionOf, type LanguageId } from "@/lib/taxonomy";
import { EMPTY_FOLLOWING, useAreas, useFollowing, useLanguages, useSaved, type Following } from "./prefs";
import { Skeleton } from "./Skeleton";

/**
 * Profile tab target (§24, Phase 05). Section anchors (#language, #notifications)
 * are rendered on the server so deep links from the masthead scroll correctly;
 * pref-dependent contents render once storage is readable.
 */
export function SettingsView() {
  return (
    <div className="mx-auto max-w-[880px] px-4 py-6 md:px-6 md:py-10">
      <Rule double />
      <h1 className="headline mt-3 text-[32px] font-semibold uppercase leading-none tracking-[0.02em] md:text-5xl">Profile</h1>
      <p className="mt-2 font-serif text-[16px] italic text-ink-soft">
        Preferences for this device. There are no accounts yet; nothing here leaves your browser.
      </p>
      <div className="mt-8 space-y-12">
        <section aria-labelledby="my-area-h" id="my-area" className="scroll-mt-4">
          <SectionHead id="my-area-h" title="My Area" />
          <AreaSetting />
        </section>
        <section aria-labelledby="language-h" id="language" className="scroll-mt-4">
          <SectionHead id="language-h" title="Language" sub="Prioritize coverage in these languages" />
          <LanguageSetting />
        </section>
        <section aria-labelledby="following-h" id="following" className="scroll-mt-4">
          <SectionHead
            id="following-h"
            title="Following"
            sub="Stories matching any of these appear under Saved → Following"
            action={<Link href="/saved?tab=following" className="link-quiet">View feed →</Link>}
          />
          <FollowingSetting />
        </section>
        <section aria-labelledby="notifications-h" id="notifications" className="scroll-mt-4">
          <SectionHead id="notifications-h" title="Notifications" />
          <p className="font-serif text-[16px] leading-relaxed text-ink-soft">
            Notifications are not available yet. When they are, you&rsquo;ll choose them here; until then ALUNSINA NEWS
            won&rsquo;t send you anything.
          </p>
        </section>
        <section aria-labelledby="device-h" id="device" className="scroll-mt-4">
          <SectionHead id="device-h" title="This device" />
          <ClearAll />
        </section>
      </div>
    </div>
  );
}

function AreaSetting() {
  const [areas, , ready] = useAreas();
  if (!ready) return <Skeleton lines={1} />;
  const a = areas[0];
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-3">
      {a ? (
        <p className="font-serif text-xl text-ink">
          {a.name}
          <span className="text-ink-soft"> · {a.province}</span>
          <span className="meta ml-2">{regionOf(a.region)?.label}</span>
        </p>
      ) : (
        <p className="font-serif text-[16px] italic text-ink-muted">No area set.</p>
      )}
      <Link href="/my-area" className="font-sans text-sm font-semibold text-forest link-quiet">
        {a ? "Change location →" : "Set your area →"}
      </Link>
    </div>
  );
}

function LanguageSetting() {
  const [langs, setLangs, ready] = useLanguages();
  if (!ready) return <Skeleton lines={1} />;
  const toggle = (id: LanguageId) => setLangs(langs.includes(id) ? langs.filter((l) => l !== id) : [...langs, id]);
  return (
    <>
      <fieldset>
        <legend className="sr-only">Prioritize coverage in these languages</legend>
        <ul className="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2 md:grid-cols-3">
          {LANGUAGES.map((l) => (
            <li key={l.id}>
              <label className="flex cursor-pointer items-center gap-2.5 py-1.5 font-sans text-sm text-ink">
                <input type="checkbox" checked={langs.includes(l.id)} onChange={() => toggle(l.id)} className="size-4 accent-forest" />
                {l.label}
              </label>
            </li>
          ))}
        </ul>
      </fieldset>
      <p className="meta mt-3 max-w-prose">
        This changes which reporting we surface first, not the language of the site. The interface is in English only for
        now; translated menus and pages aren&rsquo;t available yet.
      </p>
    </>
  );
}

function ChipGroup<T extends string>({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: { id: T; label: string }[];
  selected: T[];
  onToggle: (id: T) => void;
}) {
  return (
    <div role="group" aria-label={label}>
      <h3 className="kicker mb-2 text-ink-muted">{label}</h3>
      <ul className="flex flex-wrap gap-2">
        {options.map((o) => {
          const on = selected.includes(o.id);
          return (
            <li key={o.id}>
              <button
                type="button"
                aria-pressed={on}
                onClick={() => onToggle(o.id)}
                className={`border px-2.5 py-1 font-sans text-[13px] ${on ? "border-forest bg-forest text-paper" : "border-rule text-ink-soft hover:border-ink hover:text-ink"}`}
              >
                {on && <span aria-hidden>✓ </span>}
                {o.label}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function FollowingSetting() {
  const [f, setF, ready] = useFollowing();
  if (!ready) return <Skeleton lines={2} />;
  const toggle = <K extends keyof Following>(k: K, id: Following[K][number]) => {
    const list = f[k] as string[];
    setF({ ...f, [k]: list.includes(id) ? list.filter((x) => x !== id) : [...list, id] });
  };
  return (
    <div className="space-y-5">
      <ChipGroup label="Topics" options={TOPICS.map((t) => ({ id: t as string, label: t }))} selected={f.topics} onToggle={(id) => toggle("topics", id)} />
      <ChipGroup label="Regions" options={REGIONS.map((r) => ({ id: r.id, label: r.label }))} selected={f.regions} onToggle={(id) => toggle("regions", id)} />
      <ChipGroup label="Source types" options={SOURCE_TYPES.map((s) => ({ id: s.id, label: s.label }))} selected={f.sources} onToggle={(id) => toggle("sources", id)} />
    </div>
  );
}

function ClearAll() {
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);
  const [, setSaved] = useSaved();
  const [, setFollowing] = useFollowing();
  const [, setAreas] = useAreas();
  const [, setLangs] = useLanguages();

  const clear = () => {
    try {
      for (const k of Object.values(PREF_KEYS)) window.localStorage.removeItem(k);
      window.dispatchEvent(new StorageEvent("storage")); // usePref listens for this
    } catch {
      // Storage unavailable: prefs live in memory; reset them through the store.
      setSaved([]);
      setFollowing(EMPTY_FOLLOWING);
      setAreas([]);
      setLangs([]);
    }
    setConfirming(false);
    setDone(true);
  };

  return (
    <div>
      <p className="font-serif text-[16px] leading-relaxed text-ink-soft">
        Removes your area, saved stories, followed topics, and language choices from this browser.
      </p>
      {!confirming ? (
        <button
          type="button"
          onClick={() => {
            setConfirming(true);
            setDone(false);
          }}
          className="mt-3 border border-terracotta px-3 py-1.5 font-sans text-sm font-medium text-terracotta hover:bg-terracotta hover:text-paper"
        >
          Clear all preferences on this device
        </button>
      ) : (
        <div role="alertdialog" aria-labelledby="clear-q" className="mt-3 border border-terracotta p-3">
          <p id="clear-q" className="font-sans text-sm font-medium text-ink">Clear everything? This can&rsquo;t be undone.</p>
          <div className="mt-3 flex gap-3">
            <button type="button" onClick={clear} autoFocus className="bg-terracotta px-3 py-1.5 font-sans text-sm font-medium text-paper">
              Yes, clear all
            </button>
            <button type="button" onClick={() => setConfirming(false)} className="border border-rule px-3 py-1.5 font-sans text-sm text-ink-soft hover:border-ink">
              Cancel
            </button>
          </div>
        </div>
      )}
      <p role="status" className="meta mt-2">{done ? "All preferences on this device were cleared." : ""}</p>
    </div>
  );
}
