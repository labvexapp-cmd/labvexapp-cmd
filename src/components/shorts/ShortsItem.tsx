"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ShortsPlayer } from "./ShortsPlayer";
import { ShortsOverlay } from "./ShortsOverlay";
import { ShortsSideActions } from "./ShortsSideActions";
import type { Video } from "@/types";

interface ShortsItemProps {
  video: Video;
  index: number;
  isActive: boolean;
  isNear: boolean;
  isMuted: boolean;
  onMuteToggle: () => void;
}

export function ShortsItem({
  video,
  index,
  isActive,
  isNear,
  isMuted,
  onMuteToggle,
}: ShortsItemProps) {
  const [showUI, setShowUI] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetHideTimer = useCallback(() => {
    setShowUI(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowUI(false), 3000);
  }, []);

  // Aktif olunca timer başlat, pasifken UI göster (scroll arası)
  useEffect(() => {
    if (isActive) {
      resetHideTimer();
    } else {
      setShowUI(true);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    }
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [isActive, resetHideTimer]);

  return (
    <div
      data-index={index}
      className="shorts-item relative flex items-center justify-center"
    >
      <div className="relative h-full w-full max-w-[480px] mx-auto">
        {isNear ? (
          <ShortsPlayer
            video={video}
            isActive={isActive}
            isMuted={isMuted}
            onMuteToggle={onMuteToggle}
            showUI={showUI}
            onInteraction={resetHideTimer}
          />
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

        <ShortsOverlay video={video} visible={showUI} />
        <ShortsSideActions video={video} visible={showUI} />
      </div>
    </div>
  );
}
