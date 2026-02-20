import { notFound } from "next/navigation";
import { getCategoryBySlug, getCategoryVideos } from "@/lib/queries";
import { KategoriPageClient } from "./KategoriPageClient";

export const revalidate = 60;

export default async function KategoriPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const videos = await getCategoryVideos(category.id);

  return <KategoriPageClient category={category} videos={videos} />;
}
