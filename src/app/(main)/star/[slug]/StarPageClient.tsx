"use client";

import { useState } from "react";
import {
  Heart,
  Eye,
  Film,
  SlidersHorizontal,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { VideoCard } from "@/components/video/VideoCard";
import { formatViewCount } from "@/lib/constants";
import type { Star, Video } from "@/types";

type SortOption = "popular" | "newest" | "longest" | "most-viewed";

interface StarPageClientProps {
  star: Star;
  videos: Video[];
}

export function StarPageClient({ star, videos }: StarPageClientProps) {
  const [sortBy, setSortBy] = useState<SortOption>("popular");
  const [showSort, setShowSort] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

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
      {/* Star profile header */}
      <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-r from-primary/10 via-card to-accent/10 p-6">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          {/* Avatar */}
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/30 to-accent/30 text-3xl font-bold text-primary">
            {star.name.charAt(0)}
          </div>

          {/* Info */}
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-xl font-bold text-foreground md:text-2xl">
              {star.name}
            </h1>

            {/* Stats */}
            <div className="mt-2 flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground sm:justify-start">
              <span className="flex items-center gap-1.5">
                <Film className="h-4 w-4 text-primary" />
                {star.video_count} video
              </span>
              <span className="flex items-center gap-1.5">
                <Eye className="h-4 w-4 text-primary" />
                {formatViewCount(star.view_count)} görüntülenme
              </span>
            </div>

            {star.bio && (
              <p className="mt-3 text-sm text-muted-foreground">{star.bio}</p>
            )}

            {/* Follow button */}
            <div className="mt-3">
              <Button
                variant={isFollowing ? "default" : "outline"}
                size="sm"
                onClick={() => setIsFollowing(!isFollowing)}
                className="gap-1.5"
              >
                <Heart
                  className={`h-4 w-4 ${isFollowing ? "fill-current" : ""}`}
                />
                {isFollowing ? "Takip Ediliyor" : "Takip Et"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Sort bar */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {sortedVideos.length} video
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
    </div>
  );
}
