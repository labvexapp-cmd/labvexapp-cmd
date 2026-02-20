import { notFound } from "next/navigation";
import { getStarBySlug, getStarVideos } from "@/lib/queries";
import { StarPageClient } from "./StarPageClient";

export const revalidate = 60;

export default async function StarPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const star = await getStarBySlug(slug);
  if (!star) notFound();

  const videos = await getStarVideos(star.id);

  return <StarPageClient star={star} videos={videos} />;
}
