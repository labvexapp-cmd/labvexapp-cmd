"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import {
  Play,
  Pause,
  Maximize,
  Minimize,
  Volume2,
  VolumeX,
  Volume1,
  Settings,
  Subtitles,
  SkipForward,
  SkipBack,
  Loader2,
} from "lucide-react";
import { formatDuration } from "@/lib/constants";

interface VideoPlayerProps {
  videoUrl?: string; // HLS m3u8 URL from BunnyCDN
  thumbnailUrl?: string;
  title: string;
  orientation: "horizontal" | "vertical" | "square";
  subtitles?: Array<{
    src: string;
    label: string;
    language: string;
    default?: boolean;
  }>;
  scenes?: Array<{
    timestamp: number;
    thumbnailUrl: string;
    title?: string;
  }>;
}

export function VideoPlayer({
  videoUrl,
  thumbnailUrl,
  title,
  orientation,
  subtitles = [],
  scenes = [],
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  // State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverScene, setHoverScene] = useState<string | null>(null);
  const [buffered, setBuffered] = useState(0);
  const [qualities, setQualities] = useState<Array<{ height: number; index: number }>>([]);
  const [currentQuality, setCurrentQuality] = useState(-1); // -1 = auto
  const [hlsInstance, setHlsInstance] = useState<any>(null);

  const hideControlsTimer = useRef<NodeJS.Timeout | null>(null);

  // Initialize HLS.js
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrl) return;

    let hls: any = null;

    const initHls = async () => {
      // Only use HLS.js for .m3u8 streams
      if (videoUrl.includes(".m3u8")) {
        const Hls = (await import("hls.js")).default;

        if (Hls.isSupported()) {
          hls = new Hls({
            maxBufferLength: 30,
            maxMaxBufferLength: 60,
            startLevel: -1, // auto quality
          });

          hls.loadSource(videoUrl);
          hls.attachMedia(video);

          hls.on(Hls.Events.MANIFEST_PARSED, (_: any, data: any) => {
            const levels = data.levels.map((level: any, index: number) => ({
              height: level.height,
              index,
            }));
            setQualities(levels.sort((a: any, b: any) => b.height - a.height));
            setIsLoading(false);
          });

          hls.on(Hls.Events.LEVEL_SWITCHED, (_: any, data: any) => {
            setCurrentQuality(data.level);
          });

          hls.on(Hls.Events.ERROR, (_: any, data: any) => {
            if (data.fatal) {
              console.error("HLS fatal error:", data);
            }
          });

          setHlsInstance(hls);
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
          // Safari native HLS
          video.src = videoUrl;
          setIsLoading(false);
        }
      } else {
        // Direct MP4 playback
        video.src = videoUrl;
        setIsLoading(false);
      }
    };

    initHls();

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [videoUrl]);

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => setCurrentTime(video.currentTime);
    const onDurationChange = () => setDuration(video.duration);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onWaiting = () => setIsLoading(true);
    const onCanPlay = () => setIsLoading(false);
    const onProgress = () => {
      if (video.buffered.length > 0) {
        setBuffered(video.buffered.end(video.buffered.length - 1));
      }
    };

    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("durationchange", onDurationChange);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("canplay", onCanPlay);
    video.addEventListener("progress", onProgress);

    return () => {
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("durationchange", onDurationChange);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("canplay", onCanPlay);
      video.removeEventListener("progress", onProgress);
    };
  }, []);

  // Auto-hide controls
  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    if (isPlaying) {
      hideControlsTimer.current = setTimeout(() => setShowControls(false), 3000);
    }
  }, [isPlaying]);

  // Toggle play/pause
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
    resetHideTimer();
  };

  // Seek
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    const bar = progressRef.current;
    if (!video || !bar || !duration) return;

    const rect = bar.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    video.currentTime = percent * duration;
  };

  // Progress bar hover (scene preview)
  const handleProgressHover = (e: React.MouseEvent<HTMLDivElement>) => {
    const bar = progressRef.current;
    if (!bar || !duration) return;

    const rect = bar.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const time = percent * duration;
    setHoverTime(time);

    // Find matching scene
    if (scenes.length > 0) {
      const scene = scenes.reduce((prev, curr) =>
        Math.abs(curr.timestamp - time) < Math.abs(prev.timestamp - time) ? curr : prev
      );
      setHoverScene(scene.thumbnailUrl);
    }
  };

  // Volume
  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const val = parseFloat(e.target.value);
    video.volume = val;
    setVolume(val);
    setIsMuted(val === 0);
  };

  // Skip forward/back
  const skip = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(duration, video.currentTime + seconds));
  };

  // Quality change
  const changeQuality = (levelIndex: number) => {
    if (hlsInstance) {
      hlsInstance.currentLevel = levelIndex; // -1 = auto
      setCurrentQuality(levelIndex);
    }
    setShowSettings(false);
  };

  // Fullscreen
  const toggleFullscreen = async () => {
    const container = containerRef.current;
    if (!container) return;

    if (document.fullscreenElement) {
      await document.exitFullscreen();
      setIsFullscreen(false);
    } else {
      await container.requestFullscreen();
      setIsFullscreen(true);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
          break;
        case "f":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "m":
          e.preventDefault();
          toggleMute();
          break;
        case "ArrowLeft":
          e.preventDefault();
          skip(-10);
          break;
        case "ArrowRight":
          e.preventDefault();
          skip(10);
          break;
        case "ArrowUp":
          e.preventDefault();
          if (videoRef.current) {
            const newVol = Math.min(1, volume + 0.1);
            videoRef.current.volume = newVol;
            setVolume(newVol);
          }
          break;
        case "ArrowDown":
          e.preventDefault();
          if (videoRef.current) {
            const newVol = Math.max(0, volume - 0.1);
            videoRef.current.volume = newVol;
            setVolume(newVol);
          }
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [volume, isPlaying]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPercent = duration > 0 ? (buffered / duration) * 100 : 0;

  // No video URL - show placeholder
  if (!videoUrl) {
    return (
      <div
        className={`relative overflow-hidden bg-black ${
          orientation === "vertical"
            ? "mx-auto aspect-[9/16] max-h-[80vh]"
            : "aspect-video w-full"
        }`}
      >
        <div className="flex h-full items-center justify-center bg-gradient-to-br from-zinc-900 to-black">
          <div className="text-center">
            <button className="group mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/20 transition-all hover:bg-primary/30 hover:scale-110 mx-auto">
              <Play className="ml-1 h-8 w-8 text-primary" />
            </button>
            <p className="text-sm text-muted-foreground">
              Video yükleniyor...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`group relative overflow-hidden bg-black ${
        orientation === "vertical"
          ? "mx-auto aspect-[9/16] max-h-[80vh]"
          : "aspect-video w-full"
      }`}
      onMouseMove={resetHideTimer}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      onClick={togglePlay}
    >
      {/* Video element */}
      <video
        ref={videoRef}
        className="h-full w-full object-contain"
        poster={thumbnailUrl}
        playsInline
        preload="metadata"
      >
        {/* Subtitles */}
        {subtitles.map((sub) => (
          <track
            key={sub.language}
            kind="subtitles"
            src={sub.src}
            srcLang={sub.language}
            label={sub.label}
            default={sub.default}
          />
        ))}
      </video>

      {/* Loading spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      )}

      {/* Big play button (when paused) */}
      {!isPlaying && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/80 shadow-lg shadow-primary/30 transition-transform hover:scale-110">
            <Play className="ml-1 h-8 w-8 text-white" fill="white" />
          </div>
        </div>
      )}

      {/* Controls overlay */}
      <div
        className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent transition-opacity duration-300 ${
          showControls || !isPlaying ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Scene preview on hover */}
        {hoverTime !== null && hoverScene && (
          <div
            className="absolute bottom-full mb-2 -translate-x-1/2 overflow-hidden rounded-lg border border-border shadow-xl"
            style={{
              left: `${(hoverTime / duration) * 100}%`,
            }}
          >
            <img
              src={hoverScene}
              alt="Scene preview"
              className="h-20 w-36 object-cover"
            />
            <div className="bg-black/80 px-2 py-0.5 text-center text-xs text-white">
              {formatDuration(Math.floor(hoverTime))}
            </div>
          </div>
        )}

        {/* Progress bar */}
        <div
          ref={progressRef}
          className="group/progress mx-4 mb-2 h-1.5 cursor-pointer rounded-full bg-white/20 transition-all hover:h-3"
          onClick={handleSeek}
          onMouseMove={handleProgressHover}
          onMouseLeave={() => {
            setHoverTime(null);
            setHoverScene(null);
          }}
        >
          {/* Buffered */}
          <div
            className="absolute h-full rounded-full bg-white/30"
            style={{ width: `${bufferedPercent}%` }}
          />
          {/* Progress */}
          <div
            className="relative h-full rounded-full bg-primary transition-all"
            style={{ width: `${progress}%` }}
          >
            {/* Thumb */}
            <div className="absolute -right-2 -top-1 h-4 w-4 rounded-full bg-primary opacity-0 shadow-lg transition-opacity group-hover/progress:opacity-100" />
          </div>
        </div>

        {/* Control buttons */}
        <div className="flex items-center justify-between px-4 pb-3">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="text-white transition-opacity hover:opacity-80"
            >
              {isPlaying ? (
                <Pause className="h-5 w-5 sm:h-6 sm:w-6" fill="white" />
              ) : (
                <Play className="h-5 w-5 sm:h-6 sm:w-6" fill="white" />
              )}
            </button>

            {/* Skip back */}
            <button
              onClick={() => skip(-10)}
              className="hidden text-white transition-opacity hover:opacity-80 sm:block"
            >
              <SkipBack className="h-5 w-5" />
            </button>

            {/* Skip forward */}
            <button
              onClick={() => skip(10)}
              className="hidden text-white transition-opacity hover:opacity-80 sm:block"
            >
              <SkipForward className="h-5 w-5" />
            </button>

            {/* Volume */}
            <div className="group/vol flex items-center gap-1">
              <button
                onClick={toggleMute}
                className="text-white transition-opacity hover:opacity-80"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="h-5 w-5" />
                ) : volume < 0.5 ? (
                  <Volume1 className="h-5 w-5" />
                ) : (
                  <Volume2 className="h-5 w-5" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="hidden h-1 w-16 cursor-pointer appearance-none rounded-full bg-white/30 accent-primary sm:group-hover/vol:block"
              />
            </div>

            {/* Time */}
            <span className="text-xs text-white/80 sm:text-sm">
              {formatDuration(Math.floor(currentTime))}
              {" / "}
              {formatDuration(Math.floor(duration))}
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Subtitles */}
            {subtitles.length > 0 && (
              <button className="text-white transition-opacity hover:opacity-80">
                <Subtitles className="h-5 w-5" />
              </button>
            )}

            {/* Settings (quality) */}
            {qualities.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="text-white transition-opacity hover:opacity-80"
                >
                  <Settings className="h-5 w-5" />
                </button>

                {/* Quality menu */}
                {showSettings && (
                  <div className="absolute bottom-full right-0 mb-2 w-40 overflow-hidden rounded-lg border border-border bg-card/95 shadow-xl backdrop-blur">
                    <div className="border-b border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                      Kalite
                    </div>
                    <button
                      onClick={() => changeQuality(-1)}
                      className={`w-full px-3 py-1.5 text-left text-sm transition-colors hover:bg-secondary ${
                        currentQuality === -1
                          ? "text-primary"
                          : "text-foreground"
                      }`}
                    >
                      Otomatik
                    </button>
                    {qualities.map((q) => (
                      <button
                        key={q.index}
                        onClick={() => changeQuality(q.index)}
                        className={`w-full px-3 py-1.5 text-left text-sm transition-colors hover:bg-secondary ${
                          currentQuality === q.index
                            ? "text-primary"
                            : "text-foreground"
                        }`}
                      >
                        {q.height}p
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="text-white transition-opacity hover:opacity-80"
            >
              {isFullscreen ? (
                <Minimize className="h-5 w-5" />
              ) : (
                <Maximize className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
