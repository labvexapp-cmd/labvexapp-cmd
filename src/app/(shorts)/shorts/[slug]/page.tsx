import { notFound } from "next/navigation";
import { getVideoBySlug, getVerticalVideos } from "@/lib/queries";
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

  // Diğer shorts videoları yükle (hedef video hariç)
  const otherVideos = await getVerticalVideos(19, 0);
  const filtered = otherVideos.filter((v) => v.id !== targetVideo.id);

  // Hedef video ilk sıraya
  const videos = [targetVideo, ...filtered];

  return <ShortsPageClient videos={videos} initialSlug={slug} />;
}
