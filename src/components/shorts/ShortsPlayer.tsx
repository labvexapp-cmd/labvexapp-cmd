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

  const [isMuted, setIsMuted] = useState(true);
  const [playerReady, setPlayerReady] = useState(false);
  const [passthrough, setPassthrough] = useState(false);
  const [tapAnim, setTapAnim] = useState<"play" | "pause" | null>(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

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

            // Duration al
            p.getDuration((d: number) => {
              if (!cancelled) setDuration(d);
            });

            // Zaman takibi
            p.on("timeupdate", (data: { seconds: number; duration: number }) => {
              if (!cancelled) {
                setCurrentTime(data.seconds);
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

  // Progress bar seek
  const handleSeek = useCallback(
    (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
      const player = playerRef.current;
      if (!player || !playerReady || duration <= 0) return;

      const bar = e.currentTarget;
      const rect = bar.getBoundingClientRect();
      const clientX =
        "touches" in e ? e.touches[0].clientX : e.clientX;
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const seekTime = ratio * duration;

      player.setCurrentTime(seekTime);
      setProgress(ratio);
      setCurrentTime(seekTime);
      enablePassthrough();
    },
    [playerReady, duration, enablePassthrough]
  );

  // Zaman formatla
  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
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

      {/* Gesture overlay - tap → play/pause, passthrough sonrası iframe kontrollerine erişim */}
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

      {/* Progress bar - her zaman görünür */}
      <div className="absolute bottom-0 left-0 right-0 z-20">
        {/* Zaman gösterge */}
        {duration > 0 && (
          <div className="flex items-center justify-between px-3 pb-1">
            <span className="text-[10px] font-medium text-white/70">
              {formatTime(currentTime)}
            </span>
            <span className="text-[10px] font-medium text-white/70">
              {formatTime(duration)}
            </span>
          </div>
        )}

        {/* Seekable progress bar */}
        <div
          className="group relative h-6 cursor-pointer px-1"
          onClick={handleSeek}
          onTouchStart={handleSeek}
        >
          {/* Track arka plan */}
          <div className="absolute bottom-2 left-1 right-1 h-1 rounded-full bg-white/20 transition-all group-hover:h-1.5" />

          {/* İlerleme */}
          <div
            className="absolute bottom-2 left-1 h-1 rounded-full bg-primary transition-all group-hover:h-1.5"
            style={{ width: `${progress * 100}%`, maxWidth: "calc(100% - 8px)" }}
          />

          {/* Seek handle - hover'da görünür */}
          <div
            className="absolute bottom-1 h-3 w-3 -translate-x-1/2 rounded-full bg-primary opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
            style={{ left: `calc(4px + ${progress * 100}% * (100% - 8px) / 100%)` }}
          />
        </div>
      </div>
    </div>
  );
}
