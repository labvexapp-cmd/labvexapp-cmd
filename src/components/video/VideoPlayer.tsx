"use client";

import { useState } from "react";
import { Play } from "lucide-react";

interface VideoPlayerProps {
  videoUrl?: string;
  bunnyVideoId?: string;
  thumbnailUrl?: string;
  title: string;
  orientation: "horizontal" | "vertical" | "square";
}

const LIBRARY_ID = "603403";

export function VideoPlayer({
  videoUrl,
  bunnyVideoId,
  thumbnailUrl,
  title,
  orientation,
}: VideoPlayerProps) {
  const [started, setStarted] = useState(false);

  // BunnyCDN video ID'sini URL'den veya prop'tan al
  const resolvedBunnyId = bunnyVideoId || extractBunnyId(videoUrl);

  // BunnyCDN iframe embed URL
  const embedUrl = resolvedBunnyId
    ? `https://iframe.mediadelivery.net/embed/${LIBRARY_ID}/${resolvedBunnyId}?autoplay=true&preload=true&responsive=true`
    : null;

  const aspectClass =
    orientation === "vertical"
      ? "mx-auto aspect-[9/16] max-h-[80vh]"
      : "aspect-video w-full";

  // Video URL yoksa placeholder göster
  if (!embedUrl) {
    return (
      <div className={`relative overflow-hidden rounded-xl bg-black ${aspectClass}`}>
        <div className="flex h-full items-center justify-center bg-gradient-to-br from-zinc-900 to-black">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/20">
              <Play className="ml-1 h-8 w-8 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">Video yükleniyor...</p>
          </div>
        </div>
      </div>
    );
  }

  // Başlamadan önce thumbnail + play butonu göster
  if (!started && thumbnailUrl) {
    return (
      <div
        className={`group relative cursor-pointer overflow-hidden rounded-xl bg-black ${aspectClass}`}
        onClick={() => setStarted(true)}
      >
        <img
          src={thumbnailUrl}
          alt={title}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 transition-colors group-hover:bg-black/40">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/90 shadow-lg shadow-primary/30 transition-transform group-hover:scale-110">
            <Play className="ml-1 h-8 w-8 text-white" fill="white" />
          </div>
        </div>
      </div>
    );
  }

  // BunnyCDN iframe player
  return (
    <div className={`relative overflow-hidden rounded-xl bg-black ${aspectClass}`}>
      <iframe
        src={embedUrl}
        loading="lazy"
        className="absolute inset-0 h-full w-full border-0"
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
        title={title}
      />
    </div>
  );
}

// HLS URL'den bunny video ID çıkar: .../GUID/playlist.m3u8
function extractBunnyId(url?: string): string | null {
  if (!url) return null;
  const match = url.match(/([a-f0-9-]{36})\/playlist\.m3u8/i);
  return match?.[1] || null;
}
