"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

const LIBRARY_ID = "603403";

interface ShortsPlayerProps {
  video: {
    video_url: string;
    thumbnail_url: string;
    title: string;
  };
  isActive: boolean;
}

function extractBunnyId(url?: string): string | null {
  if (!url) return null;
  const match = url.match(/([a-f0-9-]{36})\/playlist\.m3u8/i);
  return match?.[1] || null;
}

export function ShortsPlayer({ video, isActive }: ShortsPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playerRef = useRef<any>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [playerReady, setPlayerReady] = useState(false);

  const bunnyId = extractBunnyId(video.video_url);
  const embedUrl = bunnyId
    ? `https://iframe.mediadelivery.net/embed/${LIBRARY_ID}/${bunnyId}?autoplay=true&preload=true&responsive=true&muted=true`
    : null;

  // player.js init
  useEffect(() => {
    if (!iframeRef.current || !embedUrl) return;
    let cancelled = false;

    const init = async () => {
      try {
        const playerjs = await import("player.js");
        if (cancelled || !iframeRef.current) return;
        const p = new playerjs.Player(iframeRef.current);
        p.on("ready", () => {
          if (!cancelled) {
            playerRef.current = p;
            setPlayerReady(true);
          }
        });
      } catch (err) {
        console.warn("player.js init error:", err);
      }
    };

    const timer = setTimeout(init, 500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [embedUrl]);

  // Aktif/pasif kontrolü
  useEffect(() => {
    const player = playerRef.current;
    if (!player || !playerReady) return;

    if (isActive) {
      player.play();
    } else {
      player.pause();
    }
  }, [isActive, playerReady]);

  // Mute toggle
  const toggleMute = () => {
    const player = playerRef.current;
    if (player && playerReady) {
      if (isMuted) {
        player.unmute();
      } else {
        player.mute();
      }
      setIsMuted(!isMuted);
    }
  };

  if (!embedUrl) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-zinc-900">
        {video.thumbnail_url && (
          <img
            src={video.thumbnail_url}
            alt={video.title}
            className="h-full w-full object-cover"
          />
        )}
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      {/* BunnyCDN iframe */}
      <iframe
        ref={iframeRef}
        src={embedUrl}
        className="absolute inset-0 h-full w-full border-0"
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
        title={video.title}
      />

      {/* Touch passthrough overlay - scroll'un çalışması için */}
      <div
        className="absolute inset-0 z-10"
        style={{ touchAction: "pan-y" }}
      />

      {/* Mute toggle */}
      <button
        onClick={toggleMute}
        className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
      >
        {isMuted ? (
          <VolumeX className="h-5 w-5" />
        ) : (
          <Volume2 className="h-5 w-5" />
        )}
      </button>
    </div>
  );
}
