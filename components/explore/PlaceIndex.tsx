import { ISLAND_GROUPS, REGIONS, type IslandGroupId, type RegionId } from "@/lib/taxonomy";
import { IndexEntry } from "./IndexEntry";

/**
 * National · Luzon · Visayas · Mindanao, then every region grouped under its island group.
 * Same structure on /explore and /regions.
 */
export function PlaceIndex({
  counts,
}: {
  counts: { national: number; island: (id: IslandGroupId) => number; region: (id: RegionId) => number };
}) {
  return (
    <div>
      <div className="grid gap-x-8 border-b border-rule pb-3 sm:grid-cols-2 lg:grid-cols-4">
        <IndexEntry href="/regions/national" label="National" count={counts.national} countLabel="stories" strong />
        {ISLAND_GROUPS.map((g) => (
          <IndexEntry
            key={g.id}
            href={`/regions/${g.id}`}
            label={g.label}
            count={counts.island(g.id)}
            countLabel="stories"
            strong
          />
        ))}
      </div>
      <div className="mt-4 grid gap-x-8 gap-y-5 md:grid-cols-3">
        {ISLAND_GROUPS.map((g) => (
          <section key={g.id} aria-labelledby={`isl-${g.id}`}>
            <h3 id={`isl-${g.id}`} className="kicker mb-1 text-ink-muted">
              {g.label}
            </h3>
            <ul>
              {REGIONS.filter((r) => r.island === g.id).map((r) => (
                <li key={r.id}>
                  <IndexEntry
                    href={`/regions/${r.id}`}
                    label={r.label}
                    sub={r.name}
                    count={counts.region(r.id)}
                    countLabel="stories"
                  />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <p className="meta mt-3">
        Counts are stories with at least one article about or from the place. National counts stories carried by
        national media.
      </p>
    </div>
  );
}
