import { CategoryScroll } from "@/components/home/CategoryScroll";
import { StarScroll } from "@/components/home/StarScroll";
import { ShortsPreviewScroll } from "@/components/home/ShortsPreviewScroll";
import { HomePageClient } from "@/components/home/HomePageClient";
import {
  getVideos,
  getVerticalVideos,
  getCategories,
  getStars,
} from "@/lib/queries";
import { generateWebsiteJsonLd } from "@/lib/seo";

export const revalidate = 60;

export default async function HomePage() {
  const jsonLd = generateWebsiteJsonLd();

  // Paralel Supabase sorguları
  const [
    trendingVideos,
    newVideos,
    popularVideos,
    topRatedVideos,
    shortsVideos,
    categories,
    stars,
  ] = await Promise.all([
    getVideos("view_count", 8),
    getVideos("created_at", 8),
    getVideos("like_count", 8),
    getVideos("like_count", 8),
    getVerticalVideos(8),
    getCategories(),
    getStars(),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-2 md:py-4">
      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Sub-nav tabs + video grid */}
      <HomePageClient
        trendingVideos={trendingVideos}
        newVideos={newVideos}
        popularVideos={popularVideos}
        topRatedVideos={topRatedVideos}
      />

      {/* Shorts carousel */}
      {shortsVideos.length > 0 && (
        <div className="mt-6">
          <ShortsPreviewScroll videos={shortsVideos} />
        </div>
      )}

      {/* Categories */}
      {categories.length > 0 && (
        <div className="mt-6">
          <CategoryScroll categories={categories} />
        </div>
      )}

      {/* Popular Stars */}
      {stars.length > 0 && (
        <div className="mt-6">
          <StarScroll stars={stars} />
        </div>
      )}
    </div>
  );
}
