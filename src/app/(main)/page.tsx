import { VideoGrid } from "@/components/video/VideoGrid";
import { CategoryScroll } from "@/components/home/CategoryScroll";
import { StarScroll } from "@/components/home/StarScroll";
import { mockVideos, mockCategories, mockStars } from "@/lib/mock-data";
import { TrendingUp, Clock, Flame } from "lucide-react";

export default function HomePage() {
  const trendingVideos = mockVideos.slice(0, 8);
  const newVideos = mockVideos.slice(8, 16);
  const popularVideos = mockVideos.slice(16, 24);

  return (
    <div className="mx-auto max-w-7xl px-4 py-4 md:py-6">
      {/* Hero section - featured/trending banner */}
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
      <div className="mb-6">
        <CategoryScroll categories={mockCategories} />
      </div>

      {/* Trending videos */}
      <div className="mb-8">
        <VideoGrid
          videos={trendingVideos}
          title="Trend Videolar"
          columns={4}
        />
      </div>

      {/* Popular stars */}
      <div className="mb-8">
        <StarScroll stars={mockStars} />
      </div>

      {/* New videos */}
      <div className="mb-8">
        <VideoGrid
          videos={newVideos}
          title="Yeni Eklenenler"
          columns={4}
        />
      </div>

      {/* Most viewed */}
      <div className="mb-8">
        <VideoGrid
          videos={popularVideos}
          title="En Çok İzlenenler"
          columns={4}
        />
      </div>
    </div>
  );
}
