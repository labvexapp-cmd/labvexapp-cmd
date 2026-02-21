import { getVerticalVideos } from "@/lib/queries";
import { ShortsPageClient } from "../ShortsPageClient";

export const revalidate = 60;

export default async function ShortsPage() {
  const videos = await getVerticalVideos(20, 0);

  return <ShortsPageClient videos={videos} />;
}
