"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, RotateCcw, RotateCw, Maximize, Minimize } from "lucide-react";

interface VideoPlayerProps {
  videoUrl?: string;
  bunnyVideoId?: string;
  thumbnailUrl?: string;
  title: string;
  orientation: "horizontal" | "vertical" | "square";
}

const LIBRARY_ID = "603403";
const CONTROLS_TIMEOUT = 4000;

export function VideoPlayer({
  videoUrl,
  bunnyVideoId,
  thumbnailUrl,
  title,
  orientation,
}: VideoPlayerProps) {
  const [started, setStarted] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [seekAnim, setSeekAnim] = useState<null | "left" | "right">(null);
  const [tapAnim, setTapAnim] = useState<"play" | "pause" | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playerRef = useRef<any>(null);
  const lastTapRef = useRef({ time: 0, zone: "" });
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const controlsVisibleRef = useRef(true);

  const resolvedBunnyId = bunnyVideoId || extractBunnyId(videoUrl);
  const embedUrl = resolvedBunnyId
    ? `https://iframe.mediadelivery.net/embed/${LIBRARY_ID}/${resolvedBunnyId}?autoplay=true&preload=true&responsive=true&pip=false`
    : null;

  const aspectClass =
    orientation === "vertical"
      ? "mx-auto aspect-[9/16] max-h-[80vh]"
      : "aspect-video w-full";

  // === Controls visibility ===
  const showControls = useCallback(() => {
    controlsVisibleRef.current = true;
    setControlsVisible(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => {
      controlsVisibleRef.current = false;
      setControlsVisible(false);
    }, CONTROLS_TIMEOUT);
  }, []);

  const hideControls = useCallback(() => {
    controlsVisibleRef.current = false;
    setControlsVisible(false);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
  }, []);

  // === Fullscreen (kendi container'ımızı fullscreen yapıyoruz) ===
  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await containerRef.current.requestFullscreen();
      }
    } catch (err) {
      console.warn("Fullscreen error:", err);
    }
  }, []);

  // Fullscreen change → landscape lock (sadece kendi container'ımız için)
  useEffect(() => {
    const onFs = () => {
      const fsElem = document.fullscreenElement;
      const isFull = fsElem === containerRef.current;
      setIsFullscreen(isFull);
      const so = screen.orientation as any;
      if (isFull) {
        so?.lock?.("landscape").catch(() => {});
      } else if (!fsElem) {
        so?.unlock?.();
      }
    };
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  // Video başladığında 4 saniye controls göster
  useEffect(() => {
    if (!started) return;
    showControls();
  }, [started, showControls]);

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

  // === Gesture handler ===
  const handleGesture = useCallback(
    (zone: "left" | "center" | "right") => {
      const now = Date.now();
      const last = lastTapRef.current;
      const isDouble = now - last.time < 300 && last.zone === zone;
      lastTapRef.current = { time: now, zone };

      const player = playerRef.current;

      // Çift tap sol → -5 saniye
      if (isDouble && zone === "left") {
        if (sideTimerRef.current) clearTimeout(sideTimerRef.current);
        if (player) {
          player.getCurrentTime((t: number) =>
            player.setCurrentTime(Math.max(0, t - 5))
          );
        }
        setSeekAnim("left");
        setTimeout(() => setSeekAnim(null), 700);
        showControls();
        return;
      }

      // Çift tap sağ → +5 saniye
      if (isDouble && zone === "right") {
        if (sideTimerRef.current) clearTimeout(sideTimerRef.current);
        if (player) {
          player.getCurrentTime((t: number) => player.setCurrentTime(t + 5));
        }
        setSeekAnim("right");
        setTimeout(() => setSeekAnim(null), 700);
        showControls();
        return;
      }

      // Tek tap center → anında play/pause + controls göster
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
            setTimeout(() => setTapAnim(null), 700);
          });
        }
        showControls();
        return;
      }

      // Tek tap sol/sağ → controls göster/gizle (300ms çift tap ayrımı)
      if (sideTimerRef.current) clearTimeout(sideTimerRef.current);
      sideTimerRef.current = setTimeout(() => {
        if (lastTapRef.current.time !== now) return;
        if (controlsVisibleRef.current) {
          hideControls();
        } else {
          showControls();
        }
      }, 300);
    },
    [showControls, hideControls]
  );

  // ===== RENDER =====

  // Video URL yoksa placeholder
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

  // Başlamadan önce thumbnail + play butonu
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

  // BunnyCDN iframe + gesture overlay
  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden bg-black ${
        isFullscreen ? "" : `rounded-xl ${aspectClass}`
      }`}
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

      {/* Gesture overlay - üst alan (BunnyCDN kontrolleri hariç) */}
      <div className="absolute top-0 right-0 left-0 bottom-14 z-10 flex select-none">
        {/* Sol bölge: çift tap = -5s, tek tap = controls toggle */}
        <div
          className="flex-1 cursor-pointer"
          onClick={() => handleGesture("left")}
        />
        {/* Orta bölge: tek tap = play/pause */}
        <div
          className="flex-[2] cursor-pointer"
          onClick={() => handleGesture("center")}
        />
        {/* Sağ bölge: çift tap = +5s, tek tap = controls toggle */}
        <div
          className="flex-1 cursor-pointer"
          onClick={() => handleGesture("right")}
        />
      </div>

      {/* Alt overlay - controls gizliyken BunnyCDN kontrollerini bloklar */}
      <div
        className={`absolute right-0 bottom-0 left-0 z-10 h-14 select-none ${
          controlsVisible
            ? "pointer-events-none"
            : "pointer-events-auto cursor-pointer"
        }`}
        onClick={() => showControls()}
      />

      {/* Fullscreen butonu - controls görünürken göster */}
      <div
        className={`absolute bottom-16 right-3 z-20 transition-opacity duration-300 ${
          controlsVisible
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFullscreen();
          }}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white/90 backdrop-blur-sm transition-colors hover:bg-black/80 hover:text-white"
        >
          {isFullscreen ? (
            <Minimize className="h-4 w-4" />
          ) : (
            <Maximize className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* -5s seek animasyonu */}
      {seekAnim === "left" && (
        <div className="pointer-events-none absolute left-6 top-1/2 z-20 -translate-y-1/2 animate-bounce">
          <div className="flex flex-col items-center gap-1">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-black/60 backdrop-blur-sm">
              <RotateCcw className="h-6 w-6 text-white" />
            </div>
            <span className="rounded-full bg-black/60 px-2 py-0.5 text-xs font-bold text-white backdrop-blur-sm">
              -5s
            </span>
          </div>
        </div>
      )}

      {/* +5s seek animasyonu */}
      {seekAnim === "right" && (
        <div className="pointer-events-none absolute right-6 top-1/2 z-20 -translate-y-1/2 animate-bounce">
          <div className="flex flex-col items-center gap-1">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-black/60 backdrop-blur-sm">
              <RotateCw className="h-6 w-6 text-white" />
            </div>
            <span className="rounded-full bg-black/60 px-2 py-0.5 text-xs font-bold text-white backdrop-blur-sm">
              +5s
            </span>
          </div>
        </div>
      )}

      {/* Play/Pause animasyonu - doğru ikon */}
      {tapAnim && (
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 animate-ping">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm">
            {tapAnim === "pause" ? (
              <Pause className="h-7 w-7 text-white" fill="white" />
            ) : (
              <Play className="ml-1 h-7 w-7 text-white" fill="white" />
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
