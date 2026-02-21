"use client";

import { useState, useEffect, useRef } from "react";
import { trackView } from "@/lib/tracking";
import Link from "next/link";
import {
  ThumbsUp,
  ThumbsDown,
  Share2,
  Flag,
  Eye,
  Clock,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Heart,
  Bookmark,
  Send,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { VideoPlayer } from "@/components/video/VideoPlayer";
import {
  formatDuration,
  formatViewCount,
  formatRelativeTime,
} from "@/lib/constants";
import type { Video, Comment } from "@/types";

// Mock comments
const mockComments: Comment[] = [
  {
    id: "1",
    video_id: "1",
    user_id: "u1",
    content: "Harika bir video, kalite mükemmel!",
    like_count: 42,
    is_ai_generated: true,
    user: { username: "kullanici123", avatar_url: "" },
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: "2",
    video_id: "1",
    user_id: "u2",
    content: "Çok güzel, devamını bekliyoruz.",
    like_count: 18,
    is_ai_generated: true,
    user: { username: "izleyici456", avatar_url: "" },
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: "3",
    video_id: "1",
    user_id: "u3",
    content: "4K kalite gerçekten fark yaratıyor.",
    like_count: 7,
    is_ai_generated: true,
    user: { username: "premium_user", avatar_url: "" },
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "4",
    video_id: "1",
    user_id: "u4",
    content: "Bu star en sevdiğim, tüm videolarını izliyorum.",
    like_count: 31,
    is_ai_generated: true,
    user: { username: "fan2024", avatar_url: "" },
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
];

interface VideoPageClientProps {
  video: Video;
  relatedVideos: Video[];
}

export function VideoPageClient({ video, relatedVideos }: VideoPageClientProps) {
  const viewTracked = useRef(false);

  // Sayfa açılınca view kaydet (1 kez)
  useEffect(() => {
    if (!viewTracked.current) {
      viewTracked.current = true;
      trackView(video.id);
    }
  }, [video.id]);

  const [showFullDescription, setShowFullDescription] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [commentText, setCommentText] = useState("");

  const handleLike = () => {
    setIsLiked(!isLiked);
    if (isDisliked) setIsDisliked(false);
  };

  const handleDislike = () => {
    setIsDisliked(!isDisliked);
    if (isLiked) setIsLiked(false);
  };

  // NaN fix: 0/0 durumunu kontrol et
  const likeTotal = video.like_count + video.comment_count;
  const likePercentage = likeTotal > 0
    ? Math.round((video.like_count / likeTotal) * 100)
    : 0;

  return (
    <div className="mx-auto max-w-7xl px-0 md:px-4 py-0 md:py-4">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2">
          {/* Video Player - BunnyCDN iframe */}
          <VideoPlayer
            videoUrl={video.video_url}
            thumbnailUrl={video.thumbnail_url}
            title={video.title}
            orientation={video.orientation}
          />

          {/* Video Info */}
          <div className="px-4 md:px-0">
            {/* Title */}
            <h1 className="mt-3 text-lg font-bold leading-tight text-foreground md:text-xl">
              {video.title}
            </h1>

            {/* Meta row */}
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {formatViewCount(video.view_count)} görüntülenme
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {formatDuration(video.duration)}
              </span>
              <span>{formatRelativeTime(video.created_at)}</span>
              {video.quality && (
                <Badge
                  variant="secondary"
                  className={`text-xs font-bold ${
                    video.quality === "4K"
                      ? "bg-amber-accent/90 text-black"
                      : video.quality === "FHD"
                        ? "bg-primary/90 text-white"
                        : "bg-secondary/90 text-foreground"
                  }`}
                >
                  {video.quality === "FHD" ? "1080p" : video.quality}
                </Badge>
              )}
            </div>

            {/* Action buttons */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button
                variant={isLiked ? "default" : "outline"}
                size="sm"
                onClick={handleLike}
                className="gap-1.5"
              >
                <ThumbsUp className="h-4 w-4" />
                <span>
                  {formatViewCount(video.like_count + (isLiked ? 1 : 0))}
                </span>
              </Button>
              <Button
                variant={isDisliked ? "destructive" : "outline"}
                size="sm"
                onClick={handleDislike}
              >
                <ThumbsDown className="h-4 w-4" />
              </Button>

              {/* Like bar */}
              {likePercentage > 0 && (
                <div className="hidden items-center gap-2 sm:flex">
                  <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${likePercentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    %{likePercentage}
                  </span>
                </div>
              )}

              <div className="ml-auto flex items-center gap-2">
                <Button
                  variant={isSaved ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIsSaved(!isSaved)}
                  className="gap-1.5"
                >
                  <Bookmark
                    className={`h-4 w-4 ${isSaved ? "fill-current" : ""}`}
                  />
                  <span className="hidden sm:inline">Kaydet</span>
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Share2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Paylaş</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                >
                  <Flag className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Separator className="my-4" />

            {/* Stars section - TÜM starlar gösteriliyor */}
            {video.stars.length > 0 && (
              <>
                <div className="space-y-2">
                  {video.stars.map((star) => (
                    <Link
                      key={star.id}
                      href={`/star/${star.slug}`}
                      className="flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-secondary/50"
                    >
                      {star.avatar_url ? (
                        <img
                          src={star.avatar_url}
                          alt={star.name}
                          className="h-12 w-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary/30 to-accent/30 text-lg font-bold text-primary">
                          {star.name.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground">{star.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {star.video_count} video &middot;{" "}
                          {formatViewCount(star.view_count)} görüntülenme
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="shrink-0 gap-1.5"
                        onClick={(e) => e.preventDefault()}
                      >
                        <Heart className="h-4 w-4" />
                        <span className="hidden sm:inline">Takip Et</span>
                      </Button>
                    </Link>
                  ))}
                </div>
                <Separator className="my-4" />
              </>
            )}

            {/* Categories */}
            {video.categories.length > 0 && (
              <div className="mb-3">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Kategoriler
                </h3>
                <div className="flex flex-wrap gap-2">
                  {video.categories.map((cat) => (
                    <Link key={cat.id} href={`/kategori/${cat.slug}`}>
                      <Badge
                        variant="outline"
                        className="cursor-pointer px-3 py-1 text-sm transition-colors hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                      >
                        {cat.name}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {video.description && (
              <div className="mt-3 rounded-lg bg-secondary/30 p-3">
                <div
                  className={`text-sm text-muted-foreground leading-relaxed ${
                    !showFullDescription ? "line-clamp-3" : ""
                  }`}
                >
                  {video.description}
                </div>
                {video.description.length > 150 && (
                  <button
                    onClick={() => setShowFullDescription(!showFullDescription)}
                    className="mt-2 flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >
                    {showFullDescription ? (
                      <>
                        Daha az göster <ChevronUp className="h-3 w-3" />
                      </>
                    ) : (
                      <>
                        Devamını göster <ChevronDown className="h-3 w-3" />
                      </>
                    )}
                  </button>
                )}
              </div>
            )}

            <Separator className="my-4" />

            {/* Comments Section */}
            <div className="mb-8">
              <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
                <MessageSquare className="h-5 w-5" />
                Yorumlar ({mockComments.length})
              </h2>

              {/* Comment input */}
              <div className="mb-4 flex gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold text-muted-foreground">
                  <User className="h-4 w-4" />
                </div>
                <div className="flex flex-1 gap-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Yorum yaz..."
                    className="flex-1 rounded-lg border border-border bg-secondary/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  />
                  <Button size="sm" disabled={!commentText.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Comment list */}
              <div className="space-y-4">
                {mockComments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-accent/20 text-sm font-bold text-primary">
                      {comment.user.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">
                          {comment.user.username}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatRelativeTime(comment.created_at)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {comment.content}
                      </p>
                      <div className="mt-1 flex items-center gap-3">
                        <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
                          <ThumbsUp className="h-3 w-3" />
                          {comment.like_count}
                        </button>
                        <button className="text-xs text-muted-foreground hover:text-primary">
                          Yanıtla
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar - Related Videos */}
        <div className="px-4 md:px-0">
          <h2 className="mb-3 text-base font-semibold text-foreground">
            İlgili Videolar
          </h2>
          <div className="space-y-3">
            {relatedVideos.map((rv) => (
              <RelatedVideoCard key={rv.id} video={rv} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Related video card with actual thumbnail
function RelatedVideoCard({ video }: { video: Video }) {
  const [imgError, setImgError] = useState(false);

  return (
    <Link
      href={`/video/${video.slug}`}
      className="group flex gap-3 rounded-lg p-1.5 transition-colors hover:bg-secondary/50"
    >
      {/* Thumbnail */}
      <div className="relative h-20 w-36 shrink-0 overflow-hidden rounded-lg bg-secondary">
        {video.thumbnail_url && !imgError ? (
          <img
            src={video.thumbnail_url}
            alt={video.title}
            loading="lazy"
            onError={() => setImgError(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-secondary to-muted">
            <svg
              viewBox="0 0 24 24"
              className="h-6 w-6 text-muted-foreground/30"
              fill="currentColor"
            >
              <polygon points="6 3 20 12 6 21 6 3" />
            </svg>
          </div>
        )}
        <div className="absolute bottom-1 right-1 rounded bg-black/80 px-1 py-0.5 text-[10px] font-medium text-white">
          {formatDuration(video.duration)}
        </div>
      </div>
      {/* Info */}
      <div className="flex-1 overflow-hidden">
        <h3 className="line-clamp-2 text-sm font-medium leading-snug text-foreground transition-colors group-hover:text-primary">
          {video.title}
        </h3>
        {video.stars[0] && (
          <p className="mt-0.5 line-clamp-1 text-xs text-primary/70">
            {video.stars.map((s) => s.name).join(", ")}
          </p>
        )}
        <p className="mt-0.5 text-xs text-muted-foreground">
          {formatViewCount(video.view_count)} &middot;{" "}
          {formatRelativeTime(video.created_at)}
        </p>
      </div>
    </Link>
  );
}
