"use client";

import { ShortsPlayer } from "./ShortsPlayer";
import { ShortsOverlay } from "./ShortsOverlay";
import { ShortsSideActions } from "./ShortsSideActions";
import type { Video } from "@/types";

interface ShortsItemProps {
  video: Video;
  index: number;
  isActive: boolean;
  isNear: boolean; // aktif ±1 aralığında mı
}

export function ShortsItem({ video, index, isActive, isNear }: ShortsItemProps) {
  return (
    <div
      data-index={index}
      className="shorts-item relative flex items-center justify-center"
    >
      {/* Video player veya thumbnail */}
      <div className="relative h-full w-full max-w-[480px] mx-auto">
        {isNear ? (
          <ShortsPlayer video={video} isActive={isActive} />
        ) : (
          <div className="h-full w-full">
            {video.thumbnail_url ? (
              <img
                src={video.thumbnail_url}
                alt={video.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-zinc-900" />
            )}
          </div>
        )}

        {/* Sol alt bilgi overlay */}
        <ShortsOverlay video={video} />

        {/* Sağ side actions */}
        <ShortsSideActions video={video} />
      </div>
    </div>
  );
}
