import { notFound } from "next/navigation";
import { getVideoBySlug, getVerticalVideos, getStarVerticalVideos } from "@/lib/queries";
import { ShortsPageClient } from "../../ShortsPageClient";

export const revalidate = 60;

export default async function ShortsDeepLinkPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const targetVideo = await getVideoBySlug(slug);
  if (!targetVideo || targetVideo.orientation !== "vertical") notFound();

  // Star context: videonun star'larından diğer shorts'ları çek
  const starIds = targetVideo.stars.map((s) => s.id);

  const [starVideos, generalVideos] = await Promise.all([
    starIds.length > 0
      ? getStarVerticalVideos(starIds, targetVideo.id, 19)
      : Promise.resolve([]),
    getVerticalVideos(19, 0),
  ]);

  // Sıralama: tıklanan video → aynı star'ın shorts'ları → genel shorts (deduplicate)
  const seenIds = new Set([targetVideo.id]);

  const starFiltered = starVideos.filter((v) => {
    if (seenIds.has(v.id)) return false;
    seenIds.add(v.id);
    return true;
  });

  const generalFiltered = generalVideos.filter((v) => {
    if (seenIds.has(v.id)) return false;
    seenIds.add(v.id);
    return true;
  });

  const videos = [targetVideo, ...starFiltered, ...generalFiltered].slice(0, 20);

  return <ShortsPageClient videos={videos} initialSlug={slug} />;
}
