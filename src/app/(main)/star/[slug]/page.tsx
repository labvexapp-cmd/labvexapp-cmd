import { mockStars, mockVideos } from "@/lib/mock-data";
import { StarPageClient } from "./StarPageClient";

// Generate static params for all stars
export function generateStaticParams() {
  return mockStars.map((star) => ({
    slug: star.slug,
  }));
}

export default async function StarPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const star = mockStars.find((s) => s.slug === slug) || mockStars[0];

  // Filter videos by star (mock: show random subset)
  const starVideos = mockVideos.filter((v) =>
    v.stars.some((s) => s.slug === star.slug)
  );
  // If no exact match, show all videos as fallback
  const videos = starVideos.length > 0 ? starVideos : mockVideos;

  return <StarPageClient star={star} videos={videos} />;
}
