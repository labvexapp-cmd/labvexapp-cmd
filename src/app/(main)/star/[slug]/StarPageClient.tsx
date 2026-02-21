"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Heart,
  Eye,
  Film,
  SlidersHorizontal,
  ChevronDown,
  MapPin,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VideoCard } from "@/components/video/VideoCard";
import { formatViewCount } from "@/lib/constants";
import type { Star, Video } from "@/types";

type SortOption = "popular" | "newest" | "longest" | "most-viewed";
type TabKey = "videos" | "about";

interface StarPageClientProps {
  star: Star;
  videos: Video[];
  relatedStars: Star[];
}

export function StarPageClient({
  star,
  videos,
  relatedStars,
}: StarPageClientProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("videos");
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
    <div className="mx-auto max-w-7xl">
      {/* Cover Image */}
      <div className="relative h-48 w-full overflow-hidden md:h-64">
        {star.cover_url ? (
          <img
            src={star.cover_url}
            alt={`${star.name} cover`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-r from-primary/20 via-card to-accent/20" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
      </div>

      {/* Profile header */}
      <div className="relative px-4 pb-4">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-end -mt-12 sm:-mt-16">
          {/* Avatar */}
          <div className="relative z-10 h-24 w-24 shrink-0 overflow-hidden rounded-full border-4 border-background sm:h-32 sm:w-32">
            {star.avatar_url ? (
              <img
                src={star.avatar_url}
                alt={star.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/30 to-accent/30 text-3xl font-bold text-primary sm:text-4xl">
                {star.name.charAt(0)}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 text-center sm:text-left sm:pb-1">
            <h1 className="text-xl font-bold text-foreground md:text-2xl">
              {star.name}
            </h1>

            {/* Aliases */}
            {star.aliases && star.aliases.length > 0 && (
              <p className="mt-0.5 text-sm text-muted-foreground">
                aka {star.aliases.join(", ")}
              </p>
            )}

            {/* Stats row */}
            <div className="mt-2 flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground sm:justify-start">
              <span className="flex items-center gap-1.5">
                <Film className="h-4 w-4 text-primary" />
                {star.video_count} video
              </span>
              <span className="flex items-center gap-1.5">
                <Eye className="h-4 w-4 text-primary" />
                {formatViewCount(star.view_count)} görüntülenme
              </span>
              {star.nationality && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-primary" />
                  {star.nationality}
                </span>
              )}
            </div>
          </div>

          {/* Follow button */}
          <div className="sm:pb-1">
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

        {/* Short bio */}
        {star.bio && activeTab === "videos" && (
          <p className="mt-3 text-sm text-muted-foreground line-clamp-2 max-w-2xl">
            {star.bio}
          </p>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-border px-4">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab("videos")}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === "videos"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Videolar
          </button>
          <button
            onClick={() => setActiveTab("about")}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === "about"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Hakkında
          </button>
        </div>
      </div>

      {/* Tab content */}
      <div className="px-4 py-4">
        {activeTab === "videos" ? (
          <>
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

            {sortedVideos.length === 0 && (
              <div className="py-12 text-center text-muted-foreground">
                Henüz video bulunmuyor
              </div>
            )}
          </>
        ) : (
          <AboutTab star={star} />
        )}
      </div>

      {/* Related Stars */}
      {relatedStars.length > 0 && (
        <div className="border-t border-border px-4 py-6">
          <h3 className="mb-4 text-lg font-bold text-foreground">
            Benzer Starlar
          </h3>
          <div className="no-scrollbar flex gap-4 overflow-x-auto pb-2">
            {relatedStars.map((rs) => (
              <Link
                key={rs.id}
                href={`/star/${rs.slug}`}
                className="group flex flex-shrink-0 flex-col items-center gap-2"
              >
                <div className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-border bg-secondary transition-all group-hover:border-primary group-hover:glow-cyan md:h-20 md:w-20">
                  {rs.avatar_url ? (
                    <img
                      src={rs.avatar_url}
                      alt={rs.name}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-lg font-bold text-muted-foreground">
                      {rs.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <p className="text-xs font-medium text-foreground group-hover:text-primary transition-colors md:text-sm">
                    {rs.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground md:text-xs">
                    {rs.video_count} video
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ===== Hakkında sekmesi =====
function AboutTab({ star }: { star: Star }) {
  return (
    <div className="max-w-2xl space-y-6">
      {/* Tam biyografi */}
      {star.bio && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-foreground">
            Biyografi
          </h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {star.bio}
          </p>
        </div>
      )}

      {/* Fiziksel bilgiler */}
      {star.measurements && Object.keys(star.measurements).length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-foreground">
            Fiziksel Bilgiler
          </h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {Object.entries(star.measurements).map(([key, value]) => (
              <div
                key={key}
                className="rounded-lg bg-card p-3 border border-border"
              >
                <p className="text-xs text-muted-foreground capitalize">
                  {key.replace(/_/g, " ")}
                </p>
                <p className="mt-0.5 text-sm font-medium text-foreground">
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Aliases */}
      {star.aliases && star.aliases.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-foreground">
            Diğer İsimler
          </h3>
          <div className="flex flex-wrap gap-2">
            {star.aliases.map((alias) => (
              <Badge
                key={alias}
                variant="secondary"
                className="text-xs"
              >
                {alias}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Sosyal medya */}
      {star.social_media && Object.keys(star.social_media).length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-foreground">
            Sosyal Medya
          </h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(star.social_media).map(([platform, url]) => (
              <a
                key={platform}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-card px-3 py-2 text-sm font-medium text-foreground border border-border transition-colors hover:bg-secondary hover:text-primary"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                {platform}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Milliyet */}
      {star.nationality && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-foreground">
            Milliyet
          </h3>
          <p className="text-sm text-muted-foreground">{star.nationality}</p>
        </div>
      )}

      {/* No info */}
      {!star.bio &&
        !star.measurements &&
        !star.aliases &&
        !star.social_media &&
        !star.nationality && (
          <div className="py-8 text-center text-muted-foreground">
            Bu star hakkında henüz bilgi bulunmuyor
          </div>
        )}
    </div>
  );
}
