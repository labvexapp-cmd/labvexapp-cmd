import { VideoGrid } from "@/components/video/VideoGrid";
import { CategoryScroll } from "@/components/home/CategoryScroll";
import { StarScroll } from "@/components/home/StarScroll";
import { getVideos, getCategories, getStars } from "@/lib/queries";
import { Flame } from "lucide-react";
import { generateWebsiteJsonLd } from "@/lib/seo";

// ISR: 60 saniyede bir revalidate
export const revalidate = 60;

export default async function HomePage() {
  const jsonLd = generateWebsiteJsonLd();

  // Paralel Supabase sorguları
  const [trendingVideos, newVideos, popularVideos, categories, stars] =
    await Promise.all([
      getVideos("view_count", 8),
      getVideos("created_at", 8),
      getVideos("like_count", 8),
      getCategories(),
      getStars(),
    ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-4 md:py-6">
      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero section */}
      <section className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-r from-primary/20 via-card to-accent/20 p-6 md:p-8">
        <div className="flex items-center gap-2 text-primary">
          <Flame className="h-6 w-6" />
          <h1 className="text-xl font-bold md:text-2xl">
            En Popüler Videolar
          </h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Bugün en çok izlenen videolar burada. Hemen keşfet!
        </p>
      </section>

      {/* Categories horizontal scroll */}
      {categories.length > 0 && (
        <div className="mb-6">
          <CategoryScroll categories={categories} />
        </div>
      )}

      {/* Trending videos */}
      {trendingVideos.length > 0 && (
        <div className="mb-8">
          <VideoGrid
            videos={trendingVideos}
            title="Trend Videolar"
            columns={4}
          />
        </div>
      )}

      {/* Popular stars */}
      {stars.length > 0 && (
        <div className="mb-8">
          <StarScroll stars={stars} />
        </div>
      )}

      {/* New videos */}
      {newVideos.length > 0 && (
        <div className="mb-8">
          <VideoGrid
            videos={newVideos}
            title="Yeni Eklenenler"
            columns={4}
          />
        </div>
      )}

      {/* Most viewed */}
      {popularVideos.length > 0 && (
        <div className="mb-8">
          <VideoGrid
            videos={popularVideos}
            title="En Çok İzlenenler"
            columns={4}
          />
        </div>
      )}
    </div>
  );
}
