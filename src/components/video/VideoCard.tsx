"use client";

import { useState } from "react";
import Link from "next/link";
import { Clock, Eye, ThumbsUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDuration, formatViewCount, formatRelativeTime } from "@/lib/constants";
import type { Video } from "@/types";

interface VideoCardProps {
  video: Video;
  priority?: boolean;
}

export function VideoCard({ video, priority = false }: VideoCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imgError, setImgError] = useState(false);

  return (
    <Link
      href={`/video/${video.slug}`}
      className="video-card-hover group block overflow-hidden rounded-xl"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Thumbnail container */}
      <div
        className={`relative overflow-hidden bg-secondary ${
          video.orientation === "vertical"
            ? "aspect-[9/16]"
            : "aspect-video"
        }`}
      >
        {/* Actual thumbnail image */}
        {video.thumbnail_url && !imgError ? (
          <img
            src={video.thumbnail_url}
            alt={video.title}
            loading={priority ? "eager" : "lazy"}
            onError={() => setImgError(true)}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-secondary to-muted">
            <div className="flex h-full items-center justify-center">
              <svg
                viewBox="0 0 24 24"
                className="h-12 w-12 text-muted-foreground/30"
                fill="currentColor"
              >
                <polygon points="6 3 20 12 6 21 6 3" />
              </svg>
            </div>
          </div>
        )}

        {/* Hover preview (animated webp from BunnyCDN) */}
        {isHovered && video.preview_url && (
          <img
            src={video.preview_url}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        {isHovered && !video.preview_url && (
          <div className="absolute inset-0 bg-black/20 transition-opacity" />
        )}

        {/* Duration badge */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded bg-black/80 px-1.5 py-0.5 text-xs font-medium text-white">
          <Clock className="h-3 w-3" />
          {formatDuration(video.duration)}
        </div>

        {/* Quality badge */}
        {video.quality && (
          <div className="absolute left-2 top-2">
            <Badge
              variant="secondary"
              className={`text-[10px] font-bold ${
                video.quality === "4K"
                  ? "bg-amber-accent/90 text-black"
                  : video.quality === "FHD"
                    ? "bg-primary/90 text-white"
                    : "bg-secondary/90 text-foreground"
              }`}
            >
              {video.quality === "FHD" ? "1080p" : video.quality}
            </Badge>
          </div>
        )}

        {/* Vertical badge */}
        {video.orientation === "vertical" && (
          <div className="absolute right-2 top-2">
            <Badge
              variant="secondary"
              className="bg-purple-600/90 text-[10px] font-bold text-white"
            >
              Shorts
            </Badge>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-2.5">
        <h3 className="line-clamp-2 text-sm font-medium leading-snug text-foreground group-hover:text-primary transition-colors">
          {video.title}
        </h3>

        {video.stars.length > 0 && (
          <p className="mt-1 text-xs text-primary/80 line-clamp-1">
            {video.stars.map((s) => s.name).join(", ")}
          </p>
        )}

        <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {formatViewCount(video.view_count)}
          </span>
          <span className="flex items-center gap-1">
            <ThumbsUp className="h-3 w-3" />
            {formatViewCount(video.like_count)}
          </span>
          <span>{formatRelativeTime(video.created_at)}</span>
        </div>
      </div>
    </Link>
  );
}
