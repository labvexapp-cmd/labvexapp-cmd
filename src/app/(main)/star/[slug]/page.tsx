import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getStarBySlug, getStarVideos, getRelatedStars } from "@/lib/queries";
import { StarPageClient } from "./StarPageClient";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const star = await getStarBySlug(slug);

  if (!star) return { title: "Star Bulunamadı" };

  const description = star.bio
    ? star.bio.slice(0, 160)
    : `${star.name} - ${star.video_count} video, ${star.view_count.toLocaleString("tr-TR")} görüntülenme`;

  return {
    title: `${star.name} - LabVex`,
    description,
    openGraph: {
      title: star.name,
      description,
      images: star.avatar_url ? [{ url: star.avatar_url }] : undefined,
    },
  };
}

export default async function StarPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const star = await getStarBySlug(slug);
  if (!star) notFound();

  const [videos, relatedStars] = await Promise.all([
    getStarVideos(star.id),
    getRelatedStars(star.id, 6),
  ]);

  return (
    <StarPageClient star={star} videos={videos} relatedStars={relatedStars} />
  );
}
