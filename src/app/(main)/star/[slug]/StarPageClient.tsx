"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Heart,
  Eye,
  Film,
  SlidersHorizontal,
  ChevronDown,
  MapPin,
  ExternalLink,
  Play,
  Image,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VideoCard } from "@/components/video/VideoCard";
import { formatViewCount } from "@/lib/constants";
import type { Star, Video } from "@/types";

type SortOption = "popular" | "newest" | "longest" | "most-viewed";
type TabKey = "videos" | "shorts" | "photos" | "about";

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

  // Videoları orientation'a göre ayır
  const regularVideos = useMemo(
    () => videos.filter((v) => v.orientation !== "vertical"),
    [videos]
  );
  const shortsVideos = useMemo(
    () => videos.filter((v) => v.orientation === "vertical"),
    [videos]
  );

  const sortLabels: Record<SortOption, string> = {
    popular: "Popüler",
    newest: "En Yeni",
    longest: "En Uzun",
    "most-viewed": "En Çok İzlenen",
  };

  const sortVideos = (list: Video[]) =>
    [...list].sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "longest":
          return b.duration - a.duration;
        case "most-viewed":
          return b.view_count - a.view_count;
        default:
          return b.like_count - a.like_count;
      }
    });

  const tabs: { key: TabKey; label: string; icon: typeof Film; count?: number }[] = [
    { key: "videos", label: "Videolar", icon: Play, count: regularVideos.length },
    { key: "shorts", label: "Shorts", icon: Smartphone, count: shortsVideos.length },
    { key: "photos", label: "Fotoğraflar", icon: Image, count: 0 },
    { key: "about", label: "Hakkında", icon: Film },
  ];

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

            {star.aliases && star.aliases.length > 0 && (
              <p className="mt-0.5 text-sm text-muted-foreground">
                aka {star.aliases.join(", ")}
              </p>
            )}

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
        {star.bio && activeTab !== "about" && (
          <p className="mt-3 text-sm text-muted-foreground line-clamp-2 max-w-2xl">
            {star.bio}
          </p>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-border px-4">
        <div className="no-scrollbar flex gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex shrink-0 items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "border-b-2 border-primary text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                {tab.count !== undefined && (
                  <span
                    className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${
                      isActive
                        ? "bg-primary/15 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="px-4 py-4">
        {/* Videos tab */}
        {activeTab === "videos" && (
          <VideoGrid
            videos={sortVideos(regularVideos)}
            sortBy={sortBy}
            sortLabels={sortLabels}
            showSort={showSort}
            onSortChange={(s) => { setSortBy(s); setShowSort(false); }}
            onToggleSort={() => setShowSort(!showSort)}
            emptyMessage="Henüz video bulunmuyor"
            columns="grid-cols-2 sm:grid-cols-3 md:grid-cols-4"
          />
        )}

        {/* Shorts tab */}
        {activeTab === "shorts" && (
          <VideoGrid
            videos={sortVideos(shortsVideos)}
            sortBy={sortBy}
            sortLabels={sortLabels}
            showSort={showSort}
            onSortChange={(s) => { setSortBy(s); setShowSort(false); }}
            onToggleSort={() => setShowSort(!showSort)}
            emptyMessage="Henüz shorts bulunmuyor"
            columns="grid-cols-3 sm:grid-cols-4 md:grid-cols-5"
          />
        )}

        {/* Photos tab */}
        {activeTab === "photos" && (
          <div className="py-16 text-center">
            <Image className="mx-auto h-12 w-12 text-muted-foreground/30" />
            <p className="mt-3 text-muted-foreground">
              Henüz fotoğraf bulunmuyor
            </p>
          </div>
        )}

        {/* About tab */}
        {activeTab === "about" && <AboutTab star={star} />}
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

// ===== Reusable video grid with sort =====
function VideoGrid({
  videos,
  sortBy,
  sortLabels,
  showSort,
  onSortChange,
  onToggleSort,
  emptyMessage,
  columns,
}: {
  videos: Video[];
  sortBy: SortOption;
  sortLabels: Record<SortOption, string>;
  showSort: boolean;
  onSortChange: (s: SortOption) => void;
  onToggleSort: () => void;
  emptyMessage: string;
  columns: string;
}) {
  if (videos.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <>
      {/* Sort bar */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {videos.length} içerik
        </p>
        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleSort}
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
                  onClick={() => onSortChange(option)}
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

      {/* Grid */}
      <div className={`grid gap-3 lg:gap-4 ${columns}`}>
        {videos.map((video) => (
          <VideoCard key={video.id} video={video} />
        ))}
      </div>
    </>
  );
}

// ===== Hakkında sekmesi =====
function AboutTab({ star }: { star: Star }) {
  return (
    <div className="max-w-2xl space-y-6">
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

      {star.aliases && star.aliases.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-foreground">
            Diğer İsimler
          </h3>
          <div className="flex flex-wrap gap-2">
            {star.aliases.map((alias) => (
              <Badge key={alias} variant="secondary" className="text-xs">
                {alias}
              </Badge>
            ))}
          </div>
        </div>
      )}

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

      {star.nationality && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-foreground">
            Milliyet
          </h3>
          <p className="text-sm text-muted-foreground">{star.nationality}</p>
        </div>
      )}

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
