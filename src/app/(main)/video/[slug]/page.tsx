import { mockVideos } from "@/lib/mock-data";
import { VideoPageClient } from "./VideoPageClient";

// Generate static params for all mock videos (required for static export)
export function generateStaticParams() {
  return mockVideos.map((video) => ({
    slug: video.slug,
  }));
}

export default async function VideoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Find video by slug (will be replaced with DB query)
  const video = mockVideos.find((v) => v.slug === slug) || mockVideos[0];
  const relatedVideos = mockVideos.filter((v) => v.id !== video.id).slice(0, 8);

  return <VideoPageClient video={video} relatedVideos={relatedVideos} />;
}
