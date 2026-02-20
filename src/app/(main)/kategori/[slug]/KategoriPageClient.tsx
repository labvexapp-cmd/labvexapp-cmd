"use client";

import { useState } from "react";
import { Grid3X3, SlidersHorizontal, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VideoCard } from "@/components/video/VideoCard";
import { formatViewCount } from "@/lib/constants";
import type { Category, Video } from "@/types";

type SortOption = "popular" | "newest" | "longest" | "most-viewed";

interface KategoriPageClientProps {
  category: Category;
  videos: Video[];
}

export function KategoriPageClient({
  category,
  videos,
}: KategoriPageClientProps) {
  const [sortBy, setSortBy] = useState<SortOption>("popular");
  const [showSort, setShowSort] = useState(false);

  const sortLabels: Record<SortOption, string> = {
    popular: "Popüler",
    newest: "En Yeni",
    longest: "En Uzun",
    "most-viewed": "En Çok İzlenen",
  };

  const sortedVideos = [...videos].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      case "longest":
        return b.duration - a.duration;
      case "most-viewed":
        return b.view_count - a.view_count;
      default:
        return b.like_count - a.like_count;
    }
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-4 md:py-6">
      {/* Page header */}
      <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-r from-primary/10 via-card to-accent/10 p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/20 text-2xl font-bold text-primary">
            {category.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground md:text-2xl">
              {category.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              {formatViewCount(category.video_count)} video
            </p>
          </div>
        </div>
        {category.description && (
          <p className="mt-3 text-sm text-muted-foreground">
            {category.description}
          </p>
        )}
      </div>

      {/* Sort & Filter bar */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {sortedVideos.length} video bulundu
        </p>
        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSort(!showSort)}
            className="gap-1.5"
          >
            <SlidersHorizontal className="h-4 w-4" />
            {sortLabels[sortBy]}
            <ChevronDown className="h-3 w-3" />
          </Button>
          {showSort && (
            <div className="absolute right-0 top-full z-10 mt-1 w-44 overflow-hidden rounded-lg border border-border bg-card shadow-xl">
              {(Object.keys(sortLabels) as SortOption[]).map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    setSortBy(option);
                    setShowSort(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-sm transition-colors hover:bg-secondary ${
                    sortBy === option
                      ? "bg-primary/10 text-primary"
                      : "text-foreground"
                  }`}
                >
                  {sortLabels[option]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Video grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:gap-4">
        {sortedVideos.map((video) => (
          <VideoCard key={video.id} video={video} />
        ))}
      </div>

      {/* Empty state */}
      {sortedVideos.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Grid3X3 className="mb-4 h-12 w-12 text-muted-foreground/30" />
          <h3 className="text-lg font-semibold text-foreground">
            Video bulunamadı
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Bu kategoride henüz video yok.
          </p>
        </div>
      )}
    </div>
  );
}
