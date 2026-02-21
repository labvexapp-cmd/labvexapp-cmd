"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Volume2, VolumeX, Play, Pause } from "lucide-react";

const LIBRARY_ID = "603403";
const PASSTHROUGH_MS = 4000;

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
  const passthroughTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const [isMuted, setIsMuted] = useState(true);
  const [playerReady, setPlayerReady] = useState(false);
  const [passthrough, setPassthrough] = useState(false);
  const [tapAnim, setTapAnim] = useState<"play" | "pause" | null>(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);

  const bunnyId = extractBunnyId(video.video_url);
  const embedUrl = bunnyId
    ? `https://iframe.mediadelivery.net/embed/${LIBRARY_ID}/${bunnyId}?autoplay=true&preload=true&responsive=true&muted=true`
    : null;

  // Passthrough - tap sonrası iframe kontrollerine erişim
  const enablePassthrough = useCallback(() => {
    setPassthrough(true);
    if (passthroughTimer.current) clearTimeout(passthroughTimer.current);
    passthroughTimer.current = setTimeout(
      () => setPassthrough(false),
      PASSTHROUGH_MS
    );
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (passthroughTimer.current) clearTimeout(passthroughTimer.current);
    };
  }, []);

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

            p.getDuration((d: number) => {
              if (!cancelled) setDuration(d);
            });

            p.on("timeupdate", (data: { seconds: number; duration: number }) => {
              if (!cancelled) {
                setDuration(data.duration);
                if (data.duration > 0) {
                  setProgress(data.seconds / data.duration);
                }
              }
            });
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

  // Tap → play/pause + passthrough
  const handleTap = useCallback(() => {
    const player = playerRef.current;
    if (!player || !playerReady) return;

    player.getPaused((paused: boolean) => {
      if (paused) {
        player.play();
        setTapAnim("play");
      } else {
        player.pause();
        setTapAnim("pause");
      }
      setTimeout(() => setTapAnim(null), 400);
    });

    enablePassthrough();
  }, [playerReady, enablePassthrough]);

  // Mute toggle
  const toggleMute = useCallback(() => {
    const player = playerRef.current;
    if (player && playerReady) {
      if (isMuted) {
        player.unmute();
      } else {
        player.mute();
      }
      setIsMuted(!isMuted);
    }
  }, [isMuted, playerReady]);

  // --- Drag-to-seek progress bar ---
  const seekToPosition = useCallback(
    (clientX: number) => {
      const player = playerRef.current;
      const bar = progressBarRef.current;
      if (!player || !playerReady || duration <= 0 || !bar) return;

      const rect = bar.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const seekTime = ratio * duration;

      player.setCurrentTime(seekTime);
      setProgress(ratio);
    },
    [playerReady, duration]
  );

  // Mouse drag handlers
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsSeeking(true);
      seekToPosition(e.clientX);

      const onMouseMove = (ev: MouseEvent) => {
        seekToPosition(ev.clientX);
      };
      const onMouseUp = () => {
        setIsSeeking(false);
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      };

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    },
    [seekToPosition]
  );

  // Touch drag handlers
  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      e.stopPropagation();
      setIsSeeking(true);
      seekToPosition(e.touches[0].clientX);

      const bar = progressBarRef.current;
      if (!bar) return;

      const onTouchMove = (ev: TouchEvent) => {
        ev.preventDefault();
        seekToPosition(ev.touches[0].clientX);
      };
      const onTouchEnd = () => {
        setIsSeeking(false);
        bar.removeEventListener("touchmove", onTouchMove);
        bar.removeEventListener("touchend", onTouchEnd);
        bar.removeEventListener("touchcancel", onTouchEnd);
      };

      bar.addEventListener("touchmove", onTouchMove, { passive: false });
      bar.addEventListener("touchend", onTouchEnd);
      bar.addEventListener("touchcancel", onTouchEnd);
    },
    [seekToPosition]
  );

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

      {/* Gesture overlay */}
      <div
        className={`absolute inset-0 z-10 ${
          passthrough ? "pointer-events-none" : "pointer-events-auto"
        }`}
        style={{ touchAction: "pan-y" }}
        onClick={handleTap}
      />

      {/* Play/Pause animasyonu */}
      {tapAnim && (
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2 animate-in fade-in zoom-in duration-150">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm">
            {tapAnim === "pause" ? (
              <Pause className="h-7 w-7 text-white" fill="white" />
            ) : (
              <Play className="ml-1 h-7 w-7 text-white" fill="white" />
            )}
          </div>
        </div>
      )}

      {/* Mute toggle */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          toggleMute();
        }}
        className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
      >
        {isMuted ? (
          <VolumeX className="h-5 w-5" />
        ) : (
          <Volume2 className="h-5 w-5" />
        )}
      </button>

      {/* TikTok-style progress bar */}
      <div
        ref={progressBarRef}
        className="absolute bottom-0 left-0 right-0 z-20 cursor-pointer"
        style={{ touchAction: "none" }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {/* Invisible touch target (48px tall for mobile accessibility) */}
        <div className="relative h-12 flex items-end">
          {/* Track background */}
          <div
            className="relative w-full overflow-hidden transition-[height] duration-150"
            style={{ height: isSeeking ? "4px" : "2.5px" }}
          >
            {/* Unplayed track */}
            <div
              className="absolute inset-0 bg-white/25"
              style={{ filter: "drop-shadow(0 0 1px rgba(0,0,0,0.5))" }}
            />

            {/* Played progress - GPU accelerated */}
            <div
              className="absolute inset-0 origin-left bg-white transition-none"
              style={{
                transform: `scaleX(${progress})`,
                filter: "drop-shadow(0 0 1px rgba(0,0,0,0.3))",
              }}
            />
          </div>

          {/* Seek handle - only visible during drag */}
          {isSeeking && (
            <div
              className="absolute bottom-0 h-3.5 w-3.5 -translate-x-1/2 translate-y-[3px] rounded-full bg-white"
              style={{
                left: `${progress * 100}%`,
                boxShadow: "0 0 4px rgba(0,0,0,0.5)",
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
