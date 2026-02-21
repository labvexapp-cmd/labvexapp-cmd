"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { ShortsItem } from "@/components/shorts/ShortsItem";
import { ShortsNavArrows } from "@/components/shorts/ShortsNavArrows";
import type { Video } from "@/types";

interface ShortsPageClientProps {
  videos: Video[];
  initialSlug?: string;
}

export function ShortsPageClient({ videos, initialSlug }: ShortsPageClientProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const feedRef = useRef<HTMLDivElement>(null);

  const toggleMute = useCallback(() => setIsMuted((prev) => !prev), []);

  // Klavye navigasyonu
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault();
        scrollToIndex(activeIndex + 1);
      } else if (e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault();
        scrollToIndex(activeIndex - 1);
      } else if (e.key === "Escape") {
        window.history.back();
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [activeIndex]);

  // IntersectionObserver ile aktif video tespiti
  useEffect(() => {
    const feed = feedRef.current;
    if (!feed) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
            const index = Number(
              (entry.target as HTMLElement).dataset.index
            );
            if (!isNaN(index)) {
              setActiveIndex(index);
              // URL güncelle
              const video = videos[index];
              if (video) {
                window.history.replaceState(null, "", `/shorts/${video.slug}`);
              }
            }
          }
        }
      },
      { root: feed, threshold: 0.6 }
    );

    const items = feed.querySelectorAll("[data-index]");
    items.forEach((item) => observer.observe(item));

    return () => observer.disconnect();
  }, [videos]);

  const scrollToIndex = useCallback(
    (index: number) => {
      if (index < 0 || index >= videos.length) return;
      const feed = feedRef.current;
      if (!feed) return;

      const target = feed.querySelector(
        `[data-index="${index}"]`
      ) as HTMLElement;
      if (target) {
        target.scrollIntoView({ behavior: "smooth" });
      }
    },
    [videos.length]
  );

  const handleNext = useCallback(() => {
    scrollToIndex(activeIndex + 1);
  }, [activeIndex, scrollToIndex]);

  const handlePrev = useCallback(() => {
    scrollToIndex(activeIndex - 1);
  }, [activeIndex, scrollToIndex]);

  if (videos.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-white">
        <p className="text-lg text-white/60">Henüz shorts videosu yok</p>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      {/* Scroll-snap feed */}
      <div ref={feedRef} className="shorts-feed">
        {videos.map((video, index) => (
          <ShortsItem
            key={video.id}
            video={video}
            index={index}
            isActive={index === activeIndex}
            isNear={Math.abs(index - activeIndex) <= 1}
            isMuted={isMuted}
            onMuteToggle={toggleMute}
          />
        ))}
      </div>

      {/* Desktop nav arrows */}
      <ShortsNavArrows
        onPrev={handlePrev}
        onNext={handleNext}
        hasPrev={activeIndex > 0}
        hasNext={activeIndex < videos.length - 1}
      />
    </div>
  );
}
