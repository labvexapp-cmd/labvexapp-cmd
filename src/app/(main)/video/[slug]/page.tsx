import type { Metadata } from "next";
import { mockVideos } from "@/lib/mock-data";
import { generateVideoJsonLd, generateVideoMeta, generateBreadcrumbJsonLd } from "@/lib/seo";
import { VideoPageClient } from "./VideoPageClient";

// Generate static params for all mock videos (required for static export)
export function generateStaticParams() {
  return mockVideos.map((video) => ({
    slug: video.slug,
  }));
}

// Dynamic metadata for each video page (SEO)
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const video = mockVideos.find((v) => v.slug === slug) || mockVideos[0];
  return generateVideoMeta(video);
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

  // JSON-LD structured data
  const videoJsonLd = generateVideoJsonLd(video);
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: "Ana Sayfa", url: "https://labvex.site" },
    ...(video.categories[0]
      ? [
          {
            name: video.categories[0].name,
            url: `https://labvex.site/kategori/${video.categories[0].slug}`,
          },
        ]
      : []),
    { name: video.title, url: `https://labvex.site/video/${video.slug}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(videoJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <VideoPageClient video={video} relatedVideos={relatedVideos} />
    </>
  );
}
