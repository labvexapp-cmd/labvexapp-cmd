"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { Video } from "@/types";

interface ShortsOverlayProps {
  video: Video;
}

export function ShortsOverlay({ video }: ShortsOverlayProps) {
  return (
    <div className="absolute bottom-0 left-0 right-16 z-20 p-4 pb-14 pointer-events-none">
      {/* Gradient arka plan */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />

      <div className="relative pointer-events-auto">
        {/* Star adı */}
        {video.stars.length > 0 && (
          <Link
            href={`/star/${video.stars[0].slug}`}
            className="mb-2 inline-flex items-center gap-2 text-sm font-bold text-white hover:text-primary transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            {video.stars[0].avatar_url ? (
              <img
                src={video.stars[0].avatar_url}
                alt={video.stars[0].name}
                className="h-8 w-8 rounded-full border border-white/20 object-cover"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
                {video.stars[0].name.charAt(0)}
              </div>
            )}
            @{video.stars[0].name}
          </Link>
        )}

        {/* Video başlığı */}
        <p className="mb-2 text-sm font-medium text-white line-clamp-2">
          {video.title}
        </p>

        {/* Kategori badge'leri */}
        {video.categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {video.categories.slice(0, 3).map((cat) => (
              <Link
                key={cat.id}
                href={`/kategori/${cat.slug}`}
                onClick={(e) => e.stopPropagation()}
              >
                <Badge
                  variant="secondary"
                  className="bg-white/15 text-[10px] text-white/90 hover:bg-white/25 backdrop-blur-sm border-0"
                >
                  {cat.name}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
