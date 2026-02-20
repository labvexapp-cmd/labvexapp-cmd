"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, RotateCcw, RotateCw } from "lucide-react";

interface VideoPlayerProps {
  videoUrl?: string;
  bunnyVideoId?: string;
  thumbnailUrl?: string;
  title: string;
  orientation: "horizontal" | "vertical" | "square";
}

const LIBRARY_ID = "603403";
const PASSTHROUGH_MS = 4000;

export function VideoPlayer({
  videoUrl,
  bunnyVideoId,
  thumbnailUrl,
  title,
  orientation,
}: VideoPlayerProps) {
  const [started, setStarted] = useState(false);
  const [passthrough, setPassthrough] = useState(false);
  const [seekAnim, setSeekAnim] = useState<null | "left" | "right">(null);
  const [tapAnim, setTapAnim] = useState<"play" | "pause" | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playerRef = useRef<any>(null);
  const lastTapRef = useRef({ time: 0, zone: "" });
  const sideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const passthroughTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resolvedBunnyId = bunnyVideoId || extractBunnyId(videoUrl);
  const embedUrl = resolvedBunnyId
    ? `https://iframe.mediadelivery.net/embed/${LIBRARY_ID}/${resolvedBunnyId}?autoplay=true&preload=true&responsive=true&pip=false`
    : null;

  const aspectClass =
    orientation === "vertical"
      ? "mx-auto aspect-[9/16] max-h-[80vh]"
      : "aspect-video w-full";

  // Gesture sonrası overlay'i 4 saniye devre dışı bırak
  // Bu sürede BunnyCDN kontrolleri (progressbar vs.) kullanılabilir
  const enablePassthrough = useCallback(() => {
    setPassthrough(true);
    if (passthroughTimer.current) clearTimeout(passthroughTimer.current);
    passthroughTimer.current = setTimeout(
      () => setPassthrough(false),
      PASSTHROUGH_MS
    );
  }, []);

  // Fullscreen → landscape (mobil)
  useEffect(() => {
    const onFs = () => {
      const so = screen.orientation as any;
      if (document.fullscreenElement) {
        so?.lock?.("landscape").catch(() => {});
      } else {
        so?.unlock?.();
      }
    };
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (passthroughTimer.current) clearTimeout(passthroughTimer.current);
      if (sideTimerRef.current) clearTimeout(sideTimerRef.current);
    };
  }, []);

  // player.js init
  useEffect(() => {
    if (!started || !iframeRef.current) return;
    let cancelled = false;
    const init = async () => {
      try {
        const playerjs = await import("player.js");
        if (cancelled || !iframeRef.current) return;
        const p = new playerjs.Player(iframeRef.current);
        p.on("ready", () => {
          if (!cancelled) playerRef.current = p;
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
  }, [started]);

  // Gesture handler
  const handleGesture = useCallback(
    (zone: "left" | "center" | "right") => {
      const now = Date.now();
      const last = lastTapRef.current;
      const isDouble = now - last.time < 300 && last.zone === zone;
      lastTapRef.current = { time: now, zone };

      const player = playerRef.current;

      // Çift tap sol → -5s
      if (isDouble && zone === "left") {
        if (sideTimerRef.current) clearTimeout(sideTimerRef.current);
        if (player) {
          player.getCurrentTime((t: number) =>
            player.setCurrentTime(Math.max(0, t - 5))
          );
        }
        setSeekAnim("left");
        setTimeout(() => setSeekAnim(null), 350);
        // Seek sonrası passthrough aç (animasyon bitince)
        setTimeout(() => enablePassthrough(), 400);
        return;
      }

      // Çift tap sağ → +5s
      if (isDouble && zone === "right") {
        if (sideTimerRef.current) clearTimeout(sideTimerRef.current);
        if (player) {
          player.getCurrentTime((t: number) => player.setCurrentTime(t + 5));
        }
        setSeekAnim("right");
        setTimeout(() => setSeekAnim(null), 350);
        setTimeout(() => enablePassthrough(), 400);
        return;
      }

      // Tek tap center → anında play/pause + passthrough
      if (zone === "center") {
        if (player) {
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
        }
        enablePassthrough();
        return;
      }

      // Tek tap sol/sağ → 350ms bekle (çift tap window geçsin), sonra passthrough
      if (sideTimerRef.current) clearTimeout(sideTimerRef.current);
      sideTimerRef.current = setTimeout(() => {
        if (lastTapRef.current.time !== now) return;
        enablePassthrough();
      }, 350);
    },
    [enablePassthrough]
  );

  // ===== RENDER =====

  if (!embedUrl) {
    return (
      <div
        className={`relative overflow-hidden rounded-xl bg-black ${aspectClass}`}
      >
        <div className="flex h-full items-center justify-center bg-gradient-to-br from-zinc-900 to-black">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/20">
              <Play className="ml-1 h-8 w-8 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">
              Video yükleniyor...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!started) {
    return (
      <div
        className={`group relative cursor-pointer overflow-hidden rounded-xl bg-black ${aspectClass}`}
        onClick={() => setStarted(true)}
      >
        {thumbnailUrl && (
          <img
            src={thumbnailUrl}
            alt={title}
            className="h-full w-full object-cover"
          />
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 transition-colors group-hover:bg-black/40">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/90 shadow-lg shadow-primary/30 transition-transform group-hover:scale-110">
            <Play className="ml-1 h-8 w-8 text-white" fill="white" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-black ${aspectClass}`}
    >
      {/* BunnyCDN iframe player */}
      <iframe
        ref={iframeRef}
        src={embedUrl}
        loading="lazy"
        className="absolute inset-0 h-full w-full border-0"
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
        title={title}
      />

      {/* Gesture overlay
          - Normal: tüm dokunmaları yakalar (gesture detection)
          - Passthrough: pointer-events-none → dokunmalar iframe'e geçer
            → BunnyCDN kontrolleri (progressbar, ses, fullscreen) erişilebilir
      */}
      <div
        className={`absolute inset-0 z-10 flex select-none ${
          passthrough ? "pointer-events-none" : "pointer-events-auto"
        }`}
      >
        <div className="flex-1" onClick={() => handleGesture("left")} />
        <div className="flex-[2]" onClick={() => handleGesture("center")} />
        <div className="flex-1" onClick={() => handleGesture("right")} />
      </div>

      {/* -5s animasyonu */}
      {seekAnim === "left" && (
        <div className="pointer-events-none absolute left-6 top-1/2 z-20 -translate-y-1/2">
          <div className="flex flex-col items-center gap-1">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/60 backdrop-blur-sm">
              <RotateCcw className="h-5 w-5 text-white" />
            </div>
            <span className="rounded-full bg-black/60 px-2 py-0.5 text-xs font-bold text-white backdrop-blur-sm">
              -5s
            </span>
          </div>
        </div>
      )}

      {/* +5s animasyonu */}
      {seekAnim === "right" && (
        <div className="pointer-events-none absolute right-6 top-1/2 z-20 -translate-y-1/2">
          <div className="flex flex-col items-center gap-1">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/60 backdrop-blur-sm">
              <RotateCw className="h-5 w-5 text-white" />
            </div>
            <span className="rounded-full bg-black/60 px-2 py-0.5 text-xs font-bold text-white backdrop-blur-sm">
              +5s
            </span>
          </div>
        </div>
      )}

      {/* Play/Pause animasyonu */}
      {tapAnim && (
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm">
            {tapAnim === "pause" ? (
              <Pause className="h-6 w-6 text-white" fill="white" />
            ) : (
              <Play className="ml-1 h-6 w-6 text-white" fill="white" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// HLS URL'den BunnyCDN video ID çıkar
function extractBunnyId(url?: string): string | null {
  if (!url) return null;
  const match = url.match(/([a-f0-9-]{36})\/playlist\.m3u8/i);
  return match?.[1] || null;
}
