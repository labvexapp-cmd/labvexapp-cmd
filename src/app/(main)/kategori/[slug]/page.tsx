import { mockCategories, mockVideos } from "@/lib/mock-data";
import { KategoriPageClient } from "./KategoriPageClient";

// Generate static params for all categories
export function generateStaticParams() {
  return mockCategories.map((cat) => ({
    slug: cat.slug,
  }));
}

export default async function KategoriPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const category =
    mockCategories.find((c) => c.slug === slug) || mockCategories[0];

  // Filter videos by category (mock: show random subset)
  const categoryVideos = mockVideos.filter((v) =>
    v.categories.some((c) => c.slug === category.slug)
  );
  // If no exact match, show all videos as fallback
  const videos = categoryVideos.length > 0 ? categoryVideos : mockVideos;

  return <KategoriPageClient category={category} videos={videos} />;
}
