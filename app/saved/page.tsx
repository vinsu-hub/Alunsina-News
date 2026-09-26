import { SavedView } from "@/components/personal/SavedView";

export const metadata = { title: "Saved" };

export default async function SavedPage({ searchParams }: PageProps<"/saved">) {
  const { tab } = await searchParams;
  return <SavedView tab={tab === "following" ? "following" : "saved"} />;
}
