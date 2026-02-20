import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getVideoBySlug, getRelatedVideos } from "@/lib/queries";
import { generateVideoJsonLd, generateVideoMeta, generateBreadcrumbJsonLd } from "@/lib/seo";
import { VideoPageClient } from "./VideoPageClient";

export const revalidate = 60;

// Dynamic metadata for each video page (SEO)
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const video = await getVideoBySlug(slug);
  if (!video) return { title: "Video Bulunamadı" };
  return generateVideoMeta(video);
}

export default async function VideoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const video = await getVideoBySlug(slug);
  if (!video) notFound();

  const relatedVideos = await getRelatedVideos(video.id, 8);

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
