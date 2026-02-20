"use client";

import { useState } from "react";
import {
  Play,
  Pause,
  Maximize,
  Volume2,
  VolumeX,
  Settings,
} from "lucide-react";

interface VideoPlayerProps {
  videoUrl?: string;
  thumbnailUrl?: string;
  title: string;
  orientation: "horizontal" | "vertical" | "square";
}

export function VideoPlayer({
  videoUrl,
  thumbnailUrl,
  title,
  orientation,
}: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-black ${
        orientation === "vertical"
          ? "mx-auto aspect-[9/16] max-h-[80vh]"
          : "aspect-video w-full"
      }`}
    >
      {/* Placeholder - will be replaced with Vidstack player */}
      <div className="flex h-full items-center justify-center bg-gradient-to-br from-zinc-900 to-black">
        <div className="text-center">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="group mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/20 transition-all hover:bg-primary/30 hover:scale-110"
          >
            {isPlaying ? (
              <Pause className="h-8 w-8 text-primary" />
            ) : (
              <Play className="ml-1 h-8 w-8 text-primary" />
            )}
          </button>
          <p className="text-sm text-muted-foreground">
            Video player - Vidstack entegrasyonu yapılacak
          </p>
        </div>
      </div>

      {/* Bottom controls overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
        {/* Progress bar */}
        <div className="mb-3 h-1 w-full overflow-hidden rounded-full bg-white/20">
          <div className="h-full w-1/3 rounded-full bg-primary" />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="text-white transition-opacity hover:opacity-80"
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
            </button>
            <button className="text-white transition-opacity hover:opacity-80">
              <Volume2 className="h-5 w-5" />
            </button>
            <span className="text-xs text-white/70">0:00 / 12:34</span>
          </div>

          <div className="flex items-center gap-3">
            <button className="text-white transition-opacity hover:opacity-80">
              <Settings className="h-5 w-5" />
            </button>
            <button className="text-white transition-opacity hover:opacity-80">
              <Maximize className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
