import type { Metadata } from "next";
import { SectionHead } from "@/components/ui";
import { CONTAINER, PageHeader } from "@/components/explore/PageHeader";
import { ExploreSubNav } from "@/components/explore/ExploreSubNav";
import { PlaceIndex } from "@/components/explore/PlaceIndex";
import { placeStoryCounts } from "@/lib/queries/explore";

export const metadata: Metadata = {
  title: "Regions",
  description: "Philippine news by island group and region: Luzon, Visayas, Mindanao, and all regions.",
};

export default async function RegionsPage() {
  const counts = await placeStoryCounts();
  return (
    <>
      <div className={CONTAINER}>
        <PageHeader
          kicker="Explore"
          title="Regions"
          dek="Where the news is reported from, and where it isn't. Start with an island group or go straight to a region."
        />
      </div>
      <ExploreSubNav active="regions" />
      <div className={`${CONTAINER} pt-8`}>
        <SectionHead title="Regional Index" sub="National, the three island groups, then every region." />
        <PlaceIndex counts={counts} />
      </div>
    </>
  );
}
