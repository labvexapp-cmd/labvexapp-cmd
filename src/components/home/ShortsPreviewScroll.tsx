"use client";

import { useState } from "react";
import Link from "next/link";
import { Play } from "lucide-react";
import { formatDuration, formatViewCount } from "@/lib/constants";
import type { Video } from "@/types";

interface ShortsPreviewScrollProps {
  videos: Video[];
}

export function ShortsPreviewScroll({ videos }: ShortsPreviewScrollProps) {
  if (videos.length === 0) return null;

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-600 text-white">
            <Play className="h-3.5 w-3.5" fill="white" />
          </div>
          <h2 className="text-lg font-bold text-foreground md:text-xl">
            Shorts
          </h2>
        </div>
        <Link
          href="/shorts"
          className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
        >
          Tümünü Gör
        </Link>
      </div>
      <div className="no-scrollbar flex gap-3 overflow-x-auto pb-2">
        {videos.map((video) => (
          <ShortsPreviewCard key={video.id} video={video} />
        ))}
      </div>
    </section>
  );
}

function ShortsPreviewCard({ video }: { video: Video }) {
  const [imgError, setImgError] = useState(false);

  return (
    <Link
      href={`/shorts/${video.slug}`}
      className="group relative flex-shrink-0"
      style={{ width: "140px" }}
    >
      <div className="relative aspect-[9/16] overflow-hidden rounded-xl bg-secondary">
        {video.thumbnail_url && !imgError ? (
          <img
            src={video.thumbnail_url}
            alt={video.title}
            loading="lazy"
            onError={() => setImgError(true)}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-secondary to-muted">
            <Play className="h-8 w-8 text-muted-foreground/30" />
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/80 to-transparent" />

        {/* Duration badge */}
        <div className="absolute bottom-8 right-2 rounded bg-black/80 px-1 py-0.5 text-[10px] font-medium text-white">
          {formatDuration(video.duration)}
        </div>

        {/* View count */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1 text-[10px] font-medium text-white/90">
          <Eye className="h-3 w-3" />
          {formatViewCount(video.view_count)}
        </div>

        {/* Hover play icon */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/20">
          <div className="scale-0 transition-transform group-hover:scale-100">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
              <Play className="ml-0.5 h-5 w-5 text-white" fill="white" />
            </div>
          </div>
        </div>
      </div>

      {/* Title */}
      <p className="mt-1.5 line-clamp-2 text-xs font-medium leading-snug text-foreground">
        {video.title}
      </p>
    </Link>
  );
}

function Eye({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
